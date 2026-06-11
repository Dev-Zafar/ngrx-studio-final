import mongoose, { Schema, Document } from 'mongoose'

// ─── Project ───────────────────────────────────────────────
export interface IProject extends Document {
  title: string
  slug: string
  category: 'video' | 'graphics' | 'social' | 'branding'
  client: string
  clientLocation: string
  year: number
  thumbnail: { url: string; publicId: string }
  description: string
  challenge: string
  results: Array<{ label: string; value: string }>
  deliverables: string[]
  featured: boolean
  published: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: { type: String, enum: ['video', 'graphics', 'social', 'branding'], required: true },
    client: { type: String, required: true },
    clientLocation: { type: String, default: '' },
    year: { type: Number, required: true },
    thumbnail: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
    description: { type: String, required: true },
    challenge: { type: String, default: '' },
    results: [{ label: String, value: String }],
    deliverables: [String],
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// ─── Testimonial ───────────────────────────────────────────
export interface ITestimonial extends Document {
  name: string
  role: string
  company: string
  quote: string
  rating: number
  featured: boolean
  published: boolean
  createdAt: Date
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    company: { type: String, required: true },
    quote: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// ─── Service ───────────────────────────────────────────────
export interface IService extends Document {
  title: string
  slug: string
  shortDescription: string
  fullDescription: string
  deliverables: string[]
  order: number
  published: boolean
}

const ServiceSchema = new Schema<IService>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, default: '' },
    deliverables: [String],
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// ─── Contact ───────────────────────────────────────────────
export interface IContact extends Document {
  name: string
  email: string
  budget: string
  services: string[]
  brief: string
  status: 'new' | 'read' | 'replied' | 'archived'
  createdAt: Date
}

const ContactSchema = new Schema<IContact>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    budget: { type: String, required: true },
    services: [String],
    brief: { type: String, required: true },
    status: { type: String, enum: ['new', 'read', 'replied', 'archived'], default: 'new' },
  },
  { timestamps: true }
)

// ─── User ───────────────────────────────────────────────────
export interface IUser extends Document {
  email: string
  passwordHash: string
  role: 'admin' | 'superadmin'
  refreshTokens: string[]
  lastLogin: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
    refreshTokens: [String],
    lastLogin: Date,
  },
  { timestamps: true }
)

export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema)
export const Testimonial = mongoose.models.Testimonial || mongoose.model<ITestimonial>('Testimonial', TestimonialSchema)
export const Service = mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema)
export const Contact = mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema)
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
