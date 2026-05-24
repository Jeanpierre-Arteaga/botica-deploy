import { Check } from 'lucide-react';

interface Step {
  number: number;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
      {steps.map((step, index) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.number} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                  isCompleted
                    ? 'bg-[#F26430] text-white'
                    : isActive
                    ? 'bg-[#F26430] text-white ring-4 ring-[#FFF4EE]'
                    : 'bg-[#E5E7EB] text-[#4A5260]'
                }`}
              >
                {isCompleted ? <Check size={16} /> : step.number}
              </div>
              <span
                className={`text-xs sm:text-sm font-medium hidden sm:block ${
                  isActive ? 'text-[#1A1F2E]' : 'text-[#4A5260]'
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 w-8 sm:w-16 transition-colors ${
                  isCompleted ? 'bg-[#F26430]' : 'bg-[#E5E7EB]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
