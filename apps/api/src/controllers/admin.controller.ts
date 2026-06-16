import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models'
import { AuthRequest } from '../middleware/auth.middleware'

// GET /api/admins — list all admins (superadmin only)
export async function getAdmins(req: Request, res: Response): Promise<void> {
  try {
    const admins = await User.find({}, '-passwordHash -refreshTokens').sort({ createdAt: -1 })
    res.json(admins)
  } catch { res.status(500).json({ error: 'Server error' }) }
}

// POST /api/admins — create new admin (superadmin only)
export async function createAdmin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password, name, permissions } = req.body
    if (!email || !password || !name) { res.status(400).json({ error: 'Email, password and name are required' }); return }
    const existing = await User.findOne({ email })
    if (existing) { res.status(400).json({ error: 'User already exists' }); return }
    const passwordHash = await bcrypt.hash(password, 12)
    const admin = await User.create({
      email, passwordHash, name, role: 'admin',
      permissions: permissions || ['projects', 'testimonials', 'contacts', 'services'],
      createdBy: req.user?.id,
    })
    res.status(201).json({ id: admin._id, email: admin.email, name: admin.name, role: admin.role })
  } catch (err) { res.status(500).json({ error: String(err) }) }
}

// PUT /api/admins/:id — update admin (superadmin only)
export async function updateAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { name, permissions, isActive, password } = req.body
    const update: Record<string, unknown> = { name, permissions, isActive }
    if (password) update.passwordHash = await bcrypt.hash(password, 12)
    const admin = await User.findByIdAndUpdate(req.params.id, update, { new: true, select: '-passwordHash -refreshTokens' })
    if (!admin) { res.status(404).json({ error: 'Not found' }); return }
    res.json(admin)
  } catch (err) { res.status(400).json({ error: String(err) }) }
}

// DELETE /api/admins/:id — delete admin (superadmin only, can't delete self)
export async function deleteAdmin(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (req.params.id === req.user?.id) { res.status(400).json({ error: "Can't delete your own account" }); return }
    const admin = await User.findById(req.params.id)
    if (!admin) { res.status(404).json({ error: 'Not found' }); return }
    if (admin.role === 'superadmin') { res.status(403).json({ error: "Can't delete superadmin" }); return }
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch { res.status(500).json({ error: 'Server error' }) }
}

// GET /api/admins/me — current user profile
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user?.id, '-passwordHash -refreshTokens')
    if (!user) { res.status(404).json({ error: 'Not found' }); return }
    res.json(user)
  } catch { res.status(500).json({ error: 'Server error' }) }
}
