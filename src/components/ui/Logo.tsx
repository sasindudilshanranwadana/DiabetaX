import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

export function Logo({ size = 'md', className, linkTo }: { size?: 'sm' | 'md' | 'lg'; className?: string; linkTo?: string }) {
  const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' }
  const icon = { sm: 14, md: 18, lg: 24 }
  const inner = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('flex items-center gap-2 font-bold', sizes[size], className)}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-primary/40 blur-md rounded-full" />
        <div className="relative bg-gradient-to-br from-primary to-accent rounded-lg p-1.5 text-white">
          <Activity size={icon[size]} strokeWidth={2.5} />
        </div>
      </div>
      <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">DiabetaX</span>
    </motion.div>
  )

  if (linkTo) {
    return <Link to={linkTo} className="inline-flex">{inner}</Link>
  }
  return inner
}
