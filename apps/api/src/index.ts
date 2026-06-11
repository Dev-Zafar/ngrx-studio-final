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
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}))

// ─── Rate limiting ────────────────────────────────────────
const generalLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })
const contactLimit = rateLimit({ windowMs: 60 * 1000, max: 5, message: { error: 'Too many requests, slow down.' } })
const authLimit = rateLimit({ windowMs: 60 * 1000, max: 10 })

app.use('/api/contact', contactLimit)
app.use('/api/auth', authLimit)
app.use(generalLimit)

// ─── Body parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ─── Routes ───────────────────────────────────────────────
app.use('/api', routes)

// ─── 404 ──────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Route not found' }))

// ─── Error handler ────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

// ─── Start ────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API running on http://localhost:${PORT}`)
  })
})
