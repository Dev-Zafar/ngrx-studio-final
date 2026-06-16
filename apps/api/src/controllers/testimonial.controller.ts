import { Request, Response } from 'express'
import { Testimonial, Service } from '../models'

function slugify(str: string) { return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g,'') }

// ─── Testimonials ──────────────────────────────────────────
export async function getTestimonials(req: Request, res: Response): Promise<void> {
  try {
    const filter: Record<string,unknown> = {}
    if (req.query.published !== undefined) filter.published = req.query.published === 'true'
    if (req.query.featured !== undefined) filter.featured = req.query.featured === 'true'
    res.json(await Testimonial.find(filter).sort({ createdAt: -1 }))
  } catch { res.status(500).json({ error: 'Server error' }) }
}

export async function createTestimonial(req: Request, res: Response): Promise<void> {
  try {
    const item = await Testimonial.create(req.body)
    res.status(201).json(item)
  } catch (err) { res.status(400).json({ error: String(err) }) }
}

export async function updateTestimonial(req: Request, res: Response): Promise<void> {
  try {
    const item = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!item) { res.status(404).json({ error: 'Not found' }); return }
    res.json(item)
  } catch (err) { res.status(400).json({ error: String(err) }) }
}

export async function deleteTestimonial(req: Request, res: Response): Promise<void> {
  try {
    await Testimonial.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch { res.status(500).json({ error: 'Server error' }) }
}

// ─── Services ─────────────────────────────────────────────
export async function getServices(req: Request, res: Response): Promise<void> {
  try {
    const filter: Record<string,unknown> = {}
    // Public endpoint only returns published; admin can pass all=true
    if (req.query.all !== 'true') filter.published = true
    res.json(await Service.find(filter).sort({ order: 1 }))
  } catch { res.status(500).json({ error: 'Server error' }) }
}

export async function createService(req: Request, res: Response): Promise<void> {
  try {
    const data = { ...req.body }
    if (!data.slug) data.slug = slugify(data.title || '')
    const existing = await Service.findOne({ slug: data.slug })
    if (existing) data.slug = `${data.slug}-${Date.now()}`
    const service = await Service.create(data)
    res.status(201).json(service)
  } catch (err) { res.status(400).json({ error: String(err) }) }
}

export async function updateService(req: Request, res: Response): Promise<void> {
  try {
    const data = { ...req.body }
    if (data.title && !data.slug) data.slug = slugify(data.title)
    const service = await Service.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
    if (!service) { res.status(404).json({ error: 'Not found' }); return }
    res.json(service)
  } catch (err) { res.status(400).json({ error: String(err) }) }
}

export async function deleteService(req: Request, res: Response): Promise<void> {
  try {
    await Service.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch { res.status(500).json({ error: 'Server error' }) }
}
