import { Request, Response } from 'express'
import fs from 'fs'
import { Project } from '../models'
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
function isVideoFile(mimetype: string): boolean { return mimetype.startsWith('video/') }

export async function getProjects(req: Request, res: Response): Promise<void> {
  try {
    const { category, published, featured, limit } = req.query
    const filter: Record<string, unknown> = {}
    if (category) filter.category = category
    if (published !== undefined) filter.published = published === 'true'
    if (featured !== undefined) filter.featured = featured === 'true'
    let query = Project.find(filter).sort({ order: 1, createdAt: -1 })
    if (limit) query = query.limit(Number(limit))
    res.json(await query)
  } catch { res.status(500).json({ error: 'Server error' }) }
}

export async function getProject(req: Request, res: Response): Promise<void> {
  try {
    const project = await Project.findOne({ slug: req.params.slug })
    if (!project) { res.status(404).json({ error: 'Not found' }); return }
    await Project.findByIdAndUpdate(project._id, { $inc: { views: 1 } })
    res.json(project)
  } catch { res.status(500).json({ error: 'Server error' }) }
}

export async function createProject(req: Request, res: Response): Promise<void> {
  try {
    const data = { ...req.body }
    if (typeof data.results === 'string') { try { data.results = JSON.parse(data.results) } catch { data.results = [] } }
    if (typeof data.deliverables === 'string') { try { data.deliverables = JSON.parse(data.deliverables) } catch { data.deliverables = data.deliverables.split(',').map((s: string) => s.trim()).filter(Boolean) } }
    if (typeof data.tags === 'string') { try { data.tags = JSON.parse(data.tags) } catch { data.tags = data.tags.split(',').map((s: string) => s.trim()).filter(Boolean) } }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined
    if (files?.thumbnail?.[0]) {
      const f = files.thumbnail[0]
      const rt = isVideoFile(f.mimetype) ? 'video' : 'image'
      data.thumbnail = await uploadToCloudinary(f.path, 'thumbnails', rt)
      fs.unlinkSync(f.path)
    }
    if (files?.gallery?.length) {
      data.gallery = await Promise.all(files.gallery.map(async (f) => {
        const rt = isVideoFile(f.mimetype) ? 'video' : 'image'
        const up = await uploadToCloudinary(f.path, 'gallery', rt)
        fs.unlinkSync(f.path); return { ...up, type: rt }
      }))
    }

    data.slug = slugify(data.title)
    if (await Project.findOne({ slug: data.slug })) data.slug = `${data.slug}-${Date.now()}`
    res.status(201).json(await Project.create(data))
  } catch (err) { res.status(400).json({ error: String(err) }) }
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    const data = { ...req.body }
    if (typeof data.results === 'string') { try { data.results = JSON.parse(data.results) } catch { data.results = [] } }
    if (typeof data.deliverables === 'string') { try { data.deliverables = JSON.parse(data.deliverables) } catch { data.deliverables = data.deliverables.split(',').map((s: string) => s.trim()).filter(Boolean) } }
    if (typeof data.tags === 'string') { try { data.tags = JSON.parse(data.tags) } catch { data.tags = data.tags.split(',').map((s: string) => s.trim()).filter(Boolean) } }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined
    const existing = await Project.findById(req.params.id)
    if (files?.thumbnail?.[0]) {
      if (existing?.thumbnail?.publicId) await deleteFromCloudinary(existing.thumbnail.publicId).catch(() => {})
      const f = files.thumbnail[0]
      data.thumbnail = await uploadToCloudinary(f.path, 'thumbnails', isVideoFile(f.mimetype) ? 'video' : 'image')
      fs.unlinkSync(f.path)
    }
    const project = await Project.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
    if (!project) { res.status(404).json({ error: 'Not found' }); return }
    res.json(project)
  } catch (err) { res.status(400).json({ error: String(err) }) }
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  try {
    const project = await Project.findById(req.params.id)
    if (project?.thumbnail?.publicId) await deleteFromCloudinary(project.thumbnail.publicId).catch(() => {})
    await Project.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch { res.status(500).json({ error: 'Server error' }) }
}

export async function togglePublish(req: Request, res: Response): Promise<void> {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) { res.status(404).json({ error: 'Not found' }); return }
    project.published = !project.published
    await project.save()
    res.json({ published: project.published })
  } catch { res.status(500).json({ error: 'Server error' }) }
}
