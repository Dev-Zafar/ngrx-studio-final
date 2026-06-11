import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models'

const ACCESS_EXPIRY = '15m'
const REFRESH_EXPIRY = '7d'

function generateTokens(payload: { id: string; email: string; role: string }) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: ACCESS_EXPIRY })
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh_secret', { expiresIn: REFRESH_EXPIRY })
  return { accessToken, refreshToken }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body
    if (!email || !password) { res.status(400).json({ error: 'Email and password required' }); return }

    const user = await User.findOne({ email })
    if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return }

    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) { res.status(401).json({ error: 'Invalid credentials' }); return }

    const { accessToken, refreshToken } = generateTokens({ id: user._id.toString(), email: user.email, role: user.role })

    user.refreshTokens.push(refreshToken)
    user.lastLogin = new Date()
    await user.save()

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 })
    res.json({ accessToken, user: { id: user._id, email: user.email, role: user.role } })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies?.refreshToken
    if (!token) { res.status(401).json({ error: 'No refresh token' }); return }

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret') as { id: string; email: string; role: string }
    const user = await User.findById(payload.id)
    if (!user || !user.refreshTokens.includes(token)) { res.status(401).json({ error: 'Invalid refresh token' }); return }

    // Rotate
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token)
    const { accessToken, refreshToken: newRefresh } = generateTokens({ id: user._id.toString(), email: user.email, role: user.role })
    user.refreshTokens.push(newRefresh)
    await user.save()

    res.cookie('refreshToken', newRefresh, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 })
    res.json({ accessToken })
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' })
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies?.refreshToken
    if (token) {
      const payload = jwt.decode(token) as { id?: string } | null
      if (payload?.id) {
        const user = await User.findById(payload.id)
        if (user) {
          user.refreshTokens = user.refreshTokens.filter((t) => t !== token)
          await user.save()
        }
      }
    }
    res.clearCookie('refreshToken')
    res.json({ message: 'Logged out' })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function createAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, secret } = req.body
    if (secret !== process.env.ADMIN_SECRET) { res.status(403).json({ error: 'Forbidden' }); return }
    const existing = await User.findOne({ email })
    if (existing) { res.status(400).json({ error: 'User already exists' }); return }
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ email, passwordHash, role: 'superadmin' })
    res.status(201).json({ id: user._id, email: user.email })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
}
