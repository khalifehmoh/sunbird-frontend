# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is
`sunbird-frontend` is a **frontend-only** SPA: React 19 + Vite 7 + TypeScript, Mantine 8 UI,
Redux Toolkit + RTK Query, and React Router 7. It is the Admin module of a healthcare
"Core System". `docs/admin_blueprint_v3.md` describes a full three-layer system (PostgreSQL +
Spring Boot backend + this frontend), but **only the frontend lives in this repo** — there is
no backend here.

### Commands (see `package.json` scripts)
- Dev server: `npm run dev` → http://localhost:5173 (Vite, HMR).
- Production build: `npm run build` (Vite/esbuild).
- Preview built app: `npm run preview`.
- Typecheck: `npx tsc -b`.

### Non-obvious gotchas
- **No lint script / no ESLint config.** ESLint packages are in `devDependencies` but there is
  no `eslint.config.*` and no `lint` npm script, so `eslint` is not wired up. Use `npx tsc -b`
  for static checking.
- **`npx tsc -b` currently exits non-zero on a clean checkout.** There are pre-existing type
  errors (unused imports, a `BranchForm` `status` type mismatch, and `tsconfig.node.json`
  `include`s `vite.config.ts` while the file is actually `vite.config.js`). These are unrelated
  to environment setup. `npm run build` does **not** run `tsc` (Vite strips types without
  type-checking), so the build still succeeds.
- **Backend / API base URL.** The app talks to a REST backend via `VITE_API_BASE_URL`
  (e.g. auth: `/auth/session`, `/auth/login`). No backend ships in this repo. Create a `.env`
  (gitignored) to configure it:
  - `VITE_API_BASE_URL=<backend-url>`
  - `VITE_USE_MOCK=true` — activates the in-memory mock in `src/redux/baseQuery.tsx`.
- **The built-in mock only covers `/tenants` and `/branches`.** It does **not** mock
  `/auth/*` or `/dashboard/stats`. Because `ProtectedRoutes` gates on `GET /auth/session`,
  running with only the mock still redirects to `/auth/login` (session isn't mocked), so the
  authenticated `/admin/*` pages are not reachable without a real backend. The dashboard page
  itself has a built-in dummy-data fallback for when its API call fails.
- **Mock-mode mutations currently throw.** In mock mode, mutating endpoints (e.g.
  `PATCH /branches/:id/status`, `POST /branches`) throw `Cannot assign to read only property`
  because the mock returns the live in-memory array, which RTK Query then deep-freezes via
  Immer. Full CRUD requires pointing `VITE_API_BASE_URL` at a running backend (or extending the
  mock to return fresh copies). To smoke-test the authenticated admin UI without a backend, add
  temporary mock handlers for `/auth/session` (return a session object) and return fresh arrays
  from mock mutations — remember these are throwaway and should not be committed.
