export type PropertyType = "house" | "apartment";
export type PropertyStatus = "available" | "reserved" | "sold";

export type Property = {
  id:string;
  slug:string;
  name:string;
  location:string;
  city:string;
  price:number;
  type:PropertyType;
  status:PropertyStatus;
  bedrooms:number;
  bathrooms:number;
  area:number;
  year:number;
  description:string;
  image:string;
  gallery:string[];
  features:string[];
};

export type Project = {
  id:string;
  name:string;
  city:string;
  category:string;
  year:string;
  image:string;
  description:string;
  stats:string[];
};

const img=(id:string)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1800&q=88`;

export const properties:Property[]=[
  {
    id:"oak-01",slug:"oak-residence",name:"The Oak Residence",location:"Los Angeles, California",city:"Los Angeles",
    price:1840000,type:"house",status:"available",bedrooms:4,bathrooms:3.5,area:2840,year:2026,
    description:"A warm contemporary residence balancing natural oak, limestone, glass and generous indoor-outdoor living.",
    image:img("photo-1600585154340-be6161a56a0c"),
    gallery:[img("photo-1600585154340-be6161a56a0c"),img("photo-1600566753190-17f0baa2a6c3"),img("photo-1600607688969-a5bfcd646154"),img("photo-1600607687939-ce8a6c25118c")],
    features:["Chef kitchen","Private courtyard","Two-car garage","Floor-to-ceiling glazing","Primary suite","Smart climate"]
  },
  {
    id:"pacific-02",slug:"pacific-heights",name:"Pacific Heights",location:"San Francisco, California",city:"San Francisco",
    price:2420000,type:"apartment",status:"available",bedrooms:3,bathrooms:3,area:2210,year:2025,
    description:"A refined city residence with panoramic views, quiet materials and an elevated private terrace.",
    image:img("photo-1600607687920-4e2a09cf159d"),
    gallery:[img("photo-1600607687920-4e2a09cf159d"),img("photo-1600607688969-a5bfcd646154"),img("photo-1600566753086-00f18fb6b3ea"),img("photo-1600566753190-17f0baa2a6c3")],
    features:["Private terrace","Concierge","Fitness studio","Secure parking","Wine storage","City views"]
  },
  {
    id:"hills-04",slug:"north-hills-no-04",name:"North Hills No. 04",location:"Los Angeles, California",city:"Los Angeles",
    price:1260000,type:"house",status:"available",bedrooms:4,bathrooms:3,area:2480,year:2026,
    description:"A restrained family home with a connected kitchen, garden and flexible studio space.",
    image:img("photo-1600566753086-00f18fb6b3ea"),
    gallery:[img("photo-1600566753086-00f18fb6b3ea"),img("photo-1600566753190-17f0baa2a6c3"),img("photo-1600607688969-a5bfcd646154")],
    features:["Garden","Home office","Smart entry","Laundry room","Skylight","EV charging"]
  },
  {
    id:"canyon-07",slug:"canyon-house",name:"Canyon House",location:"Malibu, California",city:"Malibu",
    price:3950000,type:"house",status:"reserved",bedrooms:5,bathrooms:4.5,area:4120,year:2027,
    description:"A sculptural hillside home oriented toward ocean light and expansive outdoor entertaining.",
    image:img("photo-1600607687939-ce8a6c25118c"),
    gallery:[img("photo-1600607687939-ce8a6c25118c"),img("photo-1600607687920-4e2a09cf159d"),img("photo-1600585154340-be6161a56a0c")],
    features:["Ocean view","Infinity pool","Guest suite","Outdoor kitchen","Home cinema","Elevator"]
  },
  {
    id:"mesa-09",slug:"mesa-09",name:"Mesa 09",location:"Palm Springs, California",city:"Palm Springs",
    price:1480000,type:"house",status:"available",bedrooms:3,bathrooms:2.5,area:2360,year:2025,
    description:"A desert-modern retreat with long horizontal sightlines, shaded patios and a private pool.",
    image:img("photo-1600607687920-4e2a09cf159d"),
    gallery:[img("photo-1600607687920-4e2a09cf159d"),img("photo-1600585154340-be6161a56a0c"),img("photo-1600607687939-ce8a6c25118c")],
    features:["Private pool","Desert garden","Covered patio","Fireplace","Solar-ready","Media room"]
  },
  {
    id:"studio-12",slug:"studio-12",name:"Studio 12",location:"West Hollywood, California",city:"West Hollywood",
    price:980000,type:"apartment",status:"available",bedrooms:2,bathrooms:2,area:1260,year:2026,
    description:"A compact, highly considered residence pairing gallery-like proportions with a calm material palette.",
    image:img("photo-1600566753190-17f0baa2a6c3"),
    gallery:[img("photo-1600566753190-17f0baa2a6c3"),img("photo-1600566753086-00f18fb6b3ea"),img("photo-1600607688969-a5bfcd646154")],
    features:["Rooftop access","Dedicated parking","Oak cabinetry","Stone bath","Smart lighting","Doorman"]
  },
  {
    id:"cliff-14",slug:"cliff-residence",name:"Cliff Residence",location:"Laguna Beach, California",city:"Laguna Beach",
    price:3120000,type:"house",status:"available",bedrooms:4,bathrooms:4,area:3380,year:2026,
    description:"A coastal residence designed around framed views, sheltered courtyards and soft natural light.",
    image:img("photo-1600607688969-a5bfcd646154"),
    gallery:[img("photo-1600607688969-a5bfcd646154"),img("photo-1600607687939-ce8a6c25118c"),img("photo-1600566753190-17f0baa2a6c3")],
    features:["Ocean terrace","Pool","Guest suite","Outdoor shower","Double kitchen","Library"]
  },
  {
    id:"park-16",slug:"park-16",name:"Park 16",location:"San Diego, California",city:"San Diego",
    price:1720000,type:"apartment",status:"reserved",bedrooms:3,bathrooms:2.5,area:1840,year:2025,
    description:"A light-filled urban apartment with a generous terrace and a direct relationship to the city park.",
    image:img("photo-1600566753086-00f18fb6b3ea"),
    gallery:[img("photo-1600566753086-00f18fb6b3ea"),img("photo-1600585154340-be6161a56a0c")],
    features:["Park view","Resident lounge","Secure entry","Bike storage","Fitness room","EV parking"]
  },
  {
    id:"ridge-19",slug:"ridge-19",name:"Ridge 19",location:"La Jolla, California",city:"La Jolla",
    price:2680000,type:"house",status:"available",bedrooms:4,bathrooms:3.5,area:3010,year:2027,
    description:"A low-slung coastal house with private gardens, deep overhangs and expansive living zones.",
    image:img("photo-1600585154340-be6161a56a0c"),
    gallery:[img("photo-1600585154340-be6161a56a0c"),img("photo-1600607688969-a5bfcd646154"),img("photo-1600566753190-17f0baa2a6c3")],
    features:["Sea breeze patio","Stone fireplace","Study","Pool-ready yard","Butler pantry","Three-car garage"]
  },
  {
    id:"union-22",slug:"union-22",name:"Union 22",location:"Oakland, California",city:"Oakland",
    price:1120000,type:"apartment",status:"available",bedrooms:2,bathrooms:2,area:1140,year:2025,
    description:"A contemporary loft residence with oversized windows, warm finishes and flexible workspace.",
    image:img("photo-1600607687920-4e2a09cf159d"),
    gallery:[img("photo-1600607687920-4e2a09cf159d"),img("photo-1600566753086-00f18fb6b3ea")],
    features:["Loft ceiling","Private balcony","Coworking lounge","Package room","Bike room","Quartz kitchen"]
  }
];

export const projects:Project[]=[
  {id:"p1",name:"The Crescent Collection",city:"Los Angeles",category:"Residential development",year:"2026",image:img("photo-1600607688969-a5bfcd646154"),description:"A 24-home collection of calm contemporary residences organized around landscaped courtyards.",stats:["24 homes","86,000 sq ft","2026 delivery"]},
  {id:"p2",name:"Pacific House",city:"San Francisco",category:"Boutique apartments",year:"2025",image:img("photo-1600607687920-4e2a09cf159d"),description:"A twelve-residence urban infill project with a stone exterior and elevated shared terrace.",stats:["12 residences","8 floors","2025 complete"]},
  {id:"p3",name:"Canyon Modern",city:"Malibu",category:"Custom homes",year:"2027",image:img("photo-1600607687939-ce8a6c25118c"),description:"A small series of hillside homes positioned around framed ocean views and private outdoor rooms.",stats:["6 homes","Private pools","2027 delivery"]},
  {id:"p4",name:"Northline Works",city:"West Hollywood",category:"Mixed-use",year:"2024",image:img("photo-1600566753190-17f0baa2a6c3"),description:"A neighborhood-scale mixed-use block bringing flexible workspaces and residences together.",stats:["38 residences","Retail + studio","2024 complete"]}
];