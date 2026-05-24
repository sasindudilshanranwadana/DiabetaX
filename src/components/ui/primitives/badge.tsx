import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/15 text-primary-400 hover:bg-primary/25',
        secondary: 'border-white/10 bg-white/5 text-foreground hover:bg-white/10',
        destructive: 'border-transparent bg-red-500/15 text-red-400 hover:bg-red-500/25',
        success: 'border-transparent bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25',
        warning: 'border-transparent bg-amber-500/15 text-amber-400 hover:bg-amber-500/25',
        info: 'border-transparent bg-purple-500/15 text-purple-400 hover:bg-purple-500/25',
        outline: 'text-foreground border-white/15',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
