import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const paddingMap = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }

export function GlassCard({ children, className = '', padding = 'md' }: GlassCardProps) {
  return (
    <div
      className={`
        bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl
        ${paddingMap[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
