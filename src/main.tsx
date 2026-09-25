import React,{useEffect,useMemo,useState}from"react";
import{createRoot}from"react-dom/client";
import{AnimatePresence,motion}from"framer-motion";
import{ArrowLeft,ArrowUpRight,Menu,X,MapPin,BedDouble,Bath,Maximize,Search,Check,ChevronDown,CalendarDays,Clock,ShieldCheck,Mail,MessageCircle,Building2,Home as HomeIcon,Layers3}from"lucide-react";
import{properties,projects,Property}from"./data/properties";
import{createCheckoutSession,getCheckoutSession,getProperties,sendInquiry,sendAssistantMessage,AssistantProfile}from"./lib/api";
import"./styles.css";

const BASE=import.meta.env.BASE_URL.replace(/\/$/,"");
const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const img=(id:string)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1800&q=88`;
const go=(path:string)=>{window.history.pushState({}, "", BASE+path);window.dispatchEvent(new PopStateEvent("popstate"));window.scrollTo({top:0,behavior:"auto"})};

const VIEWING_SLOTS=["10:00 AM","11:30 AM","1:00 PM","2:30 PM","4:00 PM"];
const normalizeText=(value:string)=>value.toLowerCase().replace(/[^a-z0-9а-яё]+/gi," ").trim();
const monthlyPayment=(price:number,down=20,rate=6.25,years=30)=>{
  const loan=price*(1-down/100),monthly=rate/1200,n=years*12;
  return monthly?loan*monthly*Math.pow(1+monthly,n)/(Math.pow(1+monthly,n)-1):loan/n;
};
const nextViewing=(p?:Property)=>{
  if(p?.status!=="available")return null;
  const now=new Date();
  const currentMinutes=now.getHours()*60+now.getMinutes();
  for(let offset=0;offset<21;offset++){
    const d=new Date(now);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate()+offset);
    const weekday=d.getDay();
    if(weekday===0||weekday===6)continue;
    for(const slot of VIEWING_SLOTS){
      const [raw,period]=slot.split(" ");
      let [h,m]=raw.split(":").map(Number);
      if(period==="PM"&&h!==12)h+=12;
      if(period==="AM"&&h===12)h=0;
      if(offset===0&&h*60+m<=currentMinutes)continue;
      return{
        iso:d.toISOString().slice(0,10),
        label:d.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}),
        time:slot
      };
    }
  }
  return null;
};
const parseBudget=(text:string)=>{
  const match=text.match(/\$?\s*(\d+(?:[.,]\d+)?)\s*(m|million|mln|k|thousand)?/i);
  if(!match)return null;
  const raw=match[1],unit=(match[2]||"").toLowerCase();
  let value:number;
  if(raw.includes(",")&&raw.includes("."))value=Number(raw.replace(/,/g,""));
  else if(raw.includes(",")&&unit){
    const tail=raw.split(",")[1]||"";
    value=tail.length<=2?Number(raw.replace(",", ".")):Number(raw.replace(/,/g,""));
  }else{
    value=Number(raw.replace(/,/g,""));
  }
  if(!Number.isFinite(value))return null;
  if(unit==="m"||unit==="million"||unit==="mln")return value*1_000_000;
  if(unit==="k"||unit==="thousand")return value*1_000;
  return value>100000?value:null;
};

const nav=[["/","Home"],["/properties","Properties"],["/projects","Projects"],["/about","About"],["/contact","Contact"]] as const;

function LinkButton({to,children,className="",onClick}:{to:string;children:React.ReactNode;className?:string;onClick?:()=>void}){
  return <a className={className} href={BASE+to} onClick={e=>{e.preventDefault();onClick?.();go(to)}}>{children}</a>
}

function Header(){
  const[open,setOpen]=useState(false);
  const[path,setPath]=useState(window.location.pathname.replace(new RegExp("^"+BASE),"")||"/");
  useEffect(()=>{const h=()=>setPath(window.location.pathname.replace(new RegExp("^"+BASE),"")||"/");addEventListener("popstate",h);return()=>removeEventListener("popstate",h)},[]);
  const lightHeader=path!=="/";
  return <><header className={lightHeader?"siteHeader lightHeader":"siteHeader"}><LinkButton to="/" className="brand"><span>NORTHLINE</span><small>DEVELOPMENT</small></LinkButton><nav className="desktopNav">{nav.map(([to,label])=><LinkButton key={to} to={to} className={path===to?"active":""}>{label}</LinkButton>)}</nav><LinkButton to="/contact" className="headerCta">Private viewing <ArrowUpRight size={15}/></LinkButton><button className="menuButton" aria-label="Open navigation" onClick={()=>setOpen(v=>!v)}>{open?<X/>:<Menu/>}</button></header>{open&&<motion.div className="mobileNav" initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}>{nav.map(([to,label])=><LinkButton key={to} to={to} className={path===to?"active":""} onClick={()=>setOpen(false) as any}>{label}</LinkButton>)}</motion.div>}</>
}

function Footer(){
  return <footer><div><span className="brand"><span>NORTHLINE</span><small>DEVELOPMENT</small></span><p>Contemporary residences and considered development across California.</p></div><div className="footerCols"><div><small>EXPLORE</small><LinkButton to="/properties">Properties</LinkButton><LinkButton to="/projects">Projects</LinkButton></div><div><small>COMPANY</small><LinkButton to="/about">About</LinkButton><LinkButton to="/contact">Contact</LinkButton></div><div><small>SUPPORT</small><a href="mailto:support@northline.demo">Email support</a><span>Mon–Fri · 9–6 PT</span></div></div><div className="footerBottom"><span>© 2026 Northline Development</span><span>Los Angeles · California</span></div></footer>
}

function Page({eyebrow,title,children,dark=false}:{eyebrow:string;title:React.ReactNode;children:React.ReactNode;dark?:boolean}){
  return <div className={dark?"page darkPage":"page"}><section className="pageHero"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></section>{children}</div>
}

function SectionHead({eyebrow,title,sub}:{eyebrow:string;title:React.ReactNode;sub?:string}){
  return <div className="sectionHead"><div><p className="eyebrow dark">{eyebrow}</p><h2>{title}</h2></div>{sub&&<p>{sub}</p>}</div>
}

function PropertyCard({p,onOpen}:{p:Property;onOpen?:()=>void}){
  return <motion.article className="propertyCard" onClick={onOpen?onOpen:()=>go("/property/"+p.slug)} whileHover={{y:-5}}>
    <div className="propertyImage"><img src={p.image} loading="lazy" alt={p.name}/><span>{p.status==="available"?"AVAILABLE":p.status.toUpperCase()}</span><button aria-label={"Open "+p.name} onClick={e=>{e.stopPropagation();go("/property/"+p.slug)}}><ArrowUpRight/></button></div>
    <div className="propertyMeta"><div><h3>{p.name}</h3><p>{p.location}</p></div><strong>{money(p.price)}</strong></div>
    <div className="propertySpecs"><span><BedDouble size={14}/>{p.bedrooms} beds</span><span><Bath size={14}/>{p.bathrooms} baths</span><span><Maximize size={14}/>{p.area.toLocaleString()} sq ft</span></div>
  </motion.article>
}

function Gallery({p}:{p:Property}){
  const[index,setIndex]=useState(0);
  return <div className="gallery"><AnimatePresence mode="wait"><motion.img key={p.gallery[index]} src={p.gallery[index]} alt={p.name+" view "+(index+1)} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.25}}/></AnimatePresence><div className="galleryThumbs">{p.gallery.map((src,i)=><button className={i===index?"active":""} key={src} onClick={()=>setIndex(i)}><img src={src} alt=""/></button>)}</div></div>
}

function Mortgage({price}:{price:number}){
  const[down,setDown]=useState(20),[rate,setRate]=useState(6.25),[years,setYears]=useState(30);
  const loan=price*(1-down/100),monthly=rate/1200,n=years*12,p=monthly?loan*monthly*Math.pow(1+monthly,n)/(Math.pow(1+monthly,n)-1):loan/n;
  return <div className="mortgage"><div className="rangeLine"><span>Down payment</span><b>{down}%</b></div><input type="range" min="5" max="50" value={down} onChange={e=>setDown(+e.target.value)}/><div className="rangeLine"><span>Interest rate</span><b>{rate.toFixed(2)}%</b></div><input type="range" min="3" max="10" step=".05" value={rate} onChange={e=>setRate(+e.target.value)}/><div className="rangeLine"><span>Term</span><b>{years} years</b></div><input type="range" min="10" max="30" step="5" value={years} onChange={e=>setYears(+e.target.value)}/><div className="paymentLine"><span>Estimated monthly</span><strong>{money(Math.round(p))}</strong></div><small>Principal and interest only; taxes, insurance and HOA are excluded.</small></div>
}

function Booking({p,onReserve}:{p:Property;onReserve:(date:string,time:string)=>Promise<void>}){
  const days=useMemo(()=>Array.from({length:14},(_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+i+1);return d}),[]);
  const[date,setDate]=useState(days[0].toISOString().slice(0,10)),[time,setTime]=useState("10:00 AM"),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const slots=["10:00 AM","11:30 AM","1:00 PM","2:30 PM","4:00 PM"];
  const submit=async()=>{setBusy(true);setError("");try{await onReserve(date,time)}catch(e){setError(e instanceof Error?e.message:"Unable to continue")};setBusy(false)};
  return <div className="bookingCard"><div className="bookingTop"><div><p className="eyebrow dark">PRIVATE VIEWING</p><h3>Select your time</h3></div><CalendarDays/></div><div className="dateScroller">{days.map(d=>{const value=d.toISOString().slice(0,10);return <button key={value} className={value===date?"selected":""} onClick={()=>setDate(value)}><small>{d.toLocaleDateString("en-US",{weekday:"short"})}</small><b>{d.getDate()}</b><span>{d.toLocaleDateString("en-US",{month:"short"})}</span></button>})}</div><div className="slotGrid">{slots.map(s=><button key={s} className={time===s?"selected":""} onClick={()=>setTime(s)}><Clock size={13}/>{s}</button>)}</div><div className="checkoutRow"><div><strong>$50</strong><span>viewing deposit</span></div><button className="solid" disabled={busy||p.status!=="available"} onClick={submit}>{busy?"Opening checkout…":"Continue to checkout"}<ArrowUpRight size={16}/></button></div>{error&&<p className="error">{error}</p>}<div className="secureNote"><ShieldCheck size={14}/><span>Secure Stripe checkout. Your card details are entered on Stripe, not on this site.</span></div></div>
}

function MapPanel(){
  const mapsUrl="https://www.google.com/maps/search/?api=1&query=555+W+5th+St+Los+Angeles+CA+90013";
  return <div className="mapPanel"><iframe title="Downtown Los Angeles map reference" loading="lazy" src="https://www.google.com/maps?q=555+W+5th+St,+Los+Angeles,+CA+90013&output=embed"/><div className="mapCaption"><div><p className="eyebrow dark">MAP REFERENCE</p><strong>Downtown Los Angeles</strong><span>555 W 5th St · Los Angeles, CA 90013</span></div><a href={mapsUrl} target="_blank" rel="noreferrer">Open in Google Maps <ArrowUpRight size={14}/></a></div></div>
}

function Assistant({items}:{items:Property[]}){
  type Msg={id:number;side:"bot"|"user";text:string;propertySlugs?:string[];mortgage?:{homePrice:number|null;downPercent:number|null;rate:number|null;years:number|null;monthly:number|null}};
  const emptyProfile:AssistantProfile={budgetMax:null,monthlyMax:null,city:null,type:null,minBedrooms:null,purpose:null,features:[],timeline:null};
  const[open,setOpen]=useState(false),[draft,setDraft]=useState(""),[busy,setBusy]=useState(false),[profile,setProfile]=useState<AssistantProfile>(emptyProfile);
  const[messages,setMessages]=useState<Msg[]>([
    {id:1,side:"bot",text:"Welcome to Northline. I can help you find the right residence, but I’ll narrow it down with you rather than throwing a catalog at you. Are you looking to buy, compare a few options, or just explore?"}
  ]);
  const[messageId,setMessageId]=useState(2);

  const bySlugs=(slugs:string[]|undefined)=>items.filter(p=>slugs?.includes(p.slug));
  const moneyOrDash=(n:number|null|undefined)=>typeof n==="number"?money(n):"—";

  const addUser=(text:string)=>{
    setMessages(prev=>[...prev,{id:messageId,side:"user",text}]);
    setMessageId(v=>v+1);
  };
  const addBot=(text:string,propertySlugs?:string[],mortgage?:Msg["mortgage"])=>{
    setMessages(prev=>[...prev,{id:messageId,side:"bot",text,propertySlugs,mortgage}]);
    setMessageId(v=>v+1);
  };

  const localFallback=(text:string)=>{
    const q=normalizeText(text);
    const purpose:AssistantProfile["purpose"]=/(куп|buy|покуп)/i.test(text)?"buy":/(срав|compare)/i.test(text)?"compare":/(исслед|explor|посмотр|browse)/i.test(text)?"explore":profile.purpose;
    const monthly=/\b(per month|monthly|a month|в месяц|месяц)\b/i.test(text);
    const parsed=parseBudget(text);

    if(purpose!==profile.purpose)setProfile(p=>({...p,purpose}));
    if(monthly&&parsed)setProfile(p=>({...p,monthlyMax:parsed,budgetMax:null}));
    if(!monthly&&parsed&&parsed>100000)setProfile(p=>({...p,budgetMax:parsed}));

    if(!purpose)return"Are you buying a home, comparing a few residences, or just exploring?";
    if(!profile.budgetMax&&!profile.monthlyMax&&!parsed)return"What budget are you comfortable with — total purchase price or a monthly payment target?";
    if(!profile.city&&!(q.includes("los angeles")||q.includes("san francisco")||q.includes("malibu")||q.includes("palm springs")||q.includes("west hollywood")||q.includes("laguna")||q.includes("san diego")||q.includes("la jolla")||q.includes("oakland")))return"Which area should I prioritize: Los Angeles, coastal California, or are you open to any city?";
    if(!profile.type&&!/(house|home|дом|квартир|apartment)/i.test(text))return"Do you prefer a private house, an apartment, or either?";
    if(!profile.minBedrooms&&!/(\d+)\s*(bed|beds|bedroom|спаль)/i.test(text))return"How many bedrooms do you need at minimum?";

    const targetBudget=profile.budgetMax||((parsed&&!monthly)?parsed:null);
    let pool=items.filter(p=>p.status==="available");
    if(targetBudget)pool=pool.filter(p=>p.price<=targetBudget);
    const minBeds=profile.minBedrooms;
    const city=profile.city;
    if(profile.type)pool=pool.filter(p=>p.type===profile.type);
    if(minBeds!==null)pool=pool.filter(p=>p.bedrooms>=minBeds);
    if(city)pool=pool.filter(p=>p.city.toLowerCase().includes(city.toLowerCase()));
    if(!pool.length)return"I don't have an available residence that fits all of those constraints. We can widen the area, increase the budget, or relax the bedroom requirement.";
    addBot(`I found ${pool.length} options that fit what you've told me so far. The strongest matches are below. Tell me which one feels closest, and I’ll take you into the full residence page.`,pool.slice(0,4).map(p=>p.slug));
  };

  const ask=async(raw:string)=>{
    const text=raw.trim();
    if(!text||busy)return;
    addUser(text);
    setBusy(true);

    const history=[...messages,{id:messageId,side:"user" as const,text}];
    const ai=await sendAssistantMessage({
      messages:history.slice(-16).map(m=>({role:m.side==="user"?"user" as const:"assistant" as const,content:m.text})),
      profile,
      now:new Date().toISOString()
    });

    if(ai.ok&&ai.message){
      if(ai.profile)setProfile(ai.profile);
      addBot(ai.message,ai.propertySlugs,ai.mortgage);

      if(ai.action==="open_property"&&ai.navigateTo){
        window.setTimeout(()=>{setOpen(false);go(ai.navigateTo!)},450);
      }else if(ai.action==="browse_properties"&&ai.navigateTo){
        window.setTimeout(()=>{setOpen(false);go(ai.navigateTo!)},450);
      }else if(ai.action==="open_viewing"&&ai.navigateTo){
        window.setTimeout(()=>{setOpen(false);go(ai.navigateTo!);window.setTimeout(()=>document.getElementById("booking")?.scrollIntoView({behavior:"smooth"}),500)},450);
      }
    }else{
      localFallback(text);
    }
    setBusy(false);
  };

  const submit=(e:React.FormEvent)=>{
    e.preventDefault();
    const text=draft;
    setDraft("");
    void ask(text);
  };

  const quick=(command:string)=>void ask(command);
  const profileCity=profile.city;
  const profileBeds=profile.minBedrooms;

  return <><button className="assistantBubble" aria-label="Open Northline AI assistant" onClick={()=>setOpen(v=>!v)}>{open?<X size={18}/>:<MessageCircle size={18}/>}</button>{open&&<motion.aside className="assistantPanel" initial={{opacity:0,y:14,scale:.98}} animate={{opacity:1,y:0,scale:1}}><div className="assistantHead"><div><p className="eyebrow dark">NORTHLINE / AI CONCIERGE</p><h3>Private property advisor</h3><span>Personalized search · finance · viewings</span></div><button aria-label="Close assistant" onClick={()=>setOpen(false)}><X size={16}/></button></div><div className="assistantProfile"><span className={!profile.purpose?"empty":""}>{profile.purpose==="buy"?"BUYING":profile.purpose==="compare"?"COMPARING":profile.purpose==="explore"?"EXPLORING":"YOUR SEARCH"}</span>{profile.budgetMax&&<span>{money(profile.budgetMax)} max</span>}{profile.monthlyMax&&<span>{money(profile.monthlyMax)}/mo</span>}{profileCity&&<span>{profileCity}</span>}{profile.type&&<span>{profile.type}</span>}{profileBeds!==null&&<span>{profileBeds}+ beds</span>}</div><div className="assistantQuick">{[["Find my home","I want to buy a home. Start by asking me the right questions."],["I have a monthly budget","I can spend about $7,000 per month. Help me find what fits."],["Just show me options","I’m flexible. Show me a few residences worth considering."]].map(([label,command])=><button key={label} disabled={busy} onClick={()=>quick(command)}>{label}</button>)}</div><div className="assistantMessages">{messages.map(m=>{const cards=bySlugs(m.propertySlugs);return <div className={m.side==="user"?"assistantMsg user":"assistantMsg"} key={m.id}><p>{m.text}</p>{m.mortgage?.monthly&&<div className="assistantCalc"><span>Estimated monthly</span><strong>{moneyOrDash(m.mortgage.monthly)}</strong><small>{m.mortgage.downPercent}% down · {m.mortgage.rate}% · {m.mortgage.years} yrs · P&I only</small></div>}{cards.length>0&&<div className="assistantProperties">{cards.map(p=><button key={p.id} onClick={()=>{setOpen(false);go("/property/"+p.slug)}}><img src={p.image} alt=""/><span><strong>{p.name}</strong><small>{p.city} · {money(p.price)} · {p.bedrooms} beds</small></span><ArrowUpRight size={14}/></button>)}</div>}</div>})}{busy&&<div className="assistantMsg"><p className="assistantTyping">Thinking<span>·</span><span>·</span><span>·</span></p></div>}</div><form className="assistantInput" onSubmit={submit}><input autoFocus={open} aria-label="Message Northline AI assistant" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Tell me what you're looking for…"/><button aria-label="Send message" disabled={!draft.trim()||busy}><ArrowUpRight size={16}/></button></form><p className="assistantNote">I’ll remember your budget, location, home type and bedroom needs as we narrow it down.</p></motion.aside>}</>
}

function PropertyCarousel({items}:{items:Property[]}){
  const count=items.length;
  const loopItems=[...items,...items,...items];
  const startIndex=count;
  const[index,setIndex]=useState(startIndex),[cardWidth,setCardWidth]=useState(900),[animating,setAnimating]=useState(false),[snap,setSnap]=useState(false);
  const viewportRef=React.useRef<HTMLDivElement|null>(null);

  useEffect(()=>{
    const measure=()=>setCardWidth(Math.min(window.innerWidth*(window.innerWidth<=720?.84:.78),940));
    measure();
    addEventListener("resize",measure);
    return()=>removeEventListener("resize",measure);
  },[]);

  const move=(delta:number)=>{
    if(animating||count<2)return;
    setAnimating(true);
    setIndex(i=>i+delta);
  };

  useEffect(()=>{
    const el=viewportRef.current;
    if(!el)return;
    let wheelLock=false;
    const onWheel=(event:WheelEvent)=>{
      if(Math.abs(event.deltaY)<4&&Math.abs(event.deltaX)<4)return;
      event.preventDefault();
      if(wheelLock||animating)return;
      wheelLock=true;
      move(event.deltaY>0?1:-1);
      window.setTimeout(()=>{wheelLock=false},520);
    };
    el.addEventListener("wheel",onWheel,{passive:false});
    return()=>el.removeEventListener("wheel",onWheel);
  },[animating,count]);

  const handleAnimationComplete=()=>{
    setAnimating(false);
    if(index>=count*2){
      setSnap(true);
      requestAnimationFrame(()=>setIndex(count));
    }else if(index<count){
      setSnap(true);
      requestAnimationFrame(()=>setIndex(count*2-1));
    }
  };

  return <div className="catalogCarousel">
    <div ref={viewportRef} className="carouselViewport" aria-label="Northline residences carousel">
      <motion.div
        className="carouselTrack"
        animate={{x:-index*(cardWidth+20)}}
        transition={snap?{duration:0}:{type:"spring",stiffness:125,damping:21,mass:.8}}
        onAnimationComplete={()=>{handleAnimationComplete();if(snap)requestAnimationFrame(()=>setSnap(false))}}
      >
        {loopItems.map((p,i)=>{
          return <motion.article className="carouselCard" key={p.id+"-"+i} onClick={()=>go("/property/"+p.slug)} whileHover={{y:-4}}>
            <div className="carouselImage">
              <img src={p.image} loading={i<3?"eager":"lazy"} alt={p.name}/>
              <div className="carouselShade"/>
              <span>{p.status==="available"?"AVAILABLE":p.status.toUpperCase()}</span>
              <button aria-label={"Open "+p.name} onClick={e=>{e.stopPropagation();go("/property/"+p.slug)}}><ArrowUpRight/></button>
              <div className="carouselContent">
                <p className="eyebrow">{p.city} · {p.type}</p>
                <h3>{p.name}</h3>
                <strong>{money(p.price)}</strong>
                <div className="carouselSpecs"><span>{p.bedrooms} beds</span><span>{p.bathrooms} baths</span><span>{p.area.toLocaleString()} sq ft</span></div>
              </div>
            </div>
          </motion.article>
        })}
      </motion.div>
    </div>
    <div className="carouselControls">
      <div className="carouselCounter"><strong>{String(index%count+1).padStart(2,"0")}</strong><span>/ {String(count).padStart(2,"0")}</span></div>
      <div className="carouselButtons">
        <button disabled={animating} onClick={()=>move(-1)} aria-label="Previous residence"><ArrowLeft size={16}/></button>
        <button disabled={animating} onClick={()=>move(1)} aria-label="Next residence"><ArrowUpRight size={16}/></button>
      </div>
      <span className="carouselHint">SCROLL TO EXPLORE</span>
      <LinkButton to="/properties" className="arrowLink">View all residences <ArrowUpRight size={15}/></LinkButton>
    </div>
  </div>
}

function Home({items}:{items:Property[]}){
  return <div className="home"><section className="hero"><img src={img("photo-1600607688969-a5bfcd646154")} alt="Contemporary Northline residence" fetchPriority="high"/><div className="heroShade"/><div className="heroContent"><p className="eyebrow">EST. 2008 · CALIFORNIA</p><h1>Architecture built<br/><em>for the way you live.</em></h1><p className="heroLead">Contemporary homes and residences shaped by considered design, enduring materials, and precise attention to detail.</p><div className="heroActions"><LinkButton to="/properties" className="solid">Explore residences <ArrowUpRight size={17}/></LinkButton><LinkButton to="/about" className="textLink light">Our approach <ChevronDown size={15}/></LinkButton></div></div><div className="heroFooter"><span>01 / 05</span><span>SCROLL TO EXPLORE ↓</span></div></section><section className="introBlock"><p className="eyebrow dark">NORTHLINE / 01</p><div><h2>We create places<br/><em>worth coming home to.</em></h2><p>Development, architecture and construction brought together with a singular focus: calm, durable spaces that feel personal.</p><LinkButton to="/about" className="arrowLink">Discover Northline <ArrowUpRight size={16}/></LinkButton></div></section><section className="stats">{[["18","YEARS OF EXPERIENCE"],["240+","COMPLETED HOMES"],["12","CITIES"],["4.9","CLIENT RATING"]].map(([n,label])=><div key={label}><strong>{n}</strong><span>{label}</span></div>)}</section><section className="contentSection homeCatalog"><SectionHead eyebrow="NORTHLINE / 02" title={<>Selected <em>residences.</em></>} sub="Swipe through the current collection of private houses and apartments across California."/><PropertyCarousel items={items}/></section><section className="splitFeature"><div className="splitImage"><img src={img("photo-1600607687939-ce8a6c25118c")} loading="lazy" alt="Northline project"/></div><div className="splitCopy"><p className="eyebrow">NORTHLINE / 03</p><h2>Built with<br/><em>intention.</em></h2><p>From the first sketch to the final detail, our process is deliberate. We build modern residences that feel quiet, tactile and deeply considered.</p><LinkButton to="/projects" className="textLink light">View projects <ArrowUpRight size={15}/></LinkButton></div></section><section className="mapBlock"><div><p className="eyebrow dark">NORTHLINE / 04</p><h2>Find the<br/><em>right setting.</em></h2><p>Our work spans coastal, urban and inland California.</p><LinkButton to="/contact" className="arrowLink">Talk to Northline <ArrowUpRight size={16}/></LinkButton></div><MapPanel/></section></div>
}

function PropertiesPage({items}:{items:Property[]}){
  const[q,setQ]=useState(""),[type,setType]=useState("all"),[budget,setBudget]=useState("all"),[status,setStatus]=useState("all");
  const filtered=items.filter(p=>(type==="all"||p.type===type)&&(status==="all"||p.status===status)&&(budget==="all"||p.price<=Number(budget))&&(p.name+" "+p.city).toLowerCase().includes(q.toLowerCase()));
  return <Page eyebrow="NORTHLINE / 02" title={<>Selected <em>residences.</em></>}><section className="catalog"><div className="catalogIntro"><p>Private houses and apartments, presented with full specifications, gallery views and viewing availability.</p><div className="filterBar"><div className="searchField"><Search size={15}/><input placeholder="Search residence or city" value={q} onChange={e=>setQ(e.target.value)}/></div><select value={type} onChange={e=>setType(e.target.value)}><option value="all">All types</option><option value="house">Houses</option><option value="apartment">Apartments</option></select><select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All status</option><option value="available">Available</option><option value="reserved">Reserved</option></select><select value={budget} onChange={e=>setBudget(e.target.value)}><option value="all">Any price</option><option value="1500000">Under $1.5M</option><option value="2500000">Under $2.5M</option><option value="4000000">Under $4M</option></select></div></div><div className="resultMeta"><span>{filtered.length} residences</span><span>Prices shown in USD</span></div><div className="propertyGrid wideGrid">{filtered.map(p=><PropertyCard key={p.id} p={p}/>)}</div>{!filtered.length&&<div className="emptyState">No residences match the selected filters.</div>}</section><section className="mapBlock catalogMap"><div><p className="eyebrow dark">LOCATION</p><h2>California,<br/><em>in context.</em></h2><p>Use the map reference to open Downtown Los Angeles in Google Maps.</p></div><MapPanel/></section></Page>
}

function ProjectsPage(){
  return <Page eyebrow="NORTHLINE / 03" title={<>Projects shaped by <em>place.</em></>}><section className="projectsGrid">{projects.map((p,i)=><motion.article className={i===0?"projectCard featuredProject":"projectCard"} key={p.id} whileHover={{y:-5}}><img src={p.image} loading="lazy" alt={p.name}/><div className="projectOverlay"><p className="eyebrow">{p.category} · {p.year}</p><h2>{p.name}</h2><p>{p.description}</p><div>{p.stats.map(s=><span key={s}>{s}</span>)}</div></div></motion.article>)}</section><section className="darkStatement"><p className="eyebrow">NORTHLINE / PROCESS</p><h2>From land and plans<br/><em>to a finished place.</em></h2><p>Each project is managed as a complete system: feasibility, design coordination, construction, interiors and handover.</p></section></Page>
}

function AboutPage(){
  return <Page eyebrow="NORTHLINE / 04" title={<>A quieter way to <em>build.</em></>}><section className="aboutIntro"><div><p className="eyebrow dark">THE NORTHLINE METHOD</p><h2>Less noise.<br/><em>More intention.</em></h2></div><div><p>Northline is a fictional development studio created as a portfolio-grade demonstration of modern real-estate web design, data flows and conversion UX.</p><p>The experience combines property discovery, detail pages, a mortgage model, inquiry routing, viewing bookings and a Stripe test checkout into one responsive product.</p></div></section><section className="methodGrid">{[["01","Research","Site, context, planning constraints and the brief."],["02","Design","Material, spatial and digital systems designed as one language."],["03","Build","Measured construction with clear milestones and documentation."],["04","Handover","Private viewing, inquiry support and a clear client journey."]].map(([n,t,d])=><div key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></div>)}</section><section className="aboutImage"><img src={img("photo-1600566753190-17f0baa2a6c3")} loading="lazy" alt="Architectural interior"/><div><p className="eyebrow">A MATERIAL PALETTE</p><h2>Stone, oak,<br/><em>light & space.</em></h2></div></section></Page>
}

function ContactPage({items}:{items:Property[]}){
  const[form,setForm]=useState({name:"",email:"",interest:"Buying a residence",property:"",message:""}),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setStatus("");try{const r=await sendInquiry(form);setStatus(r.demo?"Demo mode: inquiry accepted. Add Resend to deliver email.":"Inquiry sent — we’ll be in touch.");setForm({...form,name:"",email:"",message:""})}catch(e){setStatus(e instanceof Error?e.message:"Unable to send inquiry.")}finally{setBusy(false)}};
  return <Page eyebrow="NORTHLINE / 05" title={<>Let's find your <em>next address.</em></>}><section className="contactLayout"><div className="contactCopy"><p>Private viewings, development inquiries and project questions are handled directly by the Northline team.</p><div className="contactCards"><div><Mail size={16}/><span>Email</span><a href="mailto:support@northline.demo">support@northline.demo</a></div><div><Clock size={16}/><span>Hours</span><strong>Mon–Fri · 9:00–18:00 PT</strong></div><div><MapPin size={16}/><span>Reference</span><strong>Los Angeles · California</strong></div></div><MapPanel/></div><form className="contactForm" onSubmit={submit}><label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label><label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label><label>Interest<select value={form.interest} onChange={e=>setForm({...form,interest:e.target.value})}><option>Buying a residence</option><option>Private viewing</option><option>New development</option><option>General question</option></select></label><label>Property<select value={form.property} onChange={e=>setForm({...form,property:e.target.value})}><option value="">No specific property</option>{items.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}</select></label><label>Message<textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Tell us what you're looking for..."/></label><button className="solid" disabled={busy}>{busy?"Sending…":"Send inquiry"} <ArrowUpRight size={17}/></button>{status&&<p className="formStatus">{status}</p>}</form></section></Page>
}

function PropertyPage({p}:{p:Property}){
  const reserve=async(date:string,time:string)=>{const r=await createCheckoutSession(p.id,date,time);if(r.url){window.location.href=r.url;return}if(r.demoPath){go(r.demoPath);return}throw new Error("Checkout is not available on this deployment.")};
  return <div className="detailPage"><button className="backLink" onClick={()=>go("/properties")}><ArrowLeft size={15}/> Back to residences</button><section className="detailHero"><Gallery p={p}/><div className="detailCopy"><p className="eyebrow dark">{p.type.toUpperCase()} · {p.city.toUpperCase()}</p><h1>{p.name}</h1><p className="location"><MapPin size={14}/>{p.location}</p><strong className="detailPrice">{money(p.price)}</strong><p className="detailDesc">{p.description}</p><div className="propertySpecs large"><span><BedDouble/>{p.bedrooms} beds</span><span><Bath/>{p.bathrooms} baths</span><span><Maximize/>{p.area.toLocaleString()} sq ft</span></div><div className="featureList">{p.features.map(f=><span key={f}><Check size={13}/>{f}</span>)}</div>{p.status==="available"&&<button className="solid" onClick={()=>document.getElementById("booking")?.scrollIntoView({behavior:"smooth"})}>Schedule private viewing <CalendarDays size={15}/></button>}</div></section><section className="detailLower"><div><p className="eyebrow dark">OWNERSHIP PLANNING</p><h2>Plan the purchase<br/><em>with clear numbers.</em></h2><Mortgage price={p.price}/></div><div className="detailAside"><p className="eyebrow dark">PROPERTY NOTES</p><h3>Designed for daily life.</h3><p>Every Northline residence is presented with a full gallery, specifications and private viewing workflow.</p><div className="miniFacts"><span><Building2 size={14}/>Built {p.year}</span><span><HomeIcon size={14}/>{p.type==="house"?"Private house":"Apartment residence"}</span><span><Layers3 size={14}/>Full specification set</span></div></div></section>{p.status==="available"&&<section id="booking" className="bookingSection"><div><p className="eyebrow">PRIVATE VIEWING</p><h2>Choose a time<br/><em>that works for you.</em></h2><p>Stripe handles the secure $50 test deposit. The booking details are carried into the checkout receipt.</p></div><Booking p={p} onReserve={reserve}/></section>}</div>
}

function StatusPage({cancel=false,demo=false}:{cancel?:boolean;demo?:boolean}){
  const[info,setInfo]=useState<any>(demo?null:null),[loading,setLoading]=useState(!cancel&&!demo),[error,setError]=useState("");
  useEffect(()=>{if(cancel||demo)return;const id=new URLSearchParams(location.search).get("session_id");if(!id){setLoading(false);return}getCheckoutSession(id).then(setInfo).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[cancel,demo]);
  const p=properties.find(x=>x.id===info?.propertyId);
  const realPayment=info?.payment_status==="paid";
  const amount=typeof info?.amount_total==="number"?(info.amount_total/100).toLocaleString("en-US",{style:"currency",currency:(info.currency||"usd").toUpperCase()}):"$50.00";
  return <div className="statusPage"><p className="eyebrow dark">NORTHLINE / CHECKOUT</p><div className="statusIcon">{cancel?"×":"✓"}</div><h1>{cancel?"Checkout cancelled":demo?"Demo checkout complete":"Viewing confirmed"}</h1>{loading?<p>Verifying your Stripe payment…</p>:error?<p>{error}</p>:cancel?<p>No payment was made and the selected viewing was not confirmed.</p>:demo?<p>This GitHub Pages preview simulates the complete checkout presentation. No real card charge is made here.</p>:<><p>{realPayment?"Your viewing deposit was paid successfully.":"The checkout session was created successfully."}</p><div className="receiptCard"><div><span>Residence</span><strong>{info?.propertyName||p?.name||"Northline residence"}</strong></div><div><span>Viewing</span><strong>{info?.bookingDate||"—"} · {info?.bookingTime||"—"}</strong></div><div><span>Customer</span><strong>{info?.customer_name||"Guest"}{info?.customer_email?<> · {info.customer_email}</>:null}</strong></div><div><span>Total</span><strong>{amount}</strong></div><div><span>Payment status</span><strong>{realPayment?"PAID":"PENDING"}</strong></div></div></>}<LinkButton to={p?"/property/"+p.slug:"/properties"} className="solid">Return to Northline <ArrowUpRight size={16}/></LinkButton></div>
}

function DemoCheckout(){
  const qs=new URLSearchParams(location.search),p=properties.find(x=>x.id===qs.get("propertyId")),date=qs.get("date")||"",time=qs.get("time")||"";
  if(!p)return <StatusPage cancel/>;
  return <div className="checkoutPage"><div className="checkoutShell"><div className="checkoutBrand"><span>NORTHLINE</span><small>SECURE CHECKOUT · DEMO</small></div><div className="checkoutGrid"><div className="orderSummary"><p className="eyebrow dark">ORDER SUMMARY</p><h1>Private viewing</h1><div className="summaryImage"><img src={p.image} alt={p.name}/></div><h2>{p.name}</h2><p>{p.location}</p><div className="summaryRows"><span><b>Date</b>{date}</span><span><b>Time</b>{time}</span><span><b>Deposit</b>$50.00 USD</span></div></div><div className="demoCheckout"><p className="eyebrow dark">PAYMENT DETAILS</p><div className="demoFields"><label>Card number<input value="4242 4242 4242 4242" readOnly/></label><div><label>Expiry<input value="12 / 34" readOnly/></label><label>CVC<input value="123" readOnly/></label></div><label>Cardholder name<input placeholder="Demo Customer"/></label></div><div className="checkoutTotal"><span>Total</span><strong>$50.00</strong></div><button className="solid full" onClick={()=>go("/checkout/success?demo=1")}>Pay $50.00 <ShieldCheck size={15}/></button><p className="secureNote"><ShieldCheck size={14}/> Demo only on GitHub Pages. Real test payments use Stripe Checkout after Vercel deployment.</p></div></div></div></div>
}

function AppRouter(){
  const[path,setPath]=useState(window.location.pathname.replace(new RegExp("^"+BASE),"")||"/"),[items,setItems]=useState<Property[]>(properties);
  useEffect(()=>{const h=()=>setPath(window.location.pathname.replace(new RegExp("^"+BASE),"")||"/");addEventListener("popstate",h);return()=>removeEventListener("popstate",h)},[]);
  useEffect(()=>{getProperties().then(setItems).catch(()=>setItems(properties))},[]);
  let page:React.ReactNode;
  if(path==="/")page=<Home items={items}/>;
  else if(path==="/properties")page=<PropertiesPage items={items}/>;
  else if(path==="/projects")page=<ProjectsPage/>;
  else if(path==="/about")page=<AboutPage/>;
  else if(path==="/contact")page=<ContactPage items={items}/>;
  else if(path==="/checkout/success")page=<StatusPage demo={new URLSearchParams(location.search).get("demo")==="1"}/>;
  else if(path==="/checkout/cancel")page=<StatusPage cancel/>;
  else if(path==="/checkout/demo")page=<DemoCheckout/>;
  else if(path.startsWith("/property/")){const slug=decodeURIComponent(path.split("/")[2]||"");const p=properties.find(x=>x.slug===slug);page=p?<PropertyPage p={p}/>:<StatusPage cancel/>}
  else page=<StatusPage cancel/>;
  const shell=path.startsWith("/checkout")||path.startsWith("/property/")||path==="/checkout/cancel";
  return <><AnimatePresence mode="wait"><motion.div key={path} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.28}}>{shell?null:<Header/>}{page}{shell?null:<Footer/>}</motion.div></AnimatePresence>{!shell&&<Assistant items={items}/>}</>
}

createRoot(document.getElementById("root")!).render(<AppRouter/>);