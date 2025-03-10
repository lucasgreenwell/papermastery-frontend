
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LearningJourneyProps {
  steps: React.ReactNode[];
  className?: string;
  onCompleteStep?: (index: number) => void;
}

const LearningJourney = ({ steps, className, onCompleteStep }: LearningJourneyProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      if (onCompleteStep) {
        onCompleteStep(currentStep);
      }
    }
  };
  
  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const goToStep = (index: number) => {
    setCurrentStep(index);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex justify-between mb-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={goToPrevStep}
          disabled={currentStep === 0}
        >
          <ChevronLeft size={18} />
        </Button>
        
        <div className="text-sm text-gray-500">
          Step {currentStep + 1} of {steps.length}
        </div>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={goToNextStep}
          disabled={currentStep === steps.length - 1}
        >
          <ChevronRight size={18} />
        </Button>
      </div>
      
      <div className="relative min-h-[500px]">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={cn(
              "transition-all duration-500 ease-in-out w-full",
              index === currentStep ? "block" : "hidden"
            )}
          >
            {step}
          </div>
        ))}
      </div>
      
      <div className="flex justify-center mt-6 space-x-2">
        {steps.map((_, index) => (
          <div 
            key={index}
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-300",
              index === currentStep 
                ? "bg-blue-600 w-6" 
                : index < currentStep 
                ? "bg-blue-300" 
                : "bg-gray-200"
            )}
            onClick={() => goToStep(index)}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </div>
    </div>
  );
};

export default LearningJourney;
