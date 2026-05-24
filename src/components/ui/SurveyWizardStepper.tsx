import { Check } from 'lucide-react'

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
              {/* Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all duration-300 ${
                  isDone
                    ? 'bg-primary border-primary text-white'
                    : isActive
                    ? 'bg-primary/20 border-primary text-primary-400'
                    : 'bg-white/5 border-white/20 text-gray-600'
                }`}
              >
                {isDone ? <Check size={14} /> : <span className="text-xs font-bold">{index + 1}</span>}
              </div>
              {/* Label */}
              <div className="text-center mt-2 px-1">
                <p className={`text-[11px] font-medium leading-tight ${isActive ? 'text-primary-400' : isDone ? 'text-gray-300' : 'text-gray-600'}`}>
                  {step.label}
                </p>
              </div>
            </div>
            {/* Connector */}
            {!isLast && (
              <div className={`flex-1 h-0.5 mt-4 mx-1 transition-colors duration-300 ${isDone ? 'bg-primary' : 'bg-white/10'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
