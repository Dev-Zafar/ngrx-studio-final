import { Request, Response } from 'express'
import { SiteSettings } from '../models'

export async function getSettings(_req: Request, res: Response): Promise<void> {
  try {
    let settings = await SiteSettings.findOne()
    if (!settings) settings = await SiteSettings.create({})
    res.json(settings)
  } catch { res.status(500).json({ error: 'Server error' }) }
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    let settings = await SiteSettings.findOne()
    if (!settings) {
      settings = await SiteSettings.create(req.body)
    } else {
      Object.assign(settings, req.body)
      await settings.save()
    }
    res.json(settings)
  } catch (err) { res.status(400).json({ error: String(err) }) }
}
