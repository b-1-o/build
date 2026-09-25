# Northline Development

Premium real-estate / construction company demo built with React + TypeScript and Vite.

## Included
- Responsive premium real-estate UI
- Property catalog with search, type and budget filters
- Property detail modal with specifications and features
- Mortgage payment calculator
- Property API endpoint: /api/properties
- Inquiry API with Resend support: /api/contact
- Stripe test checkout for private viewing deposits: /api/create-checkout-session
- Environment variable template
- Vercel-ready configuration
- Lazy-loaded imagery and responsive layout

## Run
npm install
npm run dev

## Production
Copy .env.example to .env and configure Stripe and Resend values. Never expose STRIPE_SECRET_KEY in client-side code.

## Deployment
Recommended: Vercel for the Vite frontend plus serverless API routes. GitHub Pages can host the static frontend, but payment/contact API routes require a serverless backend such as Vercel.
