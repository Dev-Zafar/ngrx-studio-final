import { Request, Response } from 'express'
import { Testimonial, Service } from '../models'

// ─── Testimonials ──────────────────────────────────────────
export async function getTestimonials(req: Request, res: Response): Promise<void> {
  try {
    const filter = req.query.published !== undefined ? { published: req.query.published === 'true' } : {}
    const items = await Testimonial.find(filter).sort({ createdAt: -1 })
    res.json(items)
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function createTestimonial(req: Request, res: Response): Promise<void> {
  try {
    const item = await Testimonial.create(req.body)
    res.status(201).json(item)
  } catch (err) {
    res.status(400).json({ error: String(err) })
  }
}

export async function updateTestimonial(req: Request, res: Response): Promise<void> {
  try {
    const item = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!item) { res.status(404).json({ error: 'Not found' }); return }
    res.json(item)
  } catch (err) {
    res.status(400).json({ error: String(err) })
  }
}

export async function deleteTestimonial(req: Request, res: Response): Promise<void> {
  try {
    await Testimonial.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
}

// ─── Services ─────────────────────────────────────────────
export async function getServices(req: Request, res: Response): Promise<void> {
  try {
    const services = await Service.find({ published: true }).sort({ order: 1 })
    res.json(services)
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function createService(req: Request, res: Response): Promise<void> {
  try {
    const service = await Service.create(req.body)
    res.status(201).json(service)
  } catch (err) {
    res.status(400).json({ error: String(err) })
  }
}

export async function updateService(req: Request, res: Response): Promise<void> {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!service) { res.status(404).json({ error: 'Not found' }); return }
    res.json(service)
  } catch (err) {
    res.status(400).json({ error: String(err) })
  }
}

export async function deleteService(req: Request, res: Response): Promise<void> {
  try {
    await Service.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
}
