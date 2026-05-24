import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Card } from './primitives/card'
import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: { value: number; label: string }
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple'
  delay?: number
}

const colorMap = {
  blue: 'text-primary-400 bg-primary/10 border-primary/20',
  green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  red: 'text-red-400 bg-red-500/10 border-red-500/20',
  purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
}

export function StatCard({ label, value, icon, trend, color = 'blue', delay = 0 }: StatCardProps) {
  return (
    <Card
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="p-6 hover:border-white/20 transition-colors group cursor-default"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium mb-2">{label}</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.1 }}
            className="text-3xl font-bold text-white tracking-tight"
          >
            {value}
          </motion.p>
          {trend && (
            <p className={cn('text-xs mt-2 font-medium', trend.value >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-lg border flex items-center justify-center transition-transform group-hover:scale-110', colorMap[color])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
