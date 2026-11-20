# SahaySetu Sprint 4 status and operations

This project already had most Sprint 4 screens and APIs. This update completes missing notification event wiring and improves the authenticated application shell. The status below distinguishes implemented code from work that still needs a live environment or additional acceptance testing.

## Story status

| Stories | Status | Evidence / remaining work |
| --- | --- | --- |
| SS-50–54 Notifications | Implemented in code | Database notifications cover new incidents and emergency requests, volunteer assignments, incident and request status changes, resource updates, verification decisions, and admin announcements. The UI polls for updates, shows unread counts, supports read/unread, and links to related records or management pages. Verify delivery with multiple role accounts against a connected MongoDB database. |
| SS-55–59 Admin dashboard | Implemented in code | Admin routes, user/volunteer/incident/resource management, announcements, and persisted system settings exist with role authorization. Run through the workflows with an admin account and review authorization boundaries before production. |
| SS-60–64 Reports and analytics | Partially implemented | Statistics and Recharts reports read stored records and CSV export exists. Date range filters and consistent filter-aware export are not implemented. Resource utilization is currently inferred from resource status/quantity because the resource schema has no allocation ledger. |
| SS-65–67 Testing | Partially implemented | Frontend lint and production build are available. Database-backed authentication, four-role end-to-end and performance tests are still outstanding. |
| SS-68 Deployment | Preparation only | Environment examples and local run instructions exist. No production deployment was performed or verified. Follow the deployment steps below and set provider-specific secrets in the hosting platform. |
| SS-69 Critical bug review | Partially complete | This pass reviewed and corrected notification event wiring and the shared navigation shell. A full regression review across all existing workflows still requires running the app with configured services and all four roles. |

## Registration and sign-in behavior

Registration no longer uses email or mobile OTP. Citizens receive a session immediately after creating an account. Volunteer and Coordinator applications remain pending until Super Admin approval. Administrators are manually created by the Super Admin and set a permanent password at first login.

## Run locally

Use two terminals from `sahay-setu-sprint1/sahay-setu`.

Backend:

```powershell
cd backend
npm install
npm run dev
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

The API health endpoint is `http://localhost:5000/api/health`; Vite normally serves the app at `http://localhost:5173`.

## Environment setup

Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI`, a unique long `JWT_SECRET`, `PORT`, `NODE_ENV`, and Cloudinary credentials used for uploads. Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL` to the backend API base, such as `http://localhost:5000/api`.

Never commit `.env` files or paste their contents into issue reports. Frontend variables prefixed with `VITE_` are public in the built bundle and must not contain secrets.

## Deployment checklist

1. Provision MongoDB Atlas and restrict network access to the backend host where possible. Preserve the existing database; do not run the destructive seed command against production.
2. Deploy `backend/` as a Node.js service using `npm install` and `npm start`. Set `NODE_ENV=production`, `PORT` as provided by the host, `MONGO_URI`, `JWT_SECRET`, Cloudinary credentials, and `CLIENT_URL`. Add any additional allowed frontend origins to `CORS_ORIGINS` as a comma-separated list.
3. Deploy `frontend/` as a static Vite site using `npm install` and `npm run build`, publishing `dist/`. Set `VITE_API_BASE_URL` to the deployed API URL plus `/api` before building.
4. Configure HTTPS and the frontend origin in `CLIENT_URL` or `CORS_ORIGINS`. Production CORS allows configured browser origins and the native Capacitor origins; development also allows localhost and private LAN origins.
5. Confirm `/api/health`, registration/login, role protected routes, upload behavior, notification creation/polling, analytics, and production build against the hosted database.
6. Create or promote the first administrator through a controlled database operation. Do not expose admin registration to the public.

## Verification commands

```powershell
# frontend production bundle
cd frontend
npm run build

# frontend static analysis
npm run lint

# backend syntax smoke check
cd ../backend
node --check server.js
```

There is no `npm test` script or automated backend/frontend test suite at this time. Verify the four role workflows manually using separate test accounts and non-production data before presenting the application as fully tested.
