import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Step {
  label: string
  description?: string
}

interface SurveyWizardStepperProps {
  steps: Step[]
  currentStep: number
}

export function SurveyWizardStepper({ steps, currentStep }: SurveyWizardStepperProps) {
  return (
    <div className="flex items-start gap-0 w-full overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const isDone = index < currentStep
        const isActive = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={index} className="flex items-start flex-1 min-w-[80px]">
            <div className="flex flex-col items-center flex-1">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all duration-300',
                  isDone
                    ? 'bg-primary border-primary text-white shadow-[0_0_16px_rgba(59,130,246,0.4)]'
                    : isActive
                    ? 'bg-primary/20 border-primary text-primary-400 shadow-[0_0_16px_rgba(59,130,246,0.25)]'
                    : 'bg-white/5 border-white/10 text-muted-foreground'
                )}
              >
                {isDone ? <Check size={15} strokeWidth={3} /> : <span className="text-xs font-bold">{index + 1}</span>}
              </motion.div>
              <div className="text-center mt-2 px-1">
                <p className={cn(
                  'text-[11px] font-medium leading-tight transition-colors',
                  isActive ? 'text-primary-400' : isDone ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.label}
                </p>
              </div>
            </div>
            {!isLast && (
              <div className="flex-1 h-0.5 mt-4 mx-1 relative overflow-hidden bg-white/10">
                <motion.div
                  initial={false}
                  animate={{ width: isDone ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 bg-primary"
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
