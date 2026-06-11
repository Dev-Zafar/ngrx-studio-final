'use client'
import { useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { FadeIn, RevealText } from '@/components/animations/RevealText'

const categories = ['All', 'Video', 'Graphics', 'Social', 'Branding']

const projects = [
  {
    id: 1,
    title: 'NovaCast Podcast Brand',
    category: 'Branding',
    client: 'NovaCast Media, Dubai',
    year: '2024',
    result: '+340% subscriber growth in 60 days',
    metrics: [{ label: 'Subscriber Growth', val: '+340%' }, { label: 'Watch Time', val: '+180%' }, { label: 'Reach', val: '2.4M' }],
    desc: 'Complete brand overhaul for a rising podcast network — from visual identity to video templates and motion graphics system.',
    deliverables: ['Brand Identity', 'Video Templates', 'Motion Graphics', 'Thumbnail System'],
    bg: 'from-violet-900/60 to-purple-950/80',
    accent: '#7C3AED',
    emoji: '🎙️',
    span: 'col-span-1 md:col-span-2',
  },
  {
    id: 2,
    title: 'FitPulse YouTube Overhaul',
    category: 'Video',
    client: 'FitPulse Fitness, UK',
    year: '2024',
    result: '2.1M views in first month',
    metrics: [{ label: 'Total Views', val: '2.1M' }, { label: 'Watch Time', val: '+380%' }, { label: 'Subscribers', val: '+12K' }],
    desc: 'Full YouTube channel transformation — editing style, thumbnail design, end screens, and a scalable content production workflow.',
    deliverables: ['Long-form Editing', 'Thumbnail Design', 'Shorts Editing', 'Channel Art'],
    bg: 'from-cyan-900/60 to-blue-950/80',
    accent: '#06B6D4',
    emoji: '💪',
    span: 'col-span-1',
  },
  {
    id: 3,
    title: 'Luxe Threads Social Presence',
    category: 'Social',
    client: 'Luxe Threads Co., USA',
    year: '2023',
    result: '+89% engagement, +12K followers/mo',
    metrics: [{ label: 'Engagement Rate', val: '+89%' }, { label: 'Followers/Month', val: '+12K' }, { label: 'Story Views', val: '3x' }],
    desc: 'Social media management and content creation for a luxury fashion brand — strategy, reels, stories, and community growth.',
    deliverables: ['Reels Editing', 'Story Templates', 'Content Calendar', 'Caption Writing'],
    bg: 'from-rose-900/60 to-pink-950/80',
    accent: '#F43F5E',
    emoji: '👗',
    span: 'col-span-1',
  },
  {
    id: 4,
    title: 'ByteStack SaaS Launch',
    category: 'Branding',
    client: 'ByteStack Technologies',
    year: '2023',
    result: '$220K ARR from launch content',
    metrics: [{ label: 'ARR Generated', val: '$220K' }, { label: 'Demo Views', val: '450K' }, { label: 'Trial Signups', val: '+60%' }],
    desc: 'End-to-end launch content strategy for a B2B SaaS product — explainer video, social campaign, and ongoing content system.',
    deliverables: ['Explainer Video', 'Social Campaign', 'Motion Graphics', 'Ad Creatives'],
    bg: 'from-blue-900/60 to-indigo-950/80',
    accent: '#6366F1',
    emoji: '💻',
    span: 'col-span-1',
  },
  {
    id: 5,
    title: 'ZenFlow Meditation Reels',
    category: 'Video',
    client: 'ZenFlow App',
    year: '2024',
    result: '8.7M total reel views',
    metrics: [{ label: 'Total Views', val: '8.7M' }, { label: 'Saves', val: '340K' }, { label: 'App Downloads', val: '+28%' }],
    desc: 'Short-form content series for a meditation app — ambient visuals, sound design integration, and viral hooks.',
    deliverables: ['Reels Editing', 'Sound Design', 'Caption Strategy', 'Thumbnail Frames'],
    bg: 'from-teal-900/60 to-emerald-950/80',
    accent: '#10B981',
    emoji: '🧘',
    span: 'col-span-1 md:col-span-2',
  },
  {
    id: 6,
    title: 'Roast & Ritual Brand Identity',
    category: 'Graphics',
    client: 'Roast & Ritual, Canada',
    year: '2023',
    result: '+210% online sales post-rebrand',
    metrics: [{ label: 'Online Sales', val: '+210%' }, { label: 'Brand Recall', val: '+4x' }, { label: 'Social Growth', val: '+8K' }],
    desc: 'Premium coffee brand visual identity — from logo and packaging to social templates and photography direction.',
    deliverables: ['Logo Design', 'Brand Guidelines', 'Packaging Design', 'Social Templates'],
    bg: 'from-amber-900/60 to-orange-950/80',
    accent: '#F59E0B',
    emoji: '☕',
    span: 'col-span-1',
  },
  {
    id: 7,
    title: 'EduSpark Thumbnail System',
    category: 'Graphics',
    client: 'EduSpark Academy',
    year: '2023',
    result: '+45% CTR on YouTube',
    metrics: [{ label: 'CTR Increase', val: '+45%' }, { label: 'Impressions', val: '1.2M/mo' }, { label: 'Watch Time', val: '+22%' }],
    desc: 'Complete thumbnail design system for a 200K-subscriber education channel — A/B testing frameworks and batch production.',
    deliverables: ['Thumbnail Design', 'A/B Testing', 'Channel Art', 'End Screen Design'],
    bg: 'from-purple-900/60 to-violet-950/80',
    accent: '#8B5CF6',
    emoji: '📚',
    span: 'col-span-1',
  },
  {
    id: 8,
    title: 'UrbanEdge Motion Campaign',
    category: 'Social',
    client: 'UrbanEdge Apparel',
    year: '2024',
    result: '3 viral reels, 14M combined reach',
    metrics: [{ label: 'Total Reach', val: '14M' }, { label: 'Viral Reels', val: '3' }, { label: 'Revenue Lift', val: '+35%' }],
    desc: 'High-energy motion content campaign for a streetwear brand — cinematic reels, transitions, and paid ad creatives.',
    deliverables: ['Reels Editing', 'Ad Creatives', 'Motion Graphics', 'Content Strategy'],
    bg: 'from-gray-900/60 to-zinc-950/80',
    accent: '#71717A',
    emoji: '👟',
    span: 'col-span-1',
  },
]

function ProjectModal({ project, onClose }: { project: typeof projects[0]; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-void/90 backdrop-blur-md"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Modal */}
      <motion.div
        className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface"
        layoutId={`card-${project.id}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
      >
        {/* Header */}
        <div className={`relative h-52 rounded-t-2xl bg-gradient-to-br ${project.bg} flex items-center justify-center`}>
          <span className="text-7xl">{project.emoji}</span>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-void/60 border border-border flex items-center justify-center text-text-2 hover:text-text-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="font-mono text-xs text-accent-2 tracking-widest uppercase">{project.category}</span>
              <h3 className="font-sora font-bold text-2xl text-text-1 mt-1">{project.title}</h3>
              <p className="text-text-3 text-sm mt-1">{project.client} · {project.year}</p>
            </div>
            <div className="px-4 py-2 rounded-full border border-accent-1/30 bg-accent-1/5">
              <span className="text-accent-1 text-xs font-mono">{project.result}</span>
            </div>
          </div>

          <p className="text-text-2 leading-relaxed mb-8">{project.desc}</p>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {project.metrics.map((m) => (
              <div key={m.label} className="text-center p-4 rounded-xl border border-border bg-void/50">
                <div className="font-sora font-extrabold text-xl text-gradient">{m.val}</div>
                <div className="font-mono text-xs text-text-3 mt-1 tracking-wider uppercase">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Deliverables */}
          <div>
            <h4 className="font-mono text-xs text-text-3 tracking-widest uppercase mb-3">Deliverables</h4>
            <div className="flex flex-wrap gap-2">
              {project.deliverables.map((d) => (
                <span key={d} className="px-3 py-1.5 rounded-lg border border-border bg-surface/80 text-sm text-text-2 font-space">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function PortfolioSection() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null)

  const filtered = activeCategory === 'All'
    ? projects
    : projects.filter((p) => p.category === activeCategory)

  return (
    <section id="portfolio" className="section-padding bg-surface/20">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <FadeIn>
              <span className="font-mono text-xs text-accent-2 tracking-[0.3em] uppercase">Portfolio</span>
            </FadeIn>
            <RevealText
              as="h2"
              className="font-sora font-extrabold text-text-1 mt-4 leading-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' } as React.CSSProperties}
            >
              Work that delivers results.
            </RevealText>
          </div>

          {/* Category filter */}
          <FadeIn delay={0.2}>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full font-mono text-xs tracking-wider transition-all duration-300 ${
                    activeCategory === cat
                      ? 'bg-accent-1 text-white border border-accent-1'
                      : 'border border-border text-text-2 hover:border-accent-1/40 hover:text-text-1'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </FadeIn>
        </div>

        {/* Grid */}
        <LayoutGroup>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-5" layout>
            <AnimatePresence mode="popLayout">
              {filtered.map((project, i) => (
                <motion.div
                  key={project.id}
                  layoutId={`card-outer-${project.id}`}
                  className={project.span}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <motion.div
                    className={`group relative h-64 rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-br ${project.bg} border border-border hover:border-accent-1/30 transition-all duration-500`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setSelectedProject(project)}
                  >
                    {/* Emoji */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl opacity-30 group-hover:opacity-60 group-hover:scale-110 transition-all duration-500">
                        {project.emoji}
                      </span>
                    </div>

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-void/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

                    {/* Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-400">
                      <span className="font-mono text-xs text-accent-2 tracking-widest uppercase">{project.category}</span>
                      <h3 className="font-sora font-bold text-text-1 text-lg mt-1">{project.title}</h3>
                      <p className="text-text-2 text-xs mt-1">{project.result}</p>
                    </div>

                    {/* View icon */}
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-void/60 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-text-1 text-sm">↗</span>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        )}
      </AnimatePresence>
    </section>
  )
}
