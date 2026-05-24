import { cn } from '../../../lib/utils'

export function GlowingBorder({ children, className, containerClassName }: { children: React.ReactNode; className?: string; containerClassName?: string }) {
  return (
    <div className={cn('relative group', containerClassName)}>
      <div className="absolute -inset-px bg-gradient-to-r from-primary via-accent to-primary rounded-xl opacity-20 group-hover:opacity-60 blur-sm transition duration-500 animate-gradient-x" style={{ backgroundSize: '200% 100%' }} />
      <div className={cn('relative rounded-xl bg-[#0F172A] border border-white/10', className)}>
        {children}
      </div>
    </div>
  )
}
