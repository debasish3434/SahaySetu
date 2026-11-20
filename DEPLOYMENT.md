# SahaySetu – Deployment Guide

> Disaster Response and Resource Coordination Platform  
> Stack: React + Vite + Tailwind CSS · Node.js + Express · MongoDB Atlas · JWT · Cloudinary · Multer

---

## 📁 Project Structure

```
sahay-setu/
├── backend/          ← Node.js / Express API server
│   ├── server.js
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── utils/
└── frontend/         ← React / Vite SPA
    ├── src/
    ├── dist/         ← production build output
    └── vite.config.js
```

---

## 🔧 Environment Variables

### Backend — `backend/.env`

```env
# Server
PORT=5000
NODE_ENV=production

# MongoDB Atlas
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/sahay-setu?retryWrites=true&w=majority

# JWT
JWT_SECRET=<your-long-random-secret-min-32-chars>
JWT_EXPIRES_IN=7d

# Cloudinary (for photo/video uploads)
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Browser origin allowed by backend CORS
CLIENT_URL=https://your-frontend-domain.vercel.app
# Optional comma-separated additional origins
CORS_ORIGINS=https://admin.example.com,https://staging.example.com

# Optional email delivery for password reset: configure Resend or SMTP.
RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=SahaySetu <verify@your-verified-domain.example>
# Alternatively configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
# EMAIL_FROM_ADDRESS and EMAIL_FROM_NAME in backend/.env.example.

```

### Frontend — `frontend/.env`

```env
# Point to your deployed backend API
VITE_API_BASE_URL=http://localhost:5000/api

# For production, replace with your deployed backend URL:
# VITE_API_BASE_URL=https://your-backend.railway.app/api
```

### Registration and sign-in

Public registration does not require email or mobile verification. Citizens receive a session immediately and can use email and password to sign in on their devices. Volunteer and Coordinator registrations require an `@sahaysetu.com` email and remain pending until approved by the Super Admin. The Super Admin creates administrator accounts manually; new administrators sign in using their administrator ID or email and temporary password, then change that password on first login.

---

## 💻 Local Development

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free M0 tier works)
- Cloudinary account (free tier)

### 1. Install dependencies

```powershell
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Set up environment files

```powershell
# Copy the templates above and fill in your values
# backend/.env
# frontend/.env
```

### 3. Start development servers

```powershell
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open: http://localhost:5173

---

## 🚀 Backend Deployment — Railway

Railway is recommended for the Node.js backend.

### Steps

1. Push your code to GitHub (or GitLab / Bitbucket).
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. Select your repository and choose the **`backend`** directory as the root (or use the monorepo root and set the start command).
4. Add all backend environment variables in Railway's **Variables** tab.
5. Railway auto-detects Node.js; set the **Start Command** to:
   ```
   node server.js
   ```
6. Railway will give you a URL like `https://sahay-setu-backend.railway.app`.
7. Copy that URL and update `frontend/.env`:
   ```env
   VITE_API_URL=https://sahay-setu-backend.railway.app/api
   ```

### Alternative — Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**.
2. Connect your GitHub repo; set **Root Directory** to `backend`.
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `node server.js`
5. Add all environment variables under **Environment**.

---

## 🌐 Frontend Deployment — Vercel

### Steps

1. Make sure `frontend/.env` has the correct `VITE_API_URL` (pointing to your deployed backend).
2. Run a production build locally to verify it works:
   ```powershell
   cd frontend
   npm run build
   ```
3. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import from GitHub.
4. Set **Root Directory** to `frontend`.
5. Vercel auto-detects Vite. Build command: `npm run build`, output directory: `dist`.
6. Add environment variable `VITE_API_URL` in Vercel's **Environment Variables** settings.
7. Deploy. Vercel provides a URL like `https://sahay-setu.vercel.app`.
8. Update your backend's `CLIENT_URL` env var to match.

### Alternative — Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site** → Import from Git.
2. Build command: `npm run build`, publish directory: `dist`.
3. Add `VITE_API_URL` in **Site settings → Environment variables**.
4. Add a `frontend/public/_redirects` file for SPA routing:
   ```
   /*  /index.html  200
   ```

---

## 🔑 Creating the First Admin Account

The registration form defaults to the **Citizen** role. To create an admin:

1. Register normally as a Citizen.
2. Use MongoDB Atlas → Browse Collections → `users` collection.
3. Find your user document and change `role` from `"citizen"` to `"admin"`.
4. Log in again — you will now have admin access.

---

## 🧪 Running the Application Locally (Quick Reference)

```powershell
# Backend
cd "c:\Users\DELL\OneDrive\Desktop\SahaySetu review wise\sahay-setu-sprint1\sahay-setu\backend"
npm run dev

# Frontend (separate terminal)
cd "c:\Users\DELL\OneDrive\Desktop\SahaySetu review wise\sahay-setu-sprint1\sahay-setu\frontend"
npm run dev
```

---

## 📦 Sprint 4 Feature Checklist

| Story | Feature | Status |
|-------|---------|--------|
| SS-50 | Emergency alert notifications (coordinators/admin alerted on new incidents) | ✅ |
| SS-51 | Volunteer assignment notifications | ✅ |
| SS-52 | Incident status change notifications (reporter notified) | ✅ |
| SS-53 | Resource availability notifications | ✅ |
| SS-54 | System announcements (admin can send via `/admin/announcements`) | ✅ |
| SS-55 | Notification centre page with read/unread/delete | ✅ |
| SS-56 | Admin volunteer management page | ✅ |
| SS-57 | Volunteer verification workflow (coordinator) | ✅ |
| SS-58 | Role-based access control enforcement | ✅ |
| SS-59 | System settings (admin configurable) | ✅ |
| SS-60 | Analytics dashboard | ✅ |
| SS-61 | Incident reports with charts | ✅ |
| SS-62 | Volunteer reports | ✅ |
| SS-63 | Resource reports | ✅ |
| SS-64 | Data export capability | ✅ |
| SS-65 | Unit testing | ⚠️ Manual testing (see below) |
| SS-66 | Integration testing | ⚠️ Manual testing |
| SS-67 | Performance testing | ⚠️ Manual testing |
| SS-68 | Deployment documentation | ✅ (this file) |
| SS-69 | Project demonstration readiness | ✅ |

---

## 🧪 Manual Testing Checklist (SS-65 to SS-67)

### Authentication
- [ ] Register as Citizen (email + password)
- [ ] Register as Volunteer (username + password)
- [ ] Login with valid credentials
- [ ] Login with invalid credentials → error shown
- [ ] JWT token persists across page refresh

### Citizen Flow
- [ ] Report an incident with map location
- [ ] View My Reports
- [ ] Submit Emergency Request
- [ ] View My Requests
- [ ] View Nearby Incidents (requires location permission)
- [ ] View shelter list
- [ ] Check Notifications page

### Volunteer Flow
- [ ] Apply to become volunteer
- [ ] View Available Incidents
- [ ] Accept/decline tasks
- [ ] Update task status (in-progress → completed)
- [ ] View Task History
- [ ] Receive notification when assigned

### Coordinator Flow
- [ ] Verify / reject volunteer applications
- [ ] Update incident status
- [ ] Assign volunteer to incident
- [ ] Manage shelters (register, update capacity)
- [ ] Manage resources
- [ ] View Analytics dashboards
- [ ] Receive emergency alert notifications

### Admin Flow
- [ ] User management (view, deactivate, change roles)
- [ ] Volunteer management
- [ ] Send announcement (all roles or specific roles)
- [ ] System settings
- [ ] Analytics access

---

## 🗄️ MongoDB Atlas Setup

1. Create a free account at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a free **M0** cluster.
3. Under **Database Access**, create a user with read/write permissions.
4. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) or your server's IP.
5. Click **Connect** → **Connect your application** → copy the connection string.
6. Replace `<username>`, `<password>` and `<dbname>` in the string and paste it as `MONGODB_URI`.

---

## ☁️ Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From the dashboard, copy **Cloud Name**, **API Key**, and **API Secret**.
3. Paste them into your backend `.env` file.

---

*Generated for SahaySetu B.Tech Final Year Project — Sprint 4*
