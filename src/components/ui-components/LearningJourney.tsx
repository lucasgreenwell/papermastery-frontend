
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

  return (
    <div className={cn("relative", className)}>
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
      
      <div className="relative overflow-hidden">
        <div 
          className="transition-all duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentStep * 100}%)`, display: 'flex' }}
        >
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="w-full flex-shrink-0"
              style={{ display: index === currentStep ? 'block' : 'none' }}
            >
              {step}
            </div>
          ))}
        </div>
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
            onClick={() => setCurrentStep(index)}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </div>
    </div>
  );
};

export default LearningJourney;
