import { Router } from 'express'
import { login, refresh, logout, changePassword } from '../controllers/auth.controller'
import { getProjects, getProject, createProject, updateProject, deleteProject, togglePublish } from '../controllers/project.controller'
import { submitContact, getContacts, updateContactStatus } from '../controllers/contact.controller'
import { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial, getServices, createService, updateService, deleteService } from '../controllers/testimonial.controller'
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, getMe } from '../controllers/admin.controller'
import { getSettings, updateSettings } from '../controllers/settings.controller'
import { verifyToken, requireSuperAdmin, requirePermission } from '../middleware/auth.middleware'
import { uploadFields, uploadSingle } from '../middleware/upload.middleware'

const router = Router()

// ─── Health ───────────────────────────────────────────────
router.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

// ─── Auth ─────────────────────────────────────────────────
router.post('/auth/login', login)
router.post('/auth/refresh', refresh)
router.post('/auth/logout', logout)
router.post('/auth/change-password', verifyToken, changePassword)

// ─── Me ───────────────────────────────────────────────────
router.get('/me', verifyToken, getMe)

// ─── Projects ─────────────────────────────────────────────
router.get('/projects', getProjects)
router.get('/projects/:slug', getProject)
router.post('/projects', verifyToken, requirePermission('projects'), uploadFields, createProject)
router.put('/projects/:id', verifyToken, requirePermission('projects'), uploadFields, updateProject)
router.patch('/projects/:id/toggle-publish', verifyToken, requirePermission('projects'), togglePublish)
router.delete('/projects/:id', verifyToken, requirePermission('projects'), deleteProject)

// ─── Upload (single file) ─────────────────────────────────
router.post('/upload', verifyToken, uploadSingle, async (req, res) => {
  try {
    const { uploadToCloudinary } = await import('../config/cloudinary')
    const file = (req as typeof req & { file?: Express.Multer.File }).file
    if (!file) { res.status(400).json({ error: 'No file' }); return }
    const isVideo = file.mimetype.startsWith('video/')
    const result = await uploadToCloudinary(file.path, isVideo ? 'videos' : 'uploads', isVideo ? 'video' : 'image')
    const fs = await import('fs')
    fs.unlinkSync(file.path)
    res.json(result)
  } catch (err) { res.status(500).json({ error: String(err) }) }
})

// ─── Contact ──────────────────────────────────────────────
router.post('/contact', submitContact)
router.get('/contact', verifyToken, requirePermission('contacts'), getContacts)
router.put('/contact/:id', verifyToken, requirePermission('contacts'), updateContactStatus)

// ─── Testimonials ─────────────────────────────────────────
router.get('/testimonials', getTestimonials)
router.post('/testimonials', verifyToken, requirePermission('testimonials'), createTestimonial)
router.put('/testimonials/:id', verifyToken, requirePermission('testimonials'), updateTestimonial)
router.delete('/testimonials/:id', verifyToken, requirePermission('testimonials'), deleteTestimonial)

// ─── Services ─────────────────────────────────────────────
router.get('/services', getServices)
router.post('/services', verifyToken, requirePermission('services'), createService)
router.put('/services/:id', verifyToken, requirePermission('services'), updateService)
router.delete('/services/:id', verifyToken, requirePermission('services'), deleteService)

// ─── Admins (superadmin only) ─────────────────────────────
router.get('/admins', verifyToken, requireSuperAdmin, getAdmins)
router.post('/admins', verifyToken, requireSuperAdmin, createAdmin)
router.put('/admins/:id', verifyToken, requireSuperAdmin, updateAdmin)
router.delete('/admins/:id', verifyToken, requireSuperAdmin, deleteAdmin)

// ─── Settings ─────────────────────────────────────────────
router.get('/settings', getSettings)
router.put('/settings', verifyToken, requireSuperAdmin, updateSettings)

export default router
