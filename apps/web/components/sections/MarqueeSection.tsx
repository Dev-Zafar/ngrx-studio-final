const items = [
  'Video Editing', 'Motion Graphics', 'Brand Identity', 'Content Strategy',
  'YouTube Growth', 'Reels & Shorts', 'Social Media', 'Graphic Design',
]

export function MarqueeSection() {
  const repeated = [...items, ...items, ...items]

  return (
    <div className="border-y border-border py-5 overflow-hidden bg-surface/40">
      {/* Row 1 - left */}
      <div className="flex mb-3">
        <div className="flex animate-marquee whitespace-nowrap">
          {repeated.map((item, i) => (
            <span key={i} className="flex items-center gap-6 mx-6 font-mono text-xs text-text-3 tracking-[0.2em] uppercase">
              {item}
              <span className="w-1 h-1 rounded-full bg-accent-1/50" />
            </span>
          ))}
        </div>
      </div>
      {/* Row 2 - right */}
      <div className="flex">
        <div className="flex animate-marquee-reverse whitespace-nowrap">
          {repeated.map((item, i) => (
            <span key={i} className="flex items-center gap-6 mx-6 font-mono text-xs text-text-3 tracking-[0.2em] uppercase">
              {item}
              <span className="w-1 h-1 rounded-full bg-accent-2/50" />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
