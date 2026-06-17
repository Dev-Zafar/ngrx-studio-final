import { Request, Response } from 'express'
import { Resend } from 'resend'
import { Contact } from '../models'
import { z } from 'zod'

// Ensure your RESEND_API_KEY is set in Render Environment Variables
const resend = new Resend(process.env.RESEND_API_KEY)

const schema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  budget:   z.string().min(1),
  services: z.array(z.string()).min(1),
  brief:    z.string().min(20).max(500),
})

async function sendEmail(data: z.infer<typeof schema>): Promise<void> {
  console.log('--- Email Process Started ---')
  try {
    const { data: resendData, error } = await resend.emails.send({
      from: 'NGRX Studio <onboarding@resend.dev>',
      to: process.env.EMAIL_TO || process.env.EMAIL_USER || 'your-email@gmail.com',
      subject: `🚀 New Brief from ${data.name} — NGRX Studio`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#080810;color:#F8F8FF;padding:32px;border-radius:12px;">
          <h2 style="color:#7C3AED;margin-bottom:24px;">New Project Brief</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#A0A0B8;width:100px;">Name</td><td>${data.name}</td></tr>
            <tr><td style="padding:8px 0;color:#A0A0B8;">Email</td><td>${data.email}</td></tr>
            <tr><td style="padding:8px 0;color:#A0A0B8;">Budget</td><td>${data.budget}</td></tr>
            <tr><td style="padding:8px 0;color:#A0A0B8;">Services</td><td>${data.services.join(', ')}</td></tr>
          </table>
          <div style="margin-top:24px;padding:16px;background:#0F0F1A;border-radius:8px;border-left:3px solid #7C3AED;">
            <p style="color:#A0A0B8;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Brief</p>
            <p style="margin:0;line-height:1.6;">${data.brief}</p>
          </div>
        </div>`,
    })

    if (error) {
      console.error('Resend API Error:', error)
      return
    }
    console.log('Email sent successfully! ID:', resendData?.id)
  } catch (err) {
    console.error('Unexpected email error:', err)
  }
}

export async function submitContact(req: Request, res: Response): Promise<void> {
  try {
    const data = schema.parse(req.body)
    const contact = await Contact.create(data)
    
    console.log('Contact saved to MongoDB, triggering email...')
    sendEmail(data)
    
    res.status(201).json({ message: 'Brief received', id: contact._id })
  } catch (err) {
    console.error('Submission Error:', err)
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return }
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getContacts(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query
    const filter: Record<string,unknown> = {}
    if (status) filter.status = status
    const contacts = await Contact.find(filter).sort({ createdAt: -1 })
    res.json(contacts)
  } catch { res.status(500).json({ error: 'Server error' }) }
}

export async function updateContactStatus(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.body
    const contact = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!contact) { res.status(404).json({ error: 'Not found' }); return }
    res.json(contact)
  } catch { res.status(500).json({ error: 'Server error' }) }
}