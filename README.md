# NGRX Studio — Complete Setup Guide

> Premium digital agency website for Muhammad Zafar Jahangir  
> Built with Next.js 14, Express.js, MongoDB, Framer Motion

---

## 📁 Project Structure

```
ngrx-studio/
├── apps/
│   ├── web/          ← Next.js 14 frontend (runs on port 3000)
│   └── api/          ← Express.js backend (runs on port 4000)
└── package.json      ← Root workspace scripts
```

---

## ⚙️ Prerequisites

Make sure you have these installed before starting:

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| Git | any | `git --version` |

---

## 🚀 STEP-BY-STEP SETUP

### STEP 1 — Download / Clone the project

If you have the zip file, extract it. If using git:
```bash
git clone <your-repo-url>
cd ngrx-studio
```

---

### STEP 2 — Set up the Backend (API)

#### 2a. Install backend dependencies
```bash
cd apps/api
npm install
```

#### 2b. Create backend environment file
```bash
# Copy the example file
cp .env.example .env
```

Now open `apps/api/.env` in any text editor and fill in:

**Required fields:**
```
PORT=4000
NODE_ENV=development
MONGODB_URI=<your MongoDB connection string>
JWT_SECRET=anyrandomlongstring123abc
JWT_REFRESH_SECRET=anotherlongstring456def
CLIENT_URL=http://localhost:3000
ADMIN_SECRET=mysecretadminkey
```

**Getting MongoDB URI (free):**
1. Go to https://www.mongodb.com/atlas
2. Create free account → Create free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password

**Email setup (optional but recommended):**
```
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```
For Gmail app password: Google Account → Security → 2FA → App Passwords

---

### STEP 3 — Set up the Frontend

#### 3a. Install frontend dependencies
```bash
cd ../web
npm install
```

#### 3b. Create frontend environment file
```bash
cp .env.local.example .env.local
```

The defaults work for local development. No changes needed unless you deploy.

---

### STEP 4 — Run Both Servers

Open **two terminal windows/tabs**:

**Terminal 1 — Backend:**
```bash
cd apps/api
npm run dev
```
You should see:
```
✅ MongoDB connected
🚀 API running on http://localhost:4000
```

**Terminal 2 — Frontend:**
```bash
cd apps/web
npm run dev
```
You should see:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

---

### STEP 5 — Create Admin Account

Once the API is running, create your admin user by running this in a new terminal:

```bash
curl -X POST http://localhost:4000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ngrxstudio.com",
    "password": "YourSecurePassword123",
    "secret": "mysecretadminkey"
  }'
```

> ⚠️ The `secret` value must match `ADMIN_SECRET` in your `.env` file.

**On Windows (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/auth/create-admin" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@ngrxstudio.com","password":"YourSecurePassword123","secret":"mysecretadminkey"}'
```

---

### STEP 6 — Access Your Website

| URL | What it is |
|-----|-----------|
| http://localhost:3000 | Main website (public) |
| http://localhost:3000/admin | Admin login |
| http://localhost:4000/api/health | API health check |

**Admin login:**
- Email: whatever you used in Step 5
- Password: whatever you used in Step 5

---

## 🎨 Customization

### Change your contact info
Edit `apps/web/components/sections/ContactSection.tsx`:
```tsx
// Find and replace:
href="https://wa.me/923001234567"  → your WhatsApp number
val: 'hello@ngrxstudio.com'        → your email
```

### Change your WhatsApp number
Format: `https://wa.me/[country code][number]`
Example: Pakistan +92 300 1234567 → `https://wa.me/923001234567`

### Change social media links
Edit `apps/web/components/sections/ContactSection.tsx`:
```tsx
const socialLinks = [
  { label: 'Instagram', icon: '📸', href: 'https://instagram.com/yourhandle' },
  { label: 'YouTube', icon: '▶️', href: 'https://youtube.com/@yourchannel' },
  ...
]
```

### Change the color accent
Edit `apps/web/app/globals.css`:
```css
--color-accent-1: #7C3AED;   /* Main purple — change this */
--color-accent-2: #06B6D4;   /* Cyan accent — change this */
```

---

## 📦 Building for Production

### Build frontend:
```bash
cd apps/web
npm run build
npm start
```

### Build backend:
```bash
cd apps/api
npm run build
node dist/index.js
```

---

## 🌐 Deployment

### Frontend → Vercel (Recommended, free)
1. Push your code to GitHub
2. Go to https://vercel.com → New Project → Import from GitHub
3. Select `apps/web` as the root directory
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your deployed API URL
5. Deploy

### Backend → Railway (Recommended, free tier)
1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select `apps/api` as root directory
3. Add all environment variables from `.env`
4. Deploy — Railway gives you a URL like `https://xxx.railway.app`
5. Update `NEXT_PUBLIC_API_URL` in Vercel to point to this URL

---

## 🛠️ Troubleshooting

**"Cannot connect to MongoDB"**
→ Check your `MONGODB_URI` in `.env`
→ Make sure your IP is whitelisted in MongoDB Atlas (Network Access → Add IP)

**"npm install fails"**
→ Make sure you're in the right folder (`apps/web` or `apps/api`)
→ Try `npm install --legacy-peer-deps`

**"Port already in use"**
→ Change `PORT=4000` to `PORT=4001` in `apps/api/.env`

**"Admin login not working"**
→ Make sure the API server is running on port 4000
→ Re-create admin user with Step 5

**"Animations not smooth"**
→ Make sure you have hardware acceleration enabled in your browser
→ Try Chrome for the best experience

---

## 📂 Key Files Reference

| File | Purpose |
|------|---------|
| `apps/web/app/page.tsx` | Home page (all sections) |
| `apps/web/app/admin/` | Admin dashboard |
| `apps/web/components/sections/` | All page sections |
| `apps/web/components/animations/` | Loader, cursor, reveal animations |
| `apps/web/app/globals.css` | Design tokens, colors |
| `apps/web/tailwind.config.ts` | Tailwind customization |
| `apps/api/src/index.ts` | API server entry |
| `apps/api/src/models/index.ts` | All database schemas |
| `apps/api/src/routes/index.ts` | All API endpoints |

---

## 🔗 API Endpoints

```
GET    /api/health              ← Check API is alive
POST   /api/auth/login          ← Admin login
POST   /api/auth/logout         ← Admin logout
POST   /api/auth/refresh        ← Refresh access token

GET    /api/projects            ← Get all projects (public)
POST   /api/projects            ← Create project (admin)
PUT    /api/projects/:id        ← Update project (admin)
DELETE /api/projects/:id        ← Delete project (admin)

POST   /api/contact             ← Submit contact form (public)
GET    /api/contact             ← View all inquiries (admin)
PUT    /api/contact/:id         ← Update inquiry status (admin)

GET    /api/testimonials        ← Get all testimonials (public)
POST   /api/testimonials        ← Create testimonial (admin)

GET    /api/services            ← Get all services (public)
POST   /api/services            ← Create service (admin)
```

---

Built with ❤️ by Muhammad Zafar Jahangir — NGRX Studio
