import type{VercelRequest,VercelResponse}from"@vercel/node";

const clean=(value:unknown)=>String(value??"").replace(/[<>]/g,"").trim().slice(0,4000);

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const body=req.body||{};
  const name=clean(body.name),email=clean(body.email),interest=clean(body.interest),message=clean(body.message),property=clean(body.property);
  if(!name||!email)return res.status(400).json({error:"Name and email are required"});
  if(!/^\S+@\S+\.\S+$/.test(email))return res.status(400).json({error:"Enter a valid email address"});
  const key=process.env.RESEND_API_KEY;
  if(!key)return res.status(200).json({ok:true,demo:true,message:"Inquiry accepted in demo mode"});
  const to=process.env.CONTACT_TO_EMAIL;
  if(!to)return res.status(500).json({error:"CONTACT_TO_EMAIL is not configured"});
  try{
    const response=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        from:process.env.CONTACT_FROM_EMAIL||"Northline <onboarding@resend.dev>",
        to:[to],
        reply_to:email,
        subject:`Northline inquiry — ${name}`,
        html:`<h2>New Northline inquiry</h2><p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Interest:</b> ${interest||"—"}</p><p><b>Property:</b> ${property||"—"}</p><p><b>Message:</b> ${message||"—"}</p>`
      })
    });
    if(!response.ok)return res.status(502).json({error:"Email provider rejected the request"});
    return res.status(200).json({ok:true});
  }catch{
    return res.status(502).json({error:"Email provider is unavailable"});
  }
}