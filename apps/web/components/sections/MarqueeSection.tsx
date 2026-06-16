const items = ['Short-Form Editing','Podcast Clipping','Motion Graphics','Brand Identity','Content Strategy','YouTube Growth','Reels & Shorts','TikTok Content','Social Media','Graphic Design']

export function MarqueeSection() {
  const repeated = [...items, ...items, ...items]
  return (
    <div className="border-y py-5 overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      <div className="flex mb-3">
        <div className="flex animate-marquee whitespace-nowrap">
          {repeated.map((item, i) => (
            <span key={i} className="flex items-center gap-6 mx-6 font-mono text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--color-text-3)' }}>
              {item}<span className="w-1 h-1 rounded-full" style={{ background: 'rgba(124,58,237,0.5)' }} />
            </span>
          ))}
        </div>
      </div>
      <div className="flex">
        <div className="flex animate-marquee-reverse whitespace-nowrap">
          {repeated.map((item, i) => (
            <span key={i} className="flex items-center gap-6 mx-6 font-mono text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--color-text-3)' }}>
              {item}<span className="w-1 h-1 rounded-full" style={{ background: 'rgba(6,182,212,0.5)' }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
