import type{VercelRequest,VercelResponse}from"@vercel/node";
import Stripe from"stripe";

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
  const sessionId=typeof req.query.session_id==="string"?req.query.session_id:"";
  if(!sessionId)return res.status(400).json({error:"session_id is required"});
  if(!process.env.STRIPE_SECRET_KEY)return res.status(503).json({error:"Stripe is not configured"});
  try{
    const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
    const session=await stripe.checkout.sessions.retrieve(sessionId);
    return res.status(200).json({
      status:session.status,
      payment_status:session.payment_status,
      propertyId:session.metadata?.propertyId||null,
      bookingDate:session.metadata?.bookingDate||null,
      bookingTime:session.metadata?.bookingTime||null
    });
  }catch{
    return res.status(404).json({error:"Checkout session not found"});
  }
}