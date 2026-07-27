# Presidio Talent Hub - Development Guidelines

## Project Overview

**Project**: Presidio Talent Hub  
**Type**: Internal Web Application - Recruitment Management System  
**Technology Stack**: React, TypeScript, Vite, Tailwind CSS, React Router, Recharts (frontend) + Express, MongoDB/Mongoose (backend, `server/` workspace)  
**Status**: Actively integrating a real backend — frontend is stable, backend build is in progress (see repo for current phase)

## Project Structure

```
src/                    # frontend (Vite root)
├── pages/              # All page components (10 modules)
├── components/         # Shared layout components
├── types/             # TypeScript interfaces
├── context/            # AppContext.tsx — central data/session hook (useApp())
└── utils/             # Utility functions (db.ts is a thin localStorage cache, no mock data)
server/                 # backend (Express + Mongoose), npm workspace
├── src/
│   ├── models/          # Mongoose schemas, one per entity
│   ├── routes/ + controllers/
│   └── config/          # env.ts, db.ts (Mongo connection)
```

## Key Features

- **10 Complete Modules**: Dashboard, Talent Acquisition, Campus Drive, Candidates, Assessments, Question Bank, Invitations, Shortlisting, Interviews, Reports
- **Enterprise UI**: Professional dashboard with charts and analytics
- **Presidio Branding**: Blue/white color scheme
- **Real backend**: Express API + MongoDB — the app no longer ships mock/demo data; the database starts empty and fills up through real usage
- **Responsive Design**: Mobile, tablet, and desktop support
- **TypeScript**: Full type safety

## Building & Running

### Development
This app has **two processes** — frontend (Vite, port 5173) and backend (Express, port 4000) — both must run together, or API calls (e.g. `/api/users` on the Login page) will fail with `ECONNREFUSED` proxy errors.

```bash
npm run dev:all
# Starts both Vite and the Express server (via concurrently)
# Frontend: http://localhost:5173
# Backend:  http://localhost:4000
```

Running `npm run dev` alone only starts the frontend — use it only if you deliberately don't need the API (most pages will show empty data and Login won't work). The backend also needs `server/.env` configured (copy `server/.env.example`) with at least `MONGODB_URI` and `JWT_SECRET` before it will boot.

### Production Build
```bash
npm run build
npm run preview
```

### Login
Admin login is a "Sign in with Microsoft" persona picker — it lists real `User` documents fetched live from `GET /api/users` (no hardcoded credentials; there are none anymore). A user must exist in the `users` collection to appear in the picker. Real Microsoft Entra ID SSO is planned but not yet wired in.

## Code Standards

- **TypeScript**: Use strict types throughout
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS utility classes
- **Imports**: Use absolute imports from src/
- **Files**: One component per file in src/pages/ or src/components/

## Common Development Tasks

### Add New Page
1. Create file in `src/pages/NewPage.tsx`
2. Import Layout component
3. Add route in `src/App.tsx`

### Add a Backend Entity/Endpoint
1. Add a Mongoose schema in `server/src/models/`
2. Add routes + controller in `server/src/routes/` and `server/src/controllers/`
3. Update `src/types/index.ts` if the frontend-facing shape changes, and wire `src/context/AppContext.tsx` to call the new endpoint

### Update Types
Add interfaces to `src/types/index.ts`

## Configuration Files

- `vite.config.ts` - Vite configuration (includes the `/api` dev proxy to the backend on port 4000)
- `tsconfig.json` - TypeScript settings
- `tailwind.config.js` - Tailwind CSS theme
- `postcss.config.js` - PostCSS plugins
- `server/.env` - Backend secrets (Mongo URI, JWT secret, etc.) — gitignored, copy from `server/.env.example`

## Notes for Future Development

- Real Microsoft Entra ID (Azure AD) SSO for admin login is planned but not yet implemented — currently a persona picker backed by real `User` documents
- Candidate magic-link/password login still needs to be ported to enforce server-side (currently only in `AppContext.tsx`)
- Most write operations (create/update drives, candidates, etc.) are not yet wired to the backend — reads are being migrated first
- Responsive breakpoints: mobile (default), md (768px), lg (1024px)

## Troubleshooting

**Backend not reachable / `ECONNREFUSED` on `/api/*`**: you're probably running `npm run dev` instead of `npm run dev:all` — the backend is a separate process and won't start on its own.  
**Port in use**: `npm run dev -- --port 3000`  
**Build errors**: `npm ci && npm run build`  
**Module not found**: Ensure all imports use correct paths from src/

## Key Decisions

1. **Tailwind CSS**: Used for rapid, consistent styling
2. **React Router v6**: For simple, declarative routing
3. **MongoDB + Mongoose**: Chosen for the backend given the data's relational-but-flexible shape (see `server/` workspace)
4. **Tailwind v4 with @tailwindcss/postcss**: Latest Tailwind setup
5. **TypeScript Strict Mode**: Enabled for type safety
6. **No mock/seed data**: the app intentionally ships with an empty database — populated only through real usage, not synthetic demo data
