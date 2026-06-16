import mongoose, { Schema, Document } from 'mongoose'

// ─── Project ───────────────────────────────────────────────
export interface IProject extends Document {
  title: string; slug: string
  category: 'video' | 'graphics' | 'social' | 'branding'
  mediaType: 'image' | 'video' | 'reel' | 'youtube' | 'vimeo'
  client: string; clientLocation: string; year: number
  thumbnail: { url: string; publicId: string }
  videoUrl: string; embedUrl: string; reelUrl: string
  gallery: Array<{ url: string; publicId: string; type: 'image'|'video' }>
  description: string; challenge: string
  results: Array<{ label: string; value: string }>
  deliverables: string[]; tags: string[]
  featured: boolean; published: boolean; order: number; views: number
  createdAt: Date; updatedAt: Date
}

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  category: { type: String, enum: ['video','graphics','social','branding'], required: true },
  mediaType: { type: String, enum: ['image','video','reel','youtube','vimeo'], default: 'image' },
  client: { type: String, required: true },
  clientLocation: { type: String, default: '' },
  year: { type: Number, required: true },
  thumbnail: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
  videoUrl: { type: String, default: '' },
  embedUrl: { type: String, default: '' },
  reelUrl: { type: String, default: '' },
  gallery: [{ url: String, publicId: String, type: { type: String, enum: ['image','video'] } }],
  description: { type: String, required: true },
  challenge: { type: String, default: '' },
  results: [{ label: String, value: String }],
  deliverables: [String], tags: [String],
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
}, { timestamps: true })

// ─── Testimonial ───────────────────────────────────────────
export interface ITestimonial extends Document {
  name: string; role: string; company: string; quote: string
  rating: number; avatar: string; featured: boolean; published: boolean; createdAt: Date
}
const TestimonialSchema = new Schema<ITestimonial>({
  name: { type: String, required: true },
  role: { type: String, required: true },
  company: { type: String, required: true },
  quote: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  avatar: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: false },
}, { timestamps: true })

// ─── Service ───────────────────────────────────────────────
export interface IService extends Document {
  title: string; slug: string; icon: string
  shortDescription: string; fullDescription: string
  deliverables: string[]; order: number; published: boolean
}
const ServiceSchema = new Schema<IService>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  icon: { type: String, default: '⚡' },
  shortDescription: { type: String, required: true },
  fullDescription: { type: String, default: '' },
  deliverables: [String],
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true })

// ─── Contact ───────────────────────────────────────────────
export interface IContact extends Document {
  name: string; email: string; budget: string
  services: string[]; brief: string
  status: 'new'|'read'|'replied'|'archived'; createdAt: Date
}
const ContactSchema = new Schema<IContact>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  budget: { type: String, required: true },
  services: [String],
  brief: { type: String, required: true },
  status: { type: String, enum: ['new','read','replied','archived'], default: 'new' },
}, { timestamps: true })

// ─── User ──────────────────────────────────────────────────
export interface IUser extends Document {
  email: string; passwordHash: string; name: string
  role: 'admin'|'superadmin'; permissions: string[]
  refreshTokens: string[]; isActive: boolean
  createdBy: mongoose.Types.ObjectId | null
  lastLogin: Date; createdAt: Date
}
const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, default: 'Admin' },
  role: { type: String, enum: ['admin','superadmin'], default: 'admin' },
  permissions: { type: [String], default: ['projects','testimonials','contacts','services'] },
  refreshTokens: [String],
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  lastLogin: Date,
}, { timestamps: true })

// ─── SiteSettings (single document) ───────────────────────
export interface ISiteSettings extends Document {
  // Contact info
  email: string; whatsapp: string
  // Socials
  instagram: string; youtube: string; linkedin: string; behance: string; tiktok: string; twitter: string
  // Hero content
  heroHeadline: string; heroSubtext: string; heroRotatingWords: string[]
  // Availability
  availabilityText: string; isAvailable: boolean
  // About
  aboutBio: string; yearsExperience: number; basedIn: string
  // SEO
  seoTitle: string; seoDescription: string
  // Branding
  brandName: string; tagline: string
}
const SiteSettingsSchema = new Schema<ISiteSettings>({
  email: { type: String, default: 'zafarjahangeer512@gmail.com' },
  whatsapp: { type: String, default: '+923428283671' },
  instagram: { type: String, default: '' },
  youtube: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  behance: { type: String, default: '' },
  tiktok: { type: String, default: '' },
  twitter: { type: String, default: '' },
  heroHeadline: { type: String, default: 'We Build Brands' },
  heroSubtext: { type: String, default: 'Video editing, motion graphics, and content strategy that turns attention into measurable growth.' },
  heroRotatingWords: { type: [String], default: ['Move People','Drive Growth','Go Viral','Build Empires'] },
  availabilityText: { type: String, default: 'Currently accepting new projects' },
  isAvailable: { type: Boolean, default: true },
  aboutBio: { type: String, default: "I'm Muhammad Zafar Jahangir — a specialist in cutting podcasts, interviews, and long-form content into high-retention Shorts, Reels, and TikToks that dominate feeds across YouTube, Instagram, TikTok, and LinkedIn." },
  yearsExperience: { type: Number, default: 4 },
  basedIn: { type: String, default: 'Pakistan' },
  seoTitle: { type: String, default: 'NGRX Studio — Frame Every Second' },
  seoDescription: { type: String, default: 'Premium video editing studio specializing in Shorts, Reels, and TikTok content.' },
  brandName: { type: String, default: 'NGRX Studio' },
  tagline: { type: String, default: 'Frame every second.' },
}, { timestamps: true })

export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema)
export const Testimonial = mongoose.models.Testimonial || mongoose.model<ITestimonial>('Testimonial', TestimonialSchema)
export const Service = mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema)
export const Contact = mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema)
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
export const SiteSettings = mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema)
