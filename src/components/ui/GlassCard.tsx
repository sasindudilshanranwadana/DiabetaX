import type { ReactNode } from 'react'
import { Card } from './primitives/card'
import { cn } from '../../lib/utils'

interface GlassCardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const paddingMap = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }

export function GlassCard({ children, className = '', padding = 'md' }: GlassCardProps) {
  return <Card className={cn(paddingMap[padding], className)}>{children}</Card>
}
