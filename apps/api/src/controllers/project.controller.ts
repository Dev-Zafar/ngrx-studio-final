import { Request, Response } from 'express'
import { Project } from '../models'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function getProjects(req: Request, res: Response): Promise<void> {
  try {
    const { category, published } = req.query
    const filter: Record<string, unknown> = {}
    if (category) filter.category = category
    if (published !== undefined) filter.published = published === 'true'
    const projects = await Project.find(filter).sort({ order: 1, createdAt: -1 })
    res.json(projects)
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getProject(req: Request, res: Response): Promise<void> {
  try {
    const project = await Project.findOne({ slug: req.params.slug })
    if (!project) { res.status(404).json({ error: 'Not found' }); return }
    res.json(project)
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function createProject(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body
    data.slug = slugify(data.title)
    // ensure unique slug
    const existing = await Project.findOne({ slug: data.slug })
    if (existing) data.slug = `${data.slug}-${Date.now()}`
    const project = await Project.create(data)
    res.status(201).json(project)
  } catch (err) {
    res.status(400).json({ error: String(err) })
  }
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!project) { res.status(404).json({ error: 'Not found' }); return }
    res.json(project)
  } catch (err) {
    res.status(400).json({ error: String(err) })
  }
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  try {
    await Project.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
}
