import type{VercelRequest,VercelResponse}from"@vercel/node";
import Stripe from"stripe";
import{properties}from"../src/data/properties";

const SITE_URL=process.env.SITE_URL||"https://b-1-o.github.io/build";
const setCors=(req:VercelRequest,res:VercelResponse)=>{
  const requestOrigin=typeof req.headers.origin==="string"?req.headers.origin:"";
  const allowed=requestOrigin==="https://b-1-o.github.io"||requestOrigin.includes(".vercel.app")?requestOrigin:"https://b-1-o.github.io";
  res.setHeader("Access-Control-Allow-Origin",allowed);
  res.setHeader("Vary","Origin");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
};

export default async function handler(req:VercelRequest,res:VercelResponse){
  setCors(req,res);
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const{propertyId,bookingDate,bookingTime}=req.body||{};
  const property=properties.find(p=>p.id===propertyId);
  if(!property)return res.status(404).json({error:"Property not found"});
  if(property.status!=="available")return res.status(409).json({error:"This residence is not currently available"});
  if(!bookingDate||!bookingTime)return res.status(400).json({error:"Select a viewing date and time"});
  if(!process.env.STRIPE_SECRET_KEY)return res.status(503).json({error:"Stripe is not configured. Add STRIPE_SECRET_KEY in Vercel."});
  try{
    const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
    const base=SITE_URL.replace(/\/$/,"");
    const session=await stripe.checkout.sessions.create({
      mode:"payment",
      customer_creation:"always",
      billing_address_collection:"required",
      phone_number_collection:{enabled:true},
      line_items:[{
        price_data:{
          currency:"usd",
          product_data:{
            name:`Northline private viewing — ${property.name}`,
            description:`${property.location} · ${bookingDate} · ${bookingTime}`
          },
          unit_amount:5000
        },
        quantity:1
      }],
      success_url:`${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:`${base}/checkout/cancel`,
      metadata:{
        propertyId:property.id,
        propertyName:property.name,
        bookingDate,
        bookingTime,
        deposit:"50.00 USD"
      },
      submit_type:"pay"
    });
    return res.status(200).json({url:session.url});
  }catch{
    return res.status(502).json({error:"Stripe could not create the checkout session"});
  }
}