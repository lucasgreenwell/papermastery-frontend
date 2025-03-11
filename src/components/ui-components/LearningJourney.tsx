
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ChatInterface from '@/components/ui-components/ChatInterface';

interface LearningJourneyProps {
  steps: React.ReactNode[];
  className?: string;
  onCompleteStep?: (index: number) => void;
  paperTitle?: string;
}

const LearningJourney = ({ steps, className, onCompleteStep, paperTitle }: LearningJourneyProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [chatMode, setChatMode] = useState(false);
  
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
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

  const toggleChatMode = () => {
    setChatMode(!chatMode);
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Chat Toolbar */}
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline"
          onClick={toggleChatMode}
          className="gap-2"
        >
          {chatMode ? (
            <>
              <X size={16} />
              Close Chat
            </>
          ) : (
            <>
              <MessageSquare size={16} />
              Ask Questions
            </>
          )}
        </Button>
      </div>
      
      {/* Chat Interface or Content */}
      {chatMode ? (
        <ChatInterface
          title="Paper Discussion"
          paperTitle={paperTitle}
          className="mb-8"
        />
      ) : (
        <div className="relative min-h-[500px] mb-8">
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
      )}
      
      {/* Navigation Section - Now Below Content */}
      <div className="flex flex-col items-center mt-6">
        <div className="flex justify-between w-full mb-6">
          <Button 
            variant="outline" 
            size="icon"
            onClick={goToPrevStep}
            disabled={currentStep === 0 || chatMode}
          >
            <ChevronLeft size={18} />
          </Button>
          
          {!chatMode && (
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={goToNextStep}
            disabled={currentStep === steps.length - 1 || chatMode}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
        
        {/* Dots Navigation */}
        {!chatMode && (
          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={cn(
                  "h-3 w-3 rounded-full transition-all duration-300",
                  index === currentStep 
                    ? "bg-blue-600 w-8" 
                    : index < currentStep 
                    ? "bg-blue-300" 
                    : "bg-gray-200"
                )}
                onClick={() => goToStep(index)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningJourney;
