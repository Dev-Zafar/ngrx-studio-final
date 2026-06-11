import Link from 'next/link'

const footerLinks = {
  Services: ['Video Editing', 'Motion Graphics', 'Graphic Design', 'Social Media', 'Content Strategy'],
  Company: ['About', 'Work', 'Process', 'Contact'],
  Connect: ['Instagram', 'YouTube', 'LinkedIn', 'Behance'],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-void">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <svg width="110" height="36" viewBox="0 0 110 36" fill="none">
                <text x="0" y="30" fontFamily="'Sora', sans-serif" fontWeight="800" fontSize="32" fill="#F8F8FF" letterSpacing="-1">NGR</text>
                <text x="76" y="30" fontFamily="'Sora', sans-serif" fontWeight="800" fontSize="32" fill="url(#ftXGrad)" letterSpacing="-1">X</text>
                <defs>
                  <linearGradient id="ftXGrad" x1="76" y1="0" x2="110" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7C3AED"/><stop offset="1" stopColor="#A855F7"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="font-mono text-[10px] text-text-3 tracking-[0.3em] uppercase border-l border-border pl-2">Studio</span>
            </div>
            <p className="text-text-2 text-sm leading-relaxed max-w-xs mb-6">
              We craft viral content and build powerful digital brands that move, convert, and dominate.
            </p>
            <p className="font-mono text-xs text-text-3 tracking-widest uppercase">Frame every second.</p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-mono text-xs text-text-3 tracking-[0.2em] uppercase mb-5">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-text-2 text-sm hover:text-text-1 transition-colors duration-200">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-3 text-xs font-mono">
            © {new Date().getFullYear()} NGRX Studio. All rights reserved.
          </p>
          <p className="text-text-3 text-xs font-mono">
            Built by Muhammad Zafar Jahangir
          </p>
        </div>
      </div>
    </footer>
  )
}
