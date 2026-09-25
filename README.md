# Northline Development

Premium real-estate / construction company portfolio demo built with React + TypeScript + Vite.

## Five core pages
- Home
- Properties
- Projects
- About
- Contact

Additional routes:
- /property/:slug — full property detail
- /checkout/demo — static checkout preview for GitHub Pages
- /checkout/success
- /checkout/cancel

## Features
- Responsive desktop + mobile layouts
- Property catalog with search, type, status and budget filters
- 10 houses and apartments with galleries and specifications
- Mortgage payment calculator
- Google Maps reference embed
- Private viewing calendar
- Stripe Test Mode Checkout through Vercel serverless API
- Checkout verification and success/cancel states
- Resend inquiry API
- Responsive support widget
- Framer Motion transitions
- GitHub Pages static preview
- Vercel-ready production deployment

## Run
`npm install`
`npm run dev`

## Real Stripe test checkout
Deploy the repo to Vercel and add:
`STRIPE_SECRET_KEY`
`SITE_URL` (optional when Vercel provides the request host)
`RESEND_API_KEY`
`CONTACT_TO_EMAIL`
`CONTACT_FROM_EMAIL`

The Stripe secret key stays server-side in Vercel environment variables. GitHub Pages intentionally uses a visual demo checkout because static hosting cannot run the /api serverless functions.

## Public preview
https://b-1-o.github.io/build/

## Deployment
GitHub Pages is useful for the static portfolio preview. Vercel is the deployment target for the full React + serverless API + Stripe Test Mode flow.
