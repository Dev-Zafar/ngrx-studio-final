# NGRX Studio — Complete Setup Guide

> **Muhammad Zafar Jahangir** | Premium Video Editing Agency Website  
> Next.js 14 · Express.js · MongoDB · Dark/Light Theme · Full CMS

---

## 🔐 Default Login

| Field    | Value                          |
|----------|-------------------------------|
| URL      | http://localhost:3000/admin    |
| Email    | zafarjahangeer512@gmail.com   |
| Password | NGRXStudio@2024!              |

> Run `npm run seed` in `apps/api` first to create this account.

---

## ⚡ Quick Start (3 steps)

### Step 1 — Configure MongoDB

Open `apps/api/.env` and replace this line:
```
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster0.xxxxx.mongodb.net/ngrx-studio...
```
With your actual MongoDB Atlas connection string.

**Get one free at:** https://www.mongodb.com/atlas  
Create cluster → Connect → Drivers → Copy string → Replace `<password>`

---

### Step 2 — Install & Seed

```bash
# Terminal 1 — API
cd apps/api
npm install
npm run seed        # Creates DB data + superadmin account
npm run dev         # Starts on http://localhost:4000
```

```bash
# Terminal 2 — Frontend
cd apps/web
npm install
npm run dev         # Starts on http://localhost:3000
```

---

### Step 3 — Open

| URL                           | What it is              |
|-------------------------------|-------------------------|
| http://localhost:3000         | Main website            |
| http://localhost:3000/admin   | Admin login             |
| http://localhost:4000/api/health | API health check     |

---

## 📁 Project Structure

```
ngrx-studio/
├── apps/
│   ├── web/                    ← Next.js 14 frontend (port 3000)
│   │   ├── app/
│   │   │   ├── page.tsx        ← Home page
│   │   │   ├── layout.tsx      ← Root layout + providers
│   │   │   ├── globals.css     ← Dark/light theme tokens
│   │   │   └── admin/          ← CMS dashboard (protected)
│   │   │       ├── page.tsx    ← Login
│   │   │       ├── dashboard/  ← Stats overview
│   │   │       ├── projects/   ← Full CRUD + video upload
│   │   │       ├── services/   ← Full CRUD
│   │   │       ├── testimonials/ ← Full CRUD
│   │   │       ├── inquiries/  ← Contact form submissions
│   │   │       ├── admins/     ← Admin user management (superadmin)
│   │   │       └── settings/   ← Site settings, socials, SEO
│   │   └── components/
│   │       ├── sections/       ← All page sections (dynamic)
│   │       ├── animations/     ← Cursor, loader, theme, scroll
│   │       ├── layout/         ← Navbar, Footer
│   │       └── ui/             ← Reusable admin components
│   │
│   └── api/                    ← Express.js backend (port 4000)
│       └── src/
│           ├── controllers/    ← Auth, Projects, Contact, etc.
│           ├── models/         ← All MongoDB schemas
│           ├── routes/         ← All API endpoints
│           ├── middleware/     ← Auth, upload, permissions
│           ├── config/         ← DB, Cloudinary
│           └── seed.ts         ← Database seeder
```

---

## 🗄️ What Gets Seeded

Running `npm run seed` creates:
- ✅ **Superadmin** account (zafarjahangeer512@gmail.com)
- ✅ **8 portfolio projects** (video, graphics, social, branding)
- ✅ **6 testimonials** from realistic clients
- ✅ **5 services** (Short-form, Podcast, YouTube, Motion, Design)
- ✅ **Site settings** with your email & WhatsApp

---

## ⚙️ Environment Variables

### `apps/api/.env`
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=           ← Your MongoDB Atlas URI (REQUIRED)
JWT_SECRET=            ← Any long random string
JWT_REFRESH_SECRET=    ← Any different long random string
CLIENT_URL=http://localhost:3000

# Email notifications (optional)
EMAIL_USER=zafarjahangeer512@gmail.com
EMAIL_PASS=            ← Gmail App Password (not your login password)
EMAIL_TO=zafarjahangeer512@gmail.com

# Cloudinary (optional — for image/video uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### `apps/web/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 📧 Gmail App Password Setup

1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Search "App passwords" → Create one for "Mail"
4. Paste the 16-character code into `EMAIL_PASS`

---

## 🌐 CMS Features

### From Admin Dashboard you can:
- **Projects** — Add/edit/delete with thumbnail upload, YouTube embed, Reel URLs
- **Services** — Manage what services appear on site, reorder them
- **Testimonials** — Add client reviews, feature/publish toggle
- **Inquiries** — View contact form submissions, update status, reply via email
- **Admin Users** — Create sub-admins with custom permissions (superadmin only)
- **Site Settings** — Change email, WhatsApp, all social links, hero text, SEO

### Media Types Supported:
- 📸 Image upload (Cloudinary)
- 🎬 Direct video upload (Cloudinary)
- ▶️ YouTube embed URL
- 📱 Instagram Reel / TikTok URL

---

## 🚀 Deploy to Production

### Frontend → Vercel
```bash
# 1. Push to GitHub
# 2. Import repo at vercel.com
# 3. Set Root Directory: apps/web
# 4. Add env vars in Vercel dashboard:
#    NEXT_PUBLIC_API_URL=https://your-api.railway.app/api
```

### Backend → Railway
```bash
# 1. New project → Deploy from GitHub
# 2. Set Root Directory: apps/api
# 3. Add all .env variables in Railway dashboard
# 4. Add start command: npm run build && npm start
```

---

## 🔑 API Endpoints

```
GET  /api/health                  Public  - Health check
POST /api/auth/login              Public  - Login
POST /api/auth/refresh            Public  - Refresh token
POST /api/auth/logout             Public  - Logout
POST /api/auth/change-password    Auth    - Change password

GET    /api/projects              Public  - List projects
GET    /api/projects/:slug        Public  - Single project
POST   /api/projects              Admin   - Create (with file upload)
PUT    /api/projects/:id          Admin   - Update
PATCH  /api/projects/:id/toggle-publish Admin - Toggle published
DELETE /api/projects/:id          Admin   - Delete

POST /api/contact                 Public  - Submit brief
GET  /api/contact                 Admin   - View all inquiries
PUT  /api/contact/:id             Admin   - Update status

GET    /api/testimonials          Public  - List published
POST   /api/testimonials          Admin   - Create
PUT    /api/testimonials/:id      Admin   - Update
DELETE /api/testimonials/:id      Admin   - Delete

GET    /api/services              Public  - List services
POST   /api/services              Admin   - Create
PUT    /api/services/:id          Admin   - Update
DELETE /api/services/:id          Admin   - Delete

GET    /api/settings              Public  - Get site settings
PUT    /api/settings              Superadmin - Update settings

GET    /api/admins                Superadmin - List admins
POST   /api/admins                Superadmin - Create admin
PUT    /api/admins/:id            Superadmin - Update admin
DELETE /api/admins/:id            Superadmin - Delete admin
```

---

Built with ❤️ by Muhammad Zafar Jahangir — NGRX Studio
