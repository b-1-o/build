import type{VercelRequest,VercelResponse}from"@vercel/node";
import Stripe from"stripe";

const setCors=(req:VercelRequest,res:VercelResponse)=>{
  const requestOrigin=typeof req.headers.origin==="string"?req.headers.origin:"";
  const allowed=requestOrigin==="https://b-1-o.github.io"||requestOrigin.includes(".vercel.app")?requestOrigin:"https://b-1-o.github.io";
  res.setHeader("Access-Control-Allow-Origin",allowed);
  res.setHeader("Vary","Origin");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.setHeader("Access-Control-Allow-Methods","GET, OPTIONS");
};
export default async function handler(req:VercelRequest,res:VercelResponse){
  setCors(req,res);
  if(req.method==="OPTIONS")return res.status(204).end();
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
      amount_total:session.amount_total,
      currency:session.currency,
      customer_email:session.customer_details?.email||null,
      customer_name:session.customer_details?.name||null,
      propertyId:session.metadata?.propertyId||null,
      propertyName:session.metadata?.propertyName||null,
      bookingDate:session.metadata?.bookingDate||null,
      bookingTime:session.metadata?.bookingTime||null
    });
  }catch{
    return res.status(404).json({error:"Checkout session not found"});
  }
}