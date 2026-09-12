# WCC Digital Platform

Software Engineering Lab group project — full digital platform for WCC
(a real social organisation based in Jhalokathi), covering 5 pillars:
Education, Health, Sports, Culture, Heritage.

The existing landing page is kept as-is and is not being rebuilt here.

## Team

- Mohai
- Rafi
- Sanjida

## Tech stack

- Node.js + Express
- MongoDB + Mongoose
- EJS templating
- express-session for auth

## Setup

1. `npm install`
2.  Create `.env` and fill in with MongoDB URI + session secret
3. `npm run dev` (or `npm start`)
4. App runs on `http://localhost:3000`

## Branch convention

- `main` — stable, working code only
- `dev` — everyone merges here first
- Feature branches: `feature/<name>-<module>`
  - e.g. `feature/mohai-auth-core`
  - `feature/rafi-education-health`
  - `feature/sanjida-sports-culture-heritage`

Open a PR into `dev`, not directly into `main`.

## Folder structure

- `config/` — DB connection
- `models/` — Mongoose schemas
- `controllers/` — route logic
- `routes/` — Express routers
- `middleware/` — auth & role checks
- `views/` — EJS templates
- `public/` — static css/js/images
