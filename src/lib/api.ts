import{properties,Property}from"../data/properties";

export async function getProperties():Promise<Property[]>{
  try{
    const r=await fetch("/api/properties");
    if(r.ok)return await r.json();
  }catch{}
  return properties;
}

export async function sendInquiry(payload:Record<string,string>){
  const r=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  if(!r.ok)throw new Error("Unable to send inquiry");
  return r.json();
}

export async function createCheckoutSession(propertyId:string,bookingDate:string,bookingTime:string){
  const r=await fetch("/api/create-checkout-session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({propertyId,bookingDate,bookingTime})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error||"Checkout is not configured");
  return data;
}

export async function getCheckoutSession(sessionId:string){
  const r=await fetch("/api/checkout-session?session_id="+encodeURIComponent(sessionId));
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error||"Unable to verify checkout");
  return data;
}