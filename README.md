# blyp-here Monorepo

Frontend: React + Vite + Tailwind
Backend: Node.js + Express + MongoDB (Mongoose)

## Setup

1) Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set MONGO_URI and JWT_SECRET
npm run seed   # optional: seed cafes
npm run dev
```

2) Frontend

```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

Proxy is configured so `/api` is forwarded to `http://localhost:5000`.

## Maps

Insert your provider key in `frontend/src/components/Map.jsx` where noted.

## Admin

Promote a user to admin:

```bash
cd backend
node seed/make_admin.js "user@example.com"
```

Admin dashboard at `/admin`.

## Suggest/Claim Flow

- Users: `/suggest` to propose a new café, `/claim` to claim an existing one.
- Admin: review at `/admin` and approve/reject.

## Design Tokens

- Title font: Poppins 600 at 30px (`.title-xl`)
- Body font: Inter 16px (`.body-base`)
- Card: 10px radius, shadow depth 4

## Empty/Error States

Placeholders are used. You can drop PNGs in `frontend/public/assets/empty.png` and `frontend/public/assets/error.png`.

# blyp-here
A minimalist, community-driven coffeeshop discovery and journal platform.
