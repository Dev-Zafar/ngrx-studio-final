import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models'
import { AuthRequest } from '../middleware/auth.middleware'

function generateTokens(payload: { id: string; email: string; role: string; permissions: string[] }) {
  const accessToken  = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' })
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh_secret', { expiresIn: '7d' })
  return { accessToken, refreshToken }
}

// Helper for cookie options (Allows cross-domain Vercel -> Render)
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body
    if (!email || !password) { res.status(400).json({ error: 'Email and password required' }); return }
    const user = await User.findOne({ email })
    if (!user || !user.isActive) { res.status(401).json({ error: 'Invalid credentials' }); return }
    if (!await bcrypt.compare(password, user.passwordHash)) { res.status(401).json({ error: 'Invalid credentials' }); return }
    const { accessToken, refreshToken } = generateTokens({
      id: user._id.toString(), email: user.email, role: user.role, permissions: user.permissions
    })
    user.refreshTokens.push(refreshToken)
    user.lastLogin = new Date()
    await user.save()
    
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
    res.json({ accessToken, user: { id: user._id, email: user.email, name: user.name, role: user.role, permissions: user.permissions } })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies?.refreshToken
    if (!token) { res.status(401).json({ error: 'No refresh token' }); return }
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret') as {
      id: string; email: string; role: string; permissions: string[]
    }
    const user = await User.findById(payload.id)
    if (!user || !user.refreshTokens.includes(token)) { res.status(401).json({ error: 'Invalid refresh token' }); return }
    user.refreshTokens = user.refreshTokens.filter((t: string) => t !== token)
    const { accessToken, refreshToken: newRefresh } = generateTokens({
      id: user._id.toString(), email: user.email, role: user.role, permissions: user.permissions
    })
    user.refreshTokens.push(newRefresh)
    await user.save()
    
    res.cookie('refreshToken', newRefresh, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
    res.json({ accessToken })
  } catch { res.status(401).json({ error: 'Invalid refresh token' }) }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies?.refreshToken
    if (token) {
      const payload = jwt.decode(token) as { id?: string } | null
      if (payload?.id) {
        const user = await User.findById(payload.id)
        if (user) { user.refreshTokens = user.refreshTokens.filter((t: string) => t !== token); await user.save() }
      }
    }
    res.clearCookie('refreshToken', cookieOptions)
    res.json({ message: 'Logged out' })
  } catch { res.status(500).json({ error: 'Server error' }) }
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) { res.status(400).json({ error: 'Both passwords required' }); return }
    if (newPassword.length < 8) { res.status(400).json({ error: 'New password must be at least 8 characters' }); return }
    const user = await User.findById(req.user?.id)
    if (!user) { res.status(404).json({ error: 'User not found' }); return }
    if (!await bcrypt.compare(currentPassword, user.passwordHash)) {
      res.status(401).json({ error: 'Current password is incorrect' }); return
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12)
    user.refreshTokens = []
    await user.save()
    
    res.clearCookie('refreshToken', cookieOptions)
    res.json({ message: 'Password updated. Please log in again.' })
  } catch { res.status(500).json({ error: 'Server error' }) }
}