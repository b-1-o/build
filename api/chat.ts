import type{VercelRequest,VercelResponse}from"@vercel/node";
import{generateText,Output}from"ai";
import{z}from"zod";
import{properties}from"../src/data/properties";

type ChatMessage={role:"user"|"assistant";content:string};
type Profile={
  budgetMax:number|null;
  monthlyMax:number|null;
  city:string|null;
  type:"house"|"apartment"|"any"|null;
  minBedrooms:number|null;
  purpose:"buy"|"compare"|"view"|"explore"|null;
  features:string[];
  timeline:string|null;
};
const catalog=properties.map(p=>({
  id:p.id,slug:p.slug,name:p.name,city:p.city,location:p.location,price:p.price,type:p.type,status:p.status,
  bedrooms:p.bedrooms,bathrooms:p.bathrooms,area:p.area,year:p.year,description:p.description,features:p.features
}));

const outputText=(data:any)=>{
  if(typeof data?.output_text==="string")return data.output_text.trim();
  const parts:string[]=[];
  for(const item of data?.output||[])for(const content of item?.content||[])
    if(content?.type==="output_text"&&typeof content.text==="string")parts.push(content.text);
  return parts.join("\n").trim();
};

const estimateMonthly=(price:number,down=20,rate=6.25,years=30)=>{
  const loan=price*(1-down/100),monthly=rate/1200,n=years*12;
  return monthly?loan*monthly*Math.pow(1+monthly,n)/(Math.pow(1+monthly,n)-1):loan/n;
};

const maxPriceFromMonthly=(monthlyMax:number,down=20,rate=6.25,years=30)=>{
  const r=rate/1200,n=years*12;
  const loan=monthlyMax*(Math.pow(1+r,n)-1)/(r*Math.pow(1+r,n));
  return loan/(1-down/100);
};

const responseSchema=z.object({
  message:z.string(),
  question:z.string().nullable(),
  action:z.enum(["none","open_property","browse_properties","open_viewing"]),
  navigateTo:z.string().nullable(),
  propertySlugs:z.array(z.string()).max(4),
  profile:z.object({
    budgetMax:z.number().nullable(),
    monthlyMax:z.number().nullable(),
    city:z.string().nullable(),
    type:z.enum(["house","apartment","any"]).nullable(),
    minBedrooms:z.number().nullable(),
    purpose:z.enum(["buy","compare","view","explore"]).nullable(),
    features:z.array(z.string()).max(8),
    timeline:z.string().nullable()
  }),
  mortgage:z.object({
    homePrice:z.number().nullable(),
    downPercent:z.number().nullable(),
    rate:z.number().nullable(),
    years:z.number().nullable(),
    monthly:z.number().nullable()
  })
});
export default async function handler(req:VercelRequest,res:VercelResponse){
  const origin=req.headers.origin||"";
  const allowedOrigin=origin==="https://b-1-o.github.io"||origin.endsWith(".vercel.app")?origin:"https://b-1-o.github.io";
  res.setHeader("Access-Control-Allow-Origin",allowedOrigin);
  res.setHeader("Vary","Origin");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});

  const body=req.body||{};
  const messages=Array.isArray(body.messages)?body.messages.slice(-16):[];
  const incomingProfile:Profile={
    budgetMax:typeof body.profile?.budgetMax==="number"?body.profile.budgetMax:null,
    monthlyMax:typeof body.profile?.monthlyMax==="number"?body.profile.monthlyMax:null,
    city:typeof body.profile?.city==="string"?body.profile.city:null,
    type:["house","apartment","any"].includes(body.profile?.type)?body.profile.type:null,
    minBedrooms:typeof body.profile?.minBedrooms==="number"?body.profile.minBedrooms:null,
    purpose:["buy","compare","view","explore"].includes(body.profile?.purpose)?body.profile.purpose:null,
    features:Array.isArray(body.profile?.features)?body.profile.features.slice(0,8):[],
    timeline:typeof body.profile?.timeline==="string"?body.profile.timeline:null
  };
  const now=typeof body.now==="string"?body.now:new Date().toISOString();
  if(!messages.length)return res.status(400).json({error:"A conversation is required"});

  const system=`You are the Northline AI property concierge. You are not a FAQ bot. Your job is to have a natural sales-assistant style conversation that actually helps a visitor find a residence.

IMPORTANT BEHAVIOR
- Understand Russian and English naturally, including slang, short replies, typos and follow-ups like "да", "в LA", "$1.5m", "2 спальни", "мне всё равно".
- Remember the visitor's answers through the supplied profile. Never ask for information they already gave.
- Ask at most ONE useful question per turn. Prefer a short, human question such as "What purchase budget are you comfortable with?" or "Do you want Los Angeles, coastal California, or are you open to any city?"
- Do not interrogate the visitor with a questionnaire. Make progress each turn.
- If enough information is available, recommend concrete residences and explain why they fit.
- If the visitor gives a monthly housing budget, use it as monthlyMax and reason using the standard estimate below. Do not confuse monthly budget with purchase price.
- If the visitor gives a total purchase budget, use budgetMax.
- Default mortgage assumptions only when needed: 20% down, 6.25% annual interest, 30 years, principal and interest only.
- For viewing availability, only residences with status "available" are bookable. Demo viewing slots are Monday-Friday at 10:00 AM, 11:30 AM, 1:00 PM, 2:30 PM and 4:00 PM. The current local timestamp is ${now}.
- If the user names one exact residence and asks about it, identify its exact slug and put it in propertySlugs.
- Set action=open_property and navigateTo="/property/<slug>" only when the user clearly asks to open, view, see details, or continue with that specific residence. Do not auto-navigate during simple comparisons.
- Set action=open_viewing and navigateTo="/property/<slug>" when the user clearly wants to schedule or see the viewing flow for a specific available residence.
- Set action=browse_properties and navigateTo="/properties" when the user asks to browse/search the catalog generally.
- Keep message natural: normally 1-4 short paragraphs, not a wall of text.
- Never invent a property, price, availability, feature, address or appointment.
- If no exact match exists, say so and offer the closest valid options.

CONVERSATION PROFILE FROM EARLIER TURNS
${JSON.stringify(incomingProfile)}

CATALOG
${JSON.stringify(catalog)}

Return JSON matching the supplied schema. The "question" field is the single next question when one is useful; otherwise null. "propertySlugs" should contain up to 4 real matching slugs. "navigateTo" must be a real path or null.

When calculating a mortgage, put the chosen home's exact price in mortgage.homePrice and the final estimated payment in mortgage.monthly. If no mortgage calculation is relevant, all mortgage fields should be null.`;

  const input=[
    {role:"system",content:system},
    ...messages.map((m:ChatMessage)=>({role:m.role,content:m.content}))
  ];

  try{
    const result=await generateText({
      model:process.env.OPENAI_MODEL||"openai/gpt-5.5",
      system,
      messages:messages.map((m:ChatMessage)=>({role:m.role,content:m.content})),
      output:Output.object({schema:responseSchema}),
      maxOutputTokens:900
    });

    const structured=result.output;
    const validSlugs=new Set(properties.map(p=>p.slug));
    structured.propertySlugs=structured.propertySlugs.filter((slug:string)=>validSlugs.has(slug)).slice(0,4);

    if(structured.mortgage.homePrice&&structured.mortgage.downPercent&&structured.mortgage.rate&&structured.mortgage.years){
      structured.mortgage.monthly=Math.round(estimateMonthly(
        Number(structured.mortgage.homePrice),
        Number(structured.mortgage.downPercent),
        Number(structured.mortgage.rate),
        Number(structured.mortgage.years)
      ));
    }

    return res.status(200).json({ok:true,...structured});
  }catch{
    return res.status(502).json({error:"Unable to reach the AI assistant"});
  }
}
