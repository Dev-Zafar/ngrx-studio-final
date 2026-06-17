import { 
  Scissors, Mic, MonitorPlay, Sparkles, Paintbrush, 
  Search, Clapperboard, RefreshCw, Rocket, Video
} from 'lucide-react'

// This maps string keys from your DB to actual SVG components
export const IconMap: Record<string, React.ElementType> = {
  'scissors': Scissors,
  'mic': Mic,
  'monitor-play': MonitorPlay,
  'sparkles': Sparkles,
  'paintbrush': Paintbrush,
  'search': Search,
  'clapperboard': Clapperboard,
  'refresh': RefreshCw,
  'rocket': Rocket,
  'video': Video,
}

export function DynamicIcon({ name, className = '', strokeWidth = 1.5 }: { name: string, className?: string, strokeWidth?: number }) {
  const IconComponent = IconMap[name] || Sparkles // Fallback icon
  return <IconComponent className={className} strokeWidth={strokeWidth} />
}