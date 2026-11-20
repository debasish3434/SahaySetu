# 🌉 Sahay Setu — Disaster Response Platform (Sprint 1)

> **"A bridge to help, when it matters most."**  
> Real-time disaster incident reporting, tracking, and response coordination for India.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Features (Sprint 1)](#-features-sprint-1)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Setup & Installation](#-setup--installation)
- [Running the Project](#-running-the-project)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| UI Enhancements | Framer Motion, React Icons, React Hot Toast |
| Forms | React Hook Form |
| Maps | Leaflet + React-Leaflet |
| HTTP | Axios |
| Routing | React Router v6 |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT, bcryptjs |
| File Uploads | Cloudinary + Multer |
| Validation | express-validator |

---

## ✅ Features (Sprint 1)

### Authentication
- [x] User Registration (citizen / volunteer)
- [x] Citizens can sign in immediately after registration; Volunteer and Coordinator access requires Super Admin approval
- [x] Login with JWT
- [x] Forgot Password (token generated & logged in dev mode)
- [x] Reset Password via token
- [x] Role-Based Access Control (citizen, volunteer, admin)
- [x] Protected & Guest Routes

### User Management
- [x] View Profile
- [x] Edit Profile (name, phone, address, bio)
- [x] Upload Profile Photo (via Cloudinary)

### Incident Reporting
- [x] Report Incident with title, description, category, severity
- [x] GPS auto-location via Browser Geolocation API
- [x] Interactive Leaflet map for location picking
- [x] Upload up to 5 disaster photos (drag & drop)
- [x] Save to MongoDB with geospatial indexing
- [x] View all incidents on dashboard
- [x] View own reports (My Reports page)
- [x] View full incident detail page
- [x] Delete incident (owner or admin)
- [x] Update incident status (volunteer / admin only)

---

## 📁 Project Structure

```
sahay-setu/
├── backend/
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── cloudinary.js       # Cloudinary + multer storage
│   ├── controllers/
│   │   ├── authController.js   # register, login, forgot/reset password
│   │   ├── userController.js   # profile get/update/photo
│   │   └── incidentController.js # CRUD + status update
│   ├── middleware/
│   │   ├── auth.js             # protect + authorize
│   │   ├── errorHandler.js     # centralized error handling
│   │   └── upload.js           # multer upload config
│   ├── models/
│   │   ├── User.js             # User schema with bcrypt
│   │   └── Incident.js         # Incident schema with 2dsphere index
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth/*
│   │   ├── userRoutes.js       # /api/users/*
│   │   └── incidentRoutes.js   # /api/incidents/*
│   ├── utils/
│   │   ├── generateToken.js    # JWT signing helper
│   │   └── validators.js       # express-validator chains
│   ├── .env.example            # ← copy to .env and fill values
│   ├── package.json
│   └── server.js               # Express app entry point
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axios.js            # Axios instance with JWT interceptor
    │   │   ├── authApi.js          # Auth API calls
    │   │   ├── userApi.js          # User/profile API calls
    │   │   └── incidentApi.js      # Incident CRUD API calls
    │   ├── components/
    │   │   ├── auth/               # ProtectedRoute, GuestRoute
    │   │   ├── common/             # Button, Input, Select, TextArea, Badge, etc.
    │   │   ├── incident/           # IncidentCard, LocationPicker, PhotoUpload
    │   │   ├── layout/             # DashboardLayout, Sidebar, Navbar
    │   │   └── profile/            # AvatarUploader
    │   ├── context/
    │   │   └── AuthContext.jsx     # Global auth state
    │   ├── hooks/
    │   │   ├── useAuth.js          # Auth context consumer
    │   │   └── useGeolocation.js   # Browser Geolocation API wrapper
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── ForgotPassword.jsx
    │   │   ├── ResetPassword.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Profile.jsx
    │   │   ├── ReportIncident.jsx
    │   │   ├── IncidentDetail.jsx  # NEW
    │   │   ├── MyIncidents.jsx     # NEW
    │   │   └── NotFound.jsx
    │   ├── utils/
    │   │   ├── constants.js        # Enums, label maps
    │   │   └── formatters.js       # Date, time-ago, initials helpers
    │   ├── App.jsx                 # Route tree
    │   ├── main.jsx                # React entry point
    │   └── index.css               # Global styles + Tailwind
    ├── .env.example                # ← copy to .env and fill values
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 📦 Prerequisites

Before you begin, make sure you have installed:

- **Node.js** v18 or later → https://nodejs.org/
- **npm** v9+ (comes with Node.js)
- A **MongoDB Atlas** account → https://cloud.mongodb.com (free tier works)
- A **Cloudinary** account → https://cloudinary.com (free tier works)

---

## ⚙️ Setup & Installation

### Step 1 — Clone or open the project folder

```bash
cd "SahaySetu 1st review/sahay-setu-sprint1/sahay-setu"
```

### Step 2 — Set up Backend environment variables

```bash
cd backend
copy .env.example .env
```

Open `backend/.env` in any text editor and fill in your real values:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# From MongoDB Atlas → Connect → Drivers
MONGO_URI=mongodb+srv://yourUsername:yourPassword@cluster0.xxxxx.mongodb.net/sahay-setu?retryWrites=true&w=majority

# Use any random 32+ character string (e.g. from https://randomkeygen.com)
JWT_SECRET=myVeryLongSuperSecretKeyAtLeast32Characters

# From Cloudinary Dashboard
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_api_secret_here
```

### Step 3 — Install Backend dependencies

```bash
# Still inside backend/
npm install
```

### Step 4 — Set up Frontend environment variables

```bash
cd ../frontend
copy .env.example .env
```

The default value is fine for local development:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Step 5 — Install Frontend dependencies

```bash
# Inside frontend/
npm install
```

---

## 🚀 Running the Project

You need **two terminal windows** — one for the backend and one for the frontend.

### Terminal 1 — Start the Backend

```bash
cd "SahaySetu 1st review/sahay-setu-sprint1/sahay-setu/backend"
npm run dev
```

You should see:
```
MongoDB Connected: cluster0.xxxxx.mongodb.net
Sahay Setu API running in development mode on port 5000
```

Verify the API is live: http://localhost:5000/api/health

### Terminal 2 — Start the Frontend

```bash
cd "SahaySetu 1st review/sahay-setu-sprint1/sahay-setu/frontend"
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

Open your browser at: **http://localhost:5173**

---

## 🔌 API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | 🔒 JWT | Get current user |
| POST | `/api/auth/forgot-password` | Public | Request reset link |
| PUT | `/api/auth/reset-password/:token` | Public | Reset password |

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/profile` | 🔒 JWT | Get own profile |
| PUT | `/api/users/profile` | 🔒 JWT | Update profile |
| PUT | `/api/users/profile/photo` | 🔒 JWT | Upload profile photo |

### Incidents — `/api/incidents`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/incidents` | 🔒 JWT | Report new incident |
| GET | `/api/incidents` | 🔒 JWT | List incidents (paginated) |
| GET | `/api/incidents?mine=true` | 🔒 JWT | List own incidents |
| GET | `/api/incidents/:id` | 🔒 JWT | Get incident detail |
| PUT | `/api/incidents/:id` | 🔒 JWT (owner/admin) | Update incident fields |
| DELETE | `/api/incidents/:id` | 🔒 JWT (owner/admin) | Delete incident |
| PATCH | `/api/incidents/:id/status` | 🔒 Volunteer/Admin | Update status |

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | `development` or `production` | ✅ |
| `PORT` | Server port (default 5000) | ✅ |
| `CLIENT_URL` | Frontend URL for CORS | ✅ |
| `MONGO_URI` | MongoDB Atlas connection string | ✅ |
| `JWT_SECRET` | Secret key for signing JWTs | ✅ |
| `JWT_EXPIRES_IN` | Token expiry (default `7d`) | Optional |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | Optional |
| `RATE_LIMIT_MAX` | Max requests per window | Optional |

### Frontend (`frontend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | Optional (defaults to localhost:5000/api) |

---

## 🩺 Troubleshooting

### ❌ `MONGO_URI` connection error
- Whitelist your IP in MongoDB Atlas: **Network Access → Add IP Address → Allow from anywhere** (for dev)
- Double-check username/password in the connection string (special chars must be URL-encoded)

### ❌ Cloudinary upload fails
- Verify all three Cloudinary vars are set: `CLOUD_NAME`, `API_KEY`, `API_SECRET`
- Check your Cloudinary dashboard for upload errors

### ❌ Frontend can't reach backend (Network Error)
- Make sure backend is running on port 5000
- Check `frontend/.env` has `VITE_API_BASE_URL=http://localhost:5000/api`
- Try the health check: http://localhost:5000/api/health

### ❌ Map not rendering (blank white box)
- The Leaflet CSS import order in `index.css` must be **before** Tailwind directives (already fixed in this version)

### ❌ `Cannot find module` errors
- Run `npm install` inside both `backend/` and `frontend/` directories

### ❌ GPS location not working
- Browser requires HTTPS for Geolocation in production; localhost works in development
- Allow location access when the browser prompts

---

## 📝 Notes for Development

- In **development mode**, the `forgot-password` endpoint returns the reset URL in the response body (check the JSON response or backend console) — no email service needed
- Default roles: `citizen` and `volunteer` can self-register; `admin` must be set manually in MongoDB
- Profile photos and incident photos are stored on **Cloudinary** — local storage is not used

---

*Sahay Setu Sprint 1 — Built with ❤️ for disaster response coordination*
