'use client'
import { motion } from 'framer-motion'

// ─── Button ────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }: ButtonProps) {
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3.5 text-base' }
  const variants = {
    primary: { background: 'linear-gradient(135deg, var(--color-accent-1), var(--color-accent-3))', color: '#fff', border: 'none' },
    secondary: { background: 'transparent', color: 'var(--color-text-1)', border: '1px solid var(--color-border)' },
    danger: { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' },
    ghost: { background: 'transparent', color: 'var(--color-text-2)', border: '1px solid transparent' },
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl font-space font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]} ${className}`}
      style={variants[variant]}
    >
      {loading && (
        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {children}
    </button>
  )
}

// ─── Input ─────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full px-4 py-3 rounded-xl border font-space text-sm outline-none transition-colors ${className}`}
        style={{ borderColor: error ? 'rgba(239,68,68,0.5)' : 'var(--color-border)', background: 'var(--color-input-bg)', color: 'var(--color-text-1)' }}
        onFocus={e => { e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.8)' : 'var(--color-accent-1)' }}
        onBlur={e => { e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'var(--color-border)' }}
      />
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
      {hint && !error && <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-3)' }}>{hint}</p>}
    </div>
  )
}

// ─── Textarea ──────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, className = '', ...props }: TextareaProps) {
  return (
    <div>
      {label && (
        <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        className={`w-full px-4 py-3 rounded-xl border font-space text-sm outline-none transition-colors resize-none ${className}`}
        style={{ borderColor: error ? 'rgba(239,68,68,0.5)' : 'var(--color-border)', background: 'var(--color-input-bg)', color: 'var(--color-text-1)' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-accent-1)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
      />
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
      {hint && !error && <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-3)' }}>{hint}</p>}
    </div>
  )
}

// ─── Select ────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
  error?: string
}

export function Select({ label, options, error, className = '', ...props }: SelectProps) {
  return (
    <div>
      {label && (
        <label className="block font-mono text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--color-text-3)' }}>
          {label}
        </label>
      )}
      <select
        {...props}
        className={`w-full px-4 py-3 rounded-xl border font-space text-sm outline-none transition-colors appearance-none ${className}`}
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-input-bg)', color: 'var(--color-text-1)' }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} style={{ background: 'var(--color-surface)' }}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  )
}

// ─── Toggle ────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean
  onChange: (val: boolean) => void
  label?: string
  description?: string
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className="relative mt-0.5 w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
        style={{ background: checked ? 'var(--color-accent-1)' : 'var(--color-border)' }}
      >
        <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm"
          style={{ left: checked ? '24px' : '4px' }} />
      </div>
      {(label || description) && (
        <div>
          {label && <p className="font-space text-sm font-medium" style={{ color: 'var(--color-text-1)' }}>{label}</p>}
          {description && <p className="font-space text-xs mt-0.5" style={{ color: 'var(--color-text-3)' }}>{description}</p>}
        </div>
      )}
    </label>
  )
}

// ─── Badge ─────────────────────────────────────────────────
export function Badge({ children, color = 'default' }: { children: React.ReactNode; color?: 'green' | 'purple' | 'cyan' | 'red' | 'default' }) {
  const colors = {
    green: { background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: 'rgba(34,197,94,0.2)' },
    purple: { background: 'rgba(124,58,237,0.1)', color: 'var(--color-accent-1)', border: 'rgba(124,58,237,0.2)' },
    cyan: { background: 'rgba(6,182,212,0.1)', color: 'var(--color-accent-2)', border: 'rgba(6,182,212,0.2)' },
    red: { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.2)' },
    default: { background: 'var(--color-border)', color: 'var(--color-text-3)', border: 'var(--color-border)' },
  }
  const c = colors[color]
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-mono border inline-flex items-center"
      style={{ background: c.background, color: c.color, borderColor: c.border }}>
      {children}
    </span>
  )
}

// ─── Card ──────────────────────────────────────────────────
export function Card({ children, className = '', padding = true }: { children: React.ReactNode; className?: string; padding?: boolean }) {
  return (
    <div className={`rounded-2xl border ${padding ? 'p-6' : ''} ${className}`}
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      {children}
    </div>
  )
}

// ─── Alert ─────────────────────────────────────────────────
export function Alert({ message, type = 'success' }: { message: string; type?: 'success' | 'error' | 'info' }) {
  if (!message) return null
  const styles = {
    success: { borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)', color: '#4ade80' },
    error: { borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171' },
    info: { borderColor: 'rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.08)', color: 'var(--color-accent-2)' },
  }
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border font-space text-sm mb-5"
      style={styles[type]}>
      {message}
    </motion.div>
  )
}

// ─── Empty state ───────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: { icon: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="font-sora font-semibold text-lg mb-2" style={{ color: 'var(--color-text-1)' }}>{title}</h3>
      {description && <p className="font-space text-sm max-w-xs" style={{ color: 'var(--color-text-3)' }}>{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

// ─── Page header ───────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-8 gap-4">
      <div>
        <h1 className="font-sora font-bold text-3xl" style={{ color: 'var(--color-text-1)' }}>{title}</h1>
        {subtitle && <p className="font-space text-sm mt-1" style={{ color: 'var(--color-text-3)' }}>{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ─── Confirm dialog ────────────────────────────────────────
export function ConfirmDialog({ open, title, description, onConfirm, onCancel, loading }: {
  open: boolean; title: string; description?: string
  onConfirm: () => void; onCancel: () => void; loading?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-sm rounded-2xl border p-6"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <h3 className="font-sora font-bold text-lg mb-2" style={{ color: 'var(--color-text-1)' }}>{title}</h3>
        {description && <p className="font-space text-sm mb-6" style={{ color: 'var(--color-text-2)' }}>{description}</p>}
        <div className="flex gap-3">
          <Button variant="danger" loading={loading} onClick={onConfirm} className="flex-1">Delete</Button>
          <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        </div>
      </motion.div>
    </div>
  )
}
