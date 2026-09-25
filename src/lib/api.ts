import{properties,Property}from"../data/properties";
const BASE=import.meta.env.BASE_URL.replace(/\/$/,"");
const STATIC_DEMO=BASE!=="/";
const apiPath=(path:string)=>`${BASE}${path}`;

export async function getProperties():Promise<Property[]>{
  if(STATIC_DEMO)return properties;
  try{
    const r=await fetch(apiPath("/api/properties"));
    if(r.ok)return await r.json();
  }catch{}
  return properties;
}

export async function sendInquiry(payload:Record<string,string>){
  if(STATIC_DEMO)return{ok:true,demo:true};
  const r=await fetch(apiPath("/api/contact"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error||"Unable to send inquiry");
  return data;
}

export async function createCheckoutSession(propertyId:string,bookingDate:string,bookingTime:string){
  if(STATIC_DEMO)return{demo:true,demoPath:`/checkout/demo?propertyId=${encodeURIComponent(propertyId)}&date=${encodeURIComponent(bookingDate)}&time=${encodeURIComponent(bookingTime)}`};
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

export async function sendAssistantMessage(payload:{
  messages:{role:"user"|"assistant";content:string}[];
  properties:Property[];
  now:string;
}):Promise<{ok:boolean;reply?:string;fallback?:boolean}>{
  if(STATIC_DEMO)return{ok:false,fallback:true};
  try{
    const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)return{ok:false,fallback:true};
    return data;
  }catch{
    return{ok:false,fallback:true};
  }
}
