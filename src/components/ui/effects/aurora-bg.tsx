import { cn } from '../../../lib/utils'

interface AuroraBgProps {
  className?: string
  children?: React.ReactNode
}

export function AuroraBackground({ className, children }: AuroraBgProps) {
  return (
    <div className={cn('relative min-h-screen w-full overflow-hidden bg-[#020617]', className)}>
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            'absolute -inset-[10px] opacity-50',
            'pointer-events-none',
            '[background-image:repeating-linear-gradient(100deg,#3B82F610_10%,#60A5FA10_15%,#8B5CF610_20%,#3B82F610_25%,#60A5FA10_30%)]',
            '[background-size:300%_200%]',
            'animate-aurora blur-[10px]',
            'after:absolute after:inset-0 after:[background-image:repeating-linear-gradient(100deg,#3B82F605_10%,#60A5FA05_15%,#8B5CF605_20%,#3B82F605_25%,#60A5FA05_30%)] after:[background-size:200%] after:mix-blend-difference'
          )}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/30 to-[#020617]" />
      {children}
    </div>
  )
}
