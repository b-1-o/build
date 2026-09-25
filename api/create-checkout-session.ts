import type{VercelRequest,VercelResponse}from"@vercel/node";
import Stripe from"stripe";
import{properties}from"../src/data/properties";

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const{propertyId,bookingDate,bookingTime}=req.body||{};
  const property=properties.find(p=>p.id===propertyId);
  if(!property)return res.status(404).json({error:"Property not found"});
  if(property.status!=="available")return res.status(409).json({error:"This residence is not currently available"});
  if(!bookingDate||!bookingTime)return res.status(400).json({error:"Select a viewing date and time"});
  if(!process.env.STRIPE_SECRET_KEY)return res.status(503).json({error:"Stripe is not configured. Add STRIPE_SECRET_KEY."});

  const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
  try{
    const session=await stripe.checkout.sessions.create({
      mode:"payment",
      line_items:[{
        price_data:{
          currency:"usd",
          product_data:{name:`Northline private viewing — ${property.name}`,description:`${bookingDate} at ${bookingTime}`},
          unit_amount:5000
        },
        quantity:1
      }],
      success_url:`${process.env.SITE_URL||"http://localhost:5173"}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:`${process.env.SITE_URL||"http://localhost:5173"}/checkout/cancel`,
      metadata:{propertyId:property.id,bookingDate,bookingTime}
    });
    return res.status(200).json({url:session.url});
  }catch{
    return res.status(502).json({error:"Stripe could not create the checkout session"});
  }
}