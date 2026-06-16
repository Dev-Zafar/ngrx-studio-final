import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { Project, Testimonial, Service, User, SiteSettings } from './models'

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI not set')
  await mongoose.connect(uri)
  console.log('✅ Connected to MongoDB')

  // ── Superadmin ────────────────────────────────────────────
  const existing = await User.findOne({ email: 'zafarjahangeer512@gmail.com' })
  if (!existing) {
    const passwordHash = await bcrypt.hash('NGRXStudio@2024!', 12)
    await User.create({
      email: 'zafarjahangeer512@gmail.com',
      passwordHash,
      name: 'Muhammad Zafar Jahangir',
      role: 'superadmin',
      permissions: ['projects', 'testimonials', 'contacts', 'services', 'admins', 'settings'],
    })
    console.log('✅ Superadmin created: zafarjahangeer512@gmail.com / NGRXStudio@2024!')
  } else {
    console.log('ℹ️  Superadmin already exists')
  }

  // ── Site Settings ─────────────────────────────────────────
  const settingsCount = await SiteSettings.countDocuments()
  if (settingsCount === 0) {
    await SiteSettings.create({
      email: 'zafarjahangeer512@gmail.com',
      whatsapp: '+923428283671',
    })
    console.log('✅ Site settings created')
  }

  // ── Services ─────────────────────────────────────────────
  const servicesCount = await Service.countDocuments()
  if (servicesCount === 0) {
    await Service.insertMany([
      { title: 'Video Editing', slug: 'video-editing', icon: '🎬', shortDescription: 'Cinematic cuts for YouTube, Reels, Shorts, and brand films.', deliverables: ['Long-form editing','Short-form editing','Color grading','Sound design'], order: 1, published: true },
      { title: 'Motion Graphics', slug: 'motion-graphics', icon: '✨', shortDescription: 'Animated title cards, transitions, and motion content.', deliverables: ['Intro/Outro animations','Lower thirds','Kinetic typography','Logo animation'], order: 2, published: true },
      { title: 'Graphic Design', slug: 'graphic-design', icon: '🎨', shortDescription: 'Thumbnails, social posts, and brand assets designed to stop the scroll.', deliverables: ['YouTube thumbnails','Social media posts','Brand assets','Banners'], order: 3, published: true },
      { title: 'Social Media Management', slug: 'social-media', icon: '📱', shortDescription: 'Full-stack content systems across all major platforms.', deliverables: ['Content calendar','Posting & scheduling','Community management','Analytics reports'], order: 4, published: true },
      { title: 'Content Strategy', slug: 'content-strategy', icon: '🚀', shortDescription: 'Data-driven roadmaps and repurposing frameworks.', deliverables: ['Content audit','Growth strategy','Repurposing system','SEO scripting'], order: 5, published: true },
    ])
    console.log('✅ Services seeded')
  }

  // ── Projects ─────────────────────────────────────────────
  const projectsCount = await Project.countDocuments()
  if (projectsCount === 0) {
    await Project.insertMany([
      {
        title: 'NovaCast Podcast Brand',
        slug: 'novacast-podcast-brand',
        category: 'branding',
        mediaType: 'image',
        client: 'NovaCast Media',
        clientLocation: 'Dubai, UAE',
        year: 2024,
        thumbnail: { url: '', publicId: '' },
        description: 'Complete brand overhaul for a rising podcast network — from visual identity to video templates and motion graphics system.',
        challenge: 'The client had no consistent visual identity. Every episode looked different and the brand was unrecognisable.',
        results: [{ label: 'Subscriber Growth', value: '+340%' }, { label: 'Watch Time', value: '+180%' }, { label: 'Monthly Reach', value: '2.4M' }],
        deliverables: ['Brand Identity', 'Video Templates', 'Motion Graphics', 'Thumbnail System'],
        tags: ['podcast', 'branding', 'youtube'],
        featured: true, published: true, order: 1,
      },
      {
        title: 'FitPulse YouTube Overhaul',
        slug: 'fitpulse-youtube-overhaul',
        category: 'video',
        mediaType: 'youtube',
        client: 'FitPulse Fitness',
        clientLocation: 'London, UK',
        year: 2024,
        thumbnail: { url: '', publicId: '' },
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        description: 'Full YouTube channel transformation — editing style, thumbnail design, end screens, and scalable content workflow.',
        challenge: 'Videos were unedited, raw footage with no retention strategy. Viewers dropped off in the first 30 seconds.',
        results: [{ label: 'Total Views', value: '2.1M' }, { label: 'Watch Time', value: '+380%' }, { label: 'New Subscribers', value: '+12K' }],
        deliverables: ['Long-form Editing', 'Thumbnail Design', 'Shorts Editing', 'Channel Art'],
        tags: ['fitness', 'youtube', 'editing'],
        featured: true, published: true, order: 2,
      },
      {
        title: 'Luxe Threads Social Presence',
        slug: 'luxe-threads-social',
        category: 'social',
        mediaType: 'reel',
        client: 'Luxe Threads Co.',
        clientLocation: 'New York, USA',
        year: 2023,
        thumbnail: { url: '', publicId: '' },
        reelUrl: 'https://www.instagram.com/reel/placeholder/',
        description: 'Social media management and content creation for a luxury fashion brand — strategy, reels, stories, and community growth.',
        challenge: 'Low engagement despite a decent following. Content felt generic and disconnected from the luxury brand.',
        results: [{ label: 'Engagement Rate', value: '+89%' }, { label: 'Followers/Month', value: '+12K' }, { label: 'Story Views', value: '3x' }],
        deliverables: ['Reels Editing', 'Story Templates', 'Content Calendar', 'Caption Writing'],
        tags: ['fashion', 'instagram', 'reels'],
        featured: false, published: true, order: 3,
      },
      {
        title: 'ByteStack SaaS Launch',
        slug: 'bytestack-saas-launch',
        category: 'branding',
        mediaType: 'video',
        client: 'ByteStack Technologies',
        clientLocation: 'San Francisco, USA',
        year: 2023,
        thumbnail: { url: '', publicId: '' },
        description: 'End-to-end launch content strategy — explainer video, social campaign, and ongoing content system.',
        challenge: 'The product was great but the content made it look like a side project. Needed enterprise-grade visual identity.',
        results: [{ label: 'ARR Generated', value: '$220K' }, { label: 'Demo Views', value: '450K' }, { label: 'Trial Signups', value: '+60%' }],
        deliverables: ['Explainer Video', 'Social Campaign', 'Motion Graphics', 'Ad Creatives'],
        tags: ['saas', 'tech', 'launch'],
        featured: false, published: true, order: 4,
      },
      {
        title: 'ZenFlow Meditation Reels',
        slug: 'zenflow-meditation-reels',
        category: 'video',
        mediaType: 'reel',
        client: 'ZenFlow App',
        clientLocation: 'Remote',
        year: 2024,
        thumbnail: { url: '', publicId: '' },
        description: 'Short-form content series for a meditation app — ambient visuals, sound design integration, and viral hooks.',
        challenge: 'Meditation content is hard to make scroll-stopping. Previous reels got under 1K views each.',
        results: [{ label: 'Total Views', value: '8.7M' }, { label: 'Saves', value: '340K' }, { label: 'App Downloads', value: '+28%' }],
        deliverables: ['Reels Editing', 'Sound Design', 'Caption Strategy', 'Thumbnail Frames'],
        tags: ['wellness', 'reels', 'viral'],
        featured: true, published: true, order: 5,
      },
      {
        title: 'Roast & Ritual Brand Identity',
        slug: 'roast-ritual-brand',
        category: 'graphics',
        mediaType: 'image',
        client: 'Roast & Ritual',
        clientLocation: 'Toronto, Canada',
        year: 2023,
        thumbnail: { url: '', publicId: '' },
        description: 'Premium coffee brand visual identity — logo, packaging, social templates, and photography direction.',
        challenge: 'The brand looked like every other coffee shop. No personality, no memorability, no premium feel.',
        results: [{ label: 'Online Sales', value: '+210%' }, { label: 'Brand Recall', value: '+4x' }, { label: 'Social Growth', value: '+8K' }],
        deliverables: ['Logo Design', 'Brand Guidelines', 'Packaging Design', 'Social Templates'],
        tags: ['coffee', 'branding', 'packaging'],
        featured: false, published: true, order: 6,
      },
      {
        title: 'EduSpark Thumbnail System',
        slug: 'eduspark-thumbnails',
        category: 'graphics',
        mediaType: 'image',
        client: 'EduSpark Academy',
        clientLocation: 'Remote',
        year: 2023,
        thumbnail: { url: '', publicId: '' },
        description: 'Complete thumbnail design system for a 200K-subscriber education channel with A/B testing frameworks.',
        challenge: 'CTR was stuck at 2.1% despite great content. Thumbnails were generic and not competitive in search.',
        results: [{ label: 'CTR Increase', value: '+45%' }, { label: 'Monthly Impressions', value: '1.2M' }, { label: 'Watch Time', value: '+22%' }],
        deliverables: ['Thumbnail Design', 'A/B Testing', 'Channel Art', 'End Screen Design'],
        tags: ['education', 'youtube', 'thumbnails'],
        featured: false, published: true, order: 7,
      },
      {
        title: 'UrbanEdge Motion Campaign',
        slug: 'urbanedge-motion-campaign',
        category: 'social',
        mediaType: 'reel',
        client: 'UrbanEdge Apparel',
        clientLocation: 'Remote',
        year: 2024,
        thumbnail: { url: '', publicId: '' },
        description: 'High-energy motion content campaign — cinematic reels, transitions, and paid ad creatives for a streetwear brand.',
        challenge: 'The brand had amazing products but zero social presence. Starting from scratch with no audience.',
        results: [{ label: 'Total Reach', value: '14M' }, { label: 'Viral Reels', value: '3' }, { label: 'Revenue Lift', value: '+35%' }],
        deliverables: ['Reels Editing', 'Ad Creatives', 'Motion Graphics', 'Content Strategy'],
        tags: ['fashion', 'viral', 'reels', 'ads'],
        featured: false, published: true, order: 8,
      },
    ])
    console.log('✅ 8 dummy projects seeded')
  }

  // ── Testimonials ──────────────────────────────────────────
  const testCount = await Testimonial.countDocuments()
  if (testCount === 0) {
    await Testimonial.insertMany([
      { name: 'James Whitfield', role: 'Founder', company: 'NovaCast Media', quote: 'NGRX Studio completely transformed our brand. The editing quality is top 1%. Subscriber numbers speak for themselves.', rating: 5, published: true, featured: true },
      { name: 'Sarah Chen', role: 'CMO', company: 'ByteStack Technologies', quote: 'Our SaaS launch content outperformed every internal benchmark. The explainer video drove 60% of trial signups in Q1.', rating: 5, published: true, featured: true },
      { name: 'Amir Hassan', role: 'Creator', company: 'FitPulse', quote: '2.1 million views in one month. Zafar understood the fitness audience immediately and delivered editing that kept people watching.', rating: 5, published: true, featured: false },
      { name: 'Emma Clarke', role: 'Creative Director', company: 'Luxe Threads Co.', quote: 'Best ROI we\'ve ever seen from a creative agency. Engagement nearly doubled within 6 weeks. The content feels genuinely premium.', rating: 5, published: true, featured: false },
      { name: 'Ryan Kowalski', role: 'CEO', company: 'ZenFlow', quote: 'They understood our brand voice on day one. The reels feel meditative yet engaging — a very difficult balance to strike.', rating: 5, published: true, featured: true },
      { name: 'Priya Nair', role: 'Head of Content', company: 'EduSpark Academy', quote: 'Click-through rate jumped 45% in the first week. The thumbnail system they built means we produce consistently without constant briefing.', rating: 5, published: true, featured: false },
    ])
    console.log('✅ 6 testimonials seeded')
  }

  console.log('\n🎉 Database seeded successfully!')
  console.log('─────────────────────────────────────')
  console.log('🔐 SUPERADMIN LOGIN:')
  console.log('   Email:    zafarjahangeer512@gmail.com')
  console.log('   Password: NGRXStudio@2024!')
  console.log('   URL:      http://localhost:3000/admin')
  console.log('─────────────────────────────────────')
  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
