import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import { connectDB } from './config/db'
import routes from './routes'

const app = express()
const PORT = process.env.PORT || 4000

// ─── Security ─────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  origin: ['https://ngrxstudio.vercel.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}))

// ─── Rate limiting ────────────────────────────────────────
app.use('/api/contact', rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false }))
app.use('/api/auth/login', rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false }))
app.use(rateLimit({ windowMs: 15 * 60_000, max: 200 }))

// ─── Parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// ─── Routes ───────────────────────────────────────────────
app.use('/api', routes)

// ─── 404 ──────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

// ─── Error handler ────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

// ─── Start ────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT as number, '0.0.0.0', () => console.log(`🚀 API running → on port ${PORT}`))
})