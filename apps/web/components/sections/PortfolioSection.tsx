'use client'
import React from 'react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { FadeIn, RevealText } from '@/components/animations/RevealText'

const categories = ['All', 'Video', 'Graphics', 'Social', 'Branding']

interface Project {
  _id: string
  title: string
  category: string
  mediaType: 'image' | 'video' | 'reel' | 'youtube' | 'vimeo'
  client: string
  clientLocation: string
  year: number
  thumbnail: { url: string }
  videoUrl: string
  embedUrl: string
  reelUrl: string
  description: string
  results: Array<{ label: string; value: string }>
  deliverables: string[]
  tags: string[]
  featured: boolean
}

const emojiMap: Record<string, string> = {
  video: '🎬', graphics: '🎨', social: '📱', branding: '🏷️'
}
const gradientMap: Record<string, string> = {
  video: 'from-cyan-900/60 to-blue-950/80',
  graphics: 'from-amber-900/60 to-orange-950/80',
  social: 'from-rose-900/60 to-pink-950/80',
  branding: 'from-violet-900/60 to-purple-950/80',
}

function MediaPreview({ project }: { project: Project }) {
  if (project.thumbnail?.url) {
    return <img src={project.thumbnail.url} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />
  }
  if (project.mediaType === 'youtube' && project.embedUrl) {
    return <iframe src={project.embedUrl} className="absolute inset-0 w-full h-full" allow="autoplay" title={project.title} />
  }
  if (project.mediaType === 'video' && project.videoUrl) {
    return <video src={project.videoUrl} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline />
  }
  // Fallback gradient
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${gradientMap[project.category] || 'from-gray-900 to-gray-950'} flex items-center justify-center`}>
      <span className="text-6xl opacity-30">{emojiMap[project.category] || '✨'}</span>
    </div>
  )
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-void/90 backdrop-blur-md" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
      >
        {/* Media preview */}
        <div className="relative h-56 rounded-t-2xl overflow-hidden bg-surface">
          <MediaPreview project={project} />
          <button onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-void/70 border border-border/50 flex items-center justify-center text-text-2 hover:text-text-1 backdrop-blur-sm transition-colors z-10">
            ✕
          </button>
          {project.mediaType !== 'image' && (
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-void/70 border border-border/50 backdrop-blur-sm">
              <span className="font-mono text-xs text-accent-2 tracking-wider uppercase">
                {project.mediaType === 'youtube' ? '▶ YouTube' : project.mediaType === 'reel' ? '📱 Reel' : project.mediaType === 'video' ? '🎬 Video' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="p-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <span className="font-mono text-xs text-accent-2 tracking-widest uppercase">{project.category}</span>
              <h3 className="font-sora font-bold text-2xl text-text-1 mt-1">{project.title}</h3>
              <p className="text-text-3 text-sm mt-1">{project.client}{project.clientLocation ? `, ${project.clientLocation}` : ''} · {project.year}</p>
            </div>
          </div>

          <p className="text-text-2 leading-relaxed mb-8">{project.description}</p>

          {project.results?.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {project.results.map((m) => (
                <div key={m.label} className="text-center p-4 rounded-xl border border-border bg-void/50">
                  <div className="font-sora font-extrabold text-xl text-gradient">{m.value}</div>
                  <div className="font-mono text-xs text-text-3 mt-1 tracking-wider uppercase">{m.label}</div>
                </div>
              ))}
            </div>
          )}

          {project.deliverables?.length > 0 && (
            <div>
              <h4 className="font-mono text-xs text-text-3 tracking-widest uppercase mb-3">Deliverables</h4>
              <div className="flex flex-wrap gap-2">
                {project.deliverables.map((d) => (
                  <span key={d} className="px-3 py-1.5 rounded-lg border border-border bg-surface/80 text-sm text-text-2 font-space">{d}</span>
                ))}
              </div>
            </div>
          )}

          {/* External links */}
          {(project.embedUrl || project.reelUrl || project.videoUrl) && (
            <div className="mt-6 pt-6 border-t border-border">
              <a
                href={project.embedUrl || project.reelUrl || project.videoUrl}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-1/10 border border-accent-1/30 text-accent-1 font-space text-sm hover:bg-accent-1/20 transition-colors"
              >
                Watch Full Video ↗
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function PortfolioSection() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
    fetch(`${api}/projects?published=true`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setProjects(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeCategory === 'All'
    ? projects
    : projects.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase())

  return (
    <section id="portfolio" className="section-padding bg-surface/20">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <FadeIn><span className="font-mono text-xs text-accent-2 tracking-[0.3em] uppercase">Portfolio</span></FadeIn>
            <RevealText as="h2" className="font-sora font-extrabold text-text-1 mt-4 leading-tight" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
              Work that delivers results.
            </RevealText>
          </div>
          <FadeIn delay={0.2}>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full font-mono text-xs tracking-wider transition-all duration-300 ${activeCategory === cat ? 'bg-accent-1 text-white border border-accent-1' : 'border border-border text-text-2 hover:border-accent-1/40 hover:text-text-1'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </FadeIn>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`h-64 rounded-2xl bg-surface/60 animate-pulse ${i === 0 ? 'md:col-span-2' : ''}`} />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-text-3 font-space">No projects found in this category yet.</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <LayoutGroup>
            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-5" layout>
              <AnimatePresence mode="popLayout">
                {filtered.map((project, i) => {
                  const isWide = i === 0 || i === 4
                  return (
                    <motion.div key={project._id}
                      className={isWide ? 'md:col-span-2' : ''}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      layout
                    >
                      <motion.div
                        className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer border border-border hover:border-accent-1/30 transition-all duration-500"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setSelectedProject(project)}
                      >
                        <MediaPreview project={project} />
                        <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-void/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                        <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-400">
                          <span className="font-mono text-xs text-accent-2 tracking-widest uppercase">{project.category}</span>
                          <h3 className="font-sora font-bold text-text-1 text-lg mt-1">{project.title}</h3>
                          <p className="text-text-2 text-xs mt-1">{project.client}</p>
                        </div>
                        {project.featured && (
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-accent-1/90 backdrop-blur-sm">
                            <span className="font-mono text-xs text-white tracking-wider">Featured</span>
                          </div>
                        )}
                        {project.mediaType !== 'image' && (
                          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-void/70 border border-border/50 backdrop-blur-sm">
                            <span className="font-mono text-xs text-accent-2">
                              {project.mediaType === 'youtube' ? '▶' : project.mediaType === 'reel' ? '📱' : '🎬'}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        )}
      </div>
      <AnimatePresence>
        {selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
      </AnimatePresence>
    </section>
  )
}
