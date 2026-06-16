import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface JwtPayload { id: string; email: string; role: string; permissions: string[] }
export interface AuthRequest extends Request { user?: JwtPayload }

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ error: 'No token provided' }); return }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secret') as JwtPayload
    req.user = decoded
    next()
  } catch { res.status(401).json({ error: 'Invalid or expired token' }) }
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'superadmin') { res.status(403).json({ error: 'Superadmin access required' }); return }
  next()
}

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role === 'superadmin') { next(); return }
    if (!req.user?.permissions?.includes(permission)) { res.status(403).json({ error: `Permission denied: ${permission}` }); return }
    next()
  }
}
