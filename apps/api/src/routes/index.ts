import { Router } from 'express'
import { login, refresh, logout, createAdmin } from '../controllers/auth.controller'
import { getProjects, getProject, createProject, updateProject, deleteProject } from '../controllers/project.controller'
import { submitContact, getContacts, updateContactStatus } from '../controllers/contact.controller'
import {
  getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  getServices, createService, updateService, deleteService,
} from '../controllers/testimonial.controller'
import { verifyToken } from '../middleware/auth.middleware'

const router = Router()

// ─── Health ───────────────────────────────────────────────
router.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

// ─── Auth ─────────────────────────────────────────────────
router.post('/auth/login', login)
router.post('/auth/refresh', refresh)
router.post('/auth/logout', logout)
router.post('/auth/create-admin', createAdmin)

// ─── Projects (public read, admin write) ──────────────────
router.get('/projects', getProjects)
router.get('/projects/:slug', getProject)
router.post('/projects', verifyToken, createProject)
router.put('/projects/:id', verifyToken, updateProject)
router.delete('/projects/:id', verifyToken, deleteProject)

// ─── Contact ──────────────────────────────────────────────
router.post('/contact', submitContact)
router.get('/contact', verifyToken, getContacts)
router.put('/contact/:id', verifyToken, updateContactStatus)

// ─── Testimonials ─────────────────────────────────────────
router.get('/testimonials', getTestimonials)
router.post('/testimonials', verifyToken, createTestimonial)
router.put('/testimonials/:id', verifyToken, updateTestimonial)
router.delete('/testimonials/:id', verifyToken, deleteTestimonial)

// ─── Services ─────────────────────────────────────────────
router.get('/services', getServices)
router.post('/services', verifyToken, createService)
router.put('/services/:id', verifyToken, updateService)
router.delete('/services/:id', verifyToken, deleteService)

export default router
