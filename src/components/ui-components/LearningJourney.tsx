import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, FileText, Video, Brain, Layers, Presentation, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import ChatInterface from '@/components/ui-components/ChatInterface';

interface LearningJourneyProps {
  steps: React.ReactNode[];
  className?: string;
  onCompleteStep?: (index: number) => void;
  paperTitle?: string;
  paperId: string;
  initialChatMode?: boolean;
  onChatModeChange?: (chatMode: boolean) => void;
}

// Define content types for filtering
type ContentType = 'all' | 'reading' | 'video' | 'quiz' | 'flashcard' | 'slides' | 'consulting';

const LearningJourney = ({ 
  steps, 
  className, 
  onCompleteStep, 
  paperTitle, 
  paperId,
  initialChatMode = false,
  onChatModeChange
}: LearningJourneyProps) => {
  // Debug step component types
  useEffect(() => {
    // Removed debug logs
  }, [steps]);

  const [currentStep, setCurrentStep] = useState(0);
  const [activeFilter, setActiveFilter] = useState<ContentType>('all');
  const [chatMode, setChatMode] = useState(initialChatMode);
  const [filteredSteps, setFilteredSteps] = useState(steps);
  const [stepMap, setStepMap] = useState<Record<number, number>>({});
  
  // Create a mapping between filtered steps and original steps
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredSteps(steps);
      // Reset the step map (1:1 mapping)
      const map: Record<number, number> = {};
      steps.forEach((_, index) => {
        map[index] = index;
      });
      setStepMap(map);
    } else {
      // Find steps that match the filter and create a mapping
      const filtered: React.ReactNode[] = [];
      const map: Record<number, number> = {};
      
      // For reading filter, we need to sort the steps in a specific order
      if (activeFilter === 'reading') {
        // First, collect all reading-related steps
        const readingSteps: Array<{step: React.ReactNode, index: number, type: string, order: number}> = [];
        
        steps.forEach((step, index) => {
          // Extract the step element and look for title in children
          const stepElement = step as React.ReactElement;
          let stepTitle = '';
          
          try {
            // Check if this is a React element with props
            if (stepElement && stepElement.props) {
              // Try to find title directly on the element
              if (stepElement.props.title) {
                stepTitle = stepElement.props.title;
              } 
              // If not found, try to look for LearningStepCard in children
              else if (stepElement.props.children) {
                const findLearningStepCard = (children: React.ReactNode): string => {
                  if (!children) return '';
                  
                  // Handle array of children
                  if (Array.isArray(children)) {
                    for (const child of children) {
                      const result = findLearningStepCard(child);
                      if (result) return result;
                    }
                  }
                  // Check if this is a LearningStepCard component
                  else if (
                    React.isValidElement(children) && 
                    children.props && 
                    children.props.title
                  ) {
                    return children.props.title;
                  }
                  
                  return '';
                };
                
                stepTitle = findLearningStepCard(stepElement.props.children);
              }
            }
            
            // Helper function for case-insensitive includes check
            const containsIgnoreCase = (str: string, search: string): boolean => {
              return str.toLowerCase().includes(search.toLowerCase());
            };
            
            // More robust component type detection for production
            const compType = stepElement.type;
            const compString = typeof compType === 'function' ? compType.toString() : '';
            const keyString = stepElement.key ? String(stepElement.key) : '';
            
            // Determine step type and order based on title, key, or component string content
            let stepType = '';
            let order = 999; // Default high order for unknown types
            
            if (
              containsIgnoreCase(stepTitle, 'Paper Summary') || 
              containsIgnoreCase(keyString, 'summary') ||
              containsIgnoreCase(compString, 'Summary')
            ) {
              stepType = 'summary';
              order = 1;
            } else if (
              containsIgnoreCase(stepTitle, 'Key Concepts') || 
              containsIgnoreCase(keyString, 'concepts') ||
              containsIgnoreCase(compString, 'Concepts')
            ) {
              stepType = 'concepts';
              order = 2;
            } else if (
              containsIgnoreCase(stepTitle, 'Methodology') || 
              containsIgnoreCase(keyString, 'method') ||
              containsIgnoreCase(compString, 'Method')
            ) {
              stepType = 'methodology';
              order = 3;
            } else if (
              containsIgnoreCase(stepTitle, 'Results') || 
              containsIgnoreCase(keyString, 'results') ||
              containsIgnoreCase(compString, 'Results')
            ) {
              stepType = 'results';
              order = 4;
            }
            
            // Add to reading steps if it's a reading-related step
            if (['summary', 'concepts', 'methodology', 'results'].includes(stepType)) {
              readingSteps.push({ step, index, type: stepType, order });
            }
          } catch (error) {
            console.error('Error extracting title from step:', error);
          }
        });
        
        // Sort reading steps by order
        readingSteps.sort((a, b) => a.order - b.order);
        
        // Add sorted reading steps to filtered steps
        readingSteps.forEach(item => {
          map[filtered.length] = item.index;
          filtered.push(item.step);
        });
      } else {
        // For other filters, use the existing logic
        steps.forEach((step, index) => {
          // Extract the step element and look for title in children
          const stepElement = step as React.ReactElement;
          let stepTitle = '';
          
          try {
            // Check if this is a React element with props
            if (stepElement && stepElement.props) {
              // Try to find title directly on the element
              if (stepElement.props.title) {
                stepTitle = stepElement.props.title;
              } 
              // If not found, try to look for LearningStepCard in children
              else if (stepElement.props.children) {
                const findLearningStepCard = (children: React.ReactNode): string => {
                  if (!children) return '';
                  
                  // Handle array of children
                  if (Array.isArray(children)) {
                    for (const child of children) {
                      const result = findLearningStepCard(child);
                      if (result) return result;
                    }
                  }
                  // Check if this is a LearningStepCard component
                  else if (
                    React.isValidElement(children) && 
                    children.props && 
                    children.props.title
                  ) {
                    return children.props.title;
                  }
                  
                  return '';
                };
                
                stepTitle = findLearningStepCard(stepElement.props.children);
              }
            }
            
            // Helper function for case-insensitive includes check
            const containsIgnoreCase = (str: string, search: string): boolean => {
              return str.toLowerCase().includes(search.toLowerCase());
            };
            
            // More robust component type detection for production
            const compType = stepElement.type;
            const compString = typeof compType === 'function' ? compType.toString() : '';
            const keyString = stepElement.key ? String(stepElement.key) : '';
            
            // Check component key (most reliable in production builds)
            const isVideoStep = activeFilter === 'video' && (
              containsIgnoreCase(stepTitle, 'Video Explanation') || 
              containsIgnoreCase(keyString, 'video') ||
              containsIgnoreCase(compString, 'Video')
            );
            
            const isQuizStep = activeFilter === 'quiz' && (
              containsIgnoreCase(stepTitle, 'Comprehension Quiz') || 
              containsIgnoreCase(keyString, 'quiz') ||
              containsIgnoreCase(compString, 'Quiz')
            );
            
            // Improved flashcard step detection logic
            const isFlashcardStep = activeFilter === 'flashcard' && (
              containsIgnoreCase(stepTitle, 'Flashcards') || 
              containsIgnoreCase(keyString, 'flashcard') ||
              containsIgnoreCase(compString, 'FlashcardsStep') ||
              (typeof compType === 'function' && compType.name === 'FlashcardsStep')
            );
            
            const isConsultingStep = activeFilter === 'consulting' && (
              containsIgnoreCase(stepTitle, 'Expert Consulting') || 
              containsIgnoreCase(keyString, 'consult') ||
              containsIgnoreCase(compString, 'Consult') 
            );
            
            // Add debugging for flashcard steps
            if (activeFilter === 'flashcard') {
              console.log('Checking if step is a flashcard step:', {
                stepTitle,
                keyString,
                compStringPreview: compString.substring(0, 100),
                compTypeName: typeof compType === 'function' ? compType.name : 'not a function',
                isFlashcardStep,
                matchTitle: containsIgnoreCase(stepTitle, 'Flashcards'),
                matchKey: containsIgnoreCase(keyString, 'flashcard'),
                matchCompString: containsIgnoreCase(compString, 'FlashcardsStep'),
                matchCompName: typeof compType === 'function' && compType.name === 'FlashcardsStep'
              });
            }
            
            if (isVideoStep || isQuizStep || isFlashcardStep || isConsultingStep) {
              map[filtered.length] = index;
              filtered.push(step);
            }
          } catch (error) {
            console.error('Error extracting title from step:', error);
          }
        });
      }
      
      setFilteredSteps(filtered);
      setStepMap(map);
      
      // If we have filtered steps, set current step to first filtered step
      if (filtered.length > 0) {
        setCurrentStep(0);
      }
    }
  }, [activeFilter, steps]);
  
  // Effect to sync chat mode with initialChatMode prop
  useEffect(() => {
    setChatMode(initialChatMode);
  }, [initialChatMode]);
  
  const goToNextStep = () => {
    if (currentStep < filteredSteps.length - 1) {
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
    const newChatMode = !chatMode;
    setChatMode(newChatMode);
    if (onChatModeChange) {
      onChatModeChange(newChatMode);
    }
  };
  
  const handleFilterChange = (value: string) => {
    if (value) {
      console.log(`Filter changed to: ${value}`);
      
      if (value === 'flashcard') {
        console.log('Steps before filtering:', steps.map((step, index) => {
          const stepEl = step as React.ReactElement;
          return {
            index,
            key: stepEl.key,
            type: typeof stepEl.type === 'function' ? stepEl.type.name : typeof stepEl.type
          };
        }));
      }
      
      setActiveFilter(value as ContentType);
    }
  };

  return (
    <div className={cn("relative w-full flex flex-col h-full no-horizontal-overflow", className)}>
      {/* Toolbar with Chat Toggle and Content Filters */}
      <div className="flex flex-wrap justify-between items-center gap-1 mb-4">
        {!chatMode && (
          <ToggleGroup 
            type="single" 
            value={activeFilter}
            onValueChange={handleFilterChange} 
            className="flex-1 justify-start filter-toggles-compact overflow-x-auto"
          >
            <ToggleGroupItem value="all" aria-label="Show all content">
              <FileText size={16} />
              <span className="hidden xs:inline ml-1">All</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="reading" aria-label="Show reading materials">
              <BookOpen size={16} />
              <span className="hidden sm:inline ml-1">Reading</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="video" aria-label="Show videos">
              <Video size={16} />
              <span className="hidden sm:inline ml-1">Video</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="quiz" aria-label="Show quizzes">
              <Brain size={16} />
              <span className="hidden sm:inline ml-1">Quiz</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="flashcard" aria-label="Show flashcards">
              <Layers size={16} />
              <span className="hidden sm:inline ml-1">Cards</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="consulting" aria-label="Show consulting">
              <MessageSquare size={16} />
              <span className="hidden sm:inline ml-1">Consulting</span>
            </ToggleGroupItem>
          </ToggleGroup>
        )}
        
        <Button 
          variant="outline"
          onClick={toggleChatMode}
          className="gap-1 sm:gap-2 ml-auto px-2 sm:px-4"
          size="sm"
        >
          {chatMode ? (
            <>
              <BookOpen size={16} />
              <span className="text-xs sm:text-sm">Learning</span>
            </>
          ) : (
            <>
              <ChatIcon size={16} className="text-blue-600" />
              <span className="text-xs sm:text-sm">Chat</span>
            </>
          )}
        </Button>
      </div>
      
      {/* Content Area - with fixed height and overflow */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {chatMode ? (
          <ChatInterface
            title="Mastery Bot"
            paperTitle={paperTitle}
            paperId={paperId}
            className="h-full flex flex-col"
          />
        ) : (
          <div className="h-full overflow-y-auto">
            {filteredSteps.length > 0 ? (
              filteredSteps.map((step, index) => {
                // Get original step index from step map
                const originalIndex = stepMap[index];
                const stepElement = step as React.ReactElement;
                const keyString = stepElement.key ? String(stepElement.key) : '';
                
                // Log when a step becomes visible
                if (index === currentStep) {
                  console.log('Currently displaying step:', {
                    filteredIndex: index,
                    originalIndex,
                    key: keyString,
                    isVisible: index === currentStep
                  });
                }
                
                return (
                  <div 
                    key={index} 
                    className={cn(
                      "transition-all duration-500 ease-in-out w-full",
                      index === currentStep ? "block" : "hidden"
                    )}
                  >
                    {step}
                  </div>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                No content matches the selected filter
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Navigation Section - Fixed at Bottom */}
      {!chatMode && filteredSteps.length > 0 && (
        <div className="mt-auto pt-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex justify-between w-full mb-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={goToPrevStep}
              disabled={currentStep === 0}
              className="h-8 w-8"
            >
              <ChevronLeft size={16} />
            </Button>
            
            <div className="text-xs sm:text-sm text-gray-500">
              Step {currentStep + 1} of {filteredSteps.length}
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={goToNextStep}
              disabled={currentStep === filteredSteps.length - 1}
              className="h-8 w-8"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
          
          {/* Dots Navigation */}
          <div className={cn(
            "flex justify-center",
            filteredSteps.length > 5 ? "space-x-1 dots-nav-compact" : "space-x-2"
          )}>
            {filteredSteps.map((_, index) => (
              <div 
                key={index}
                className={cn(
                  "h-3 w-3 rounded-full transition-all duration-300",
                  index === currentStep 
                    ? "bg-blue-600 w-8 active" 
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
      )}
    </div>
  );
};

// Import ChatIcon from the correct path
const ChatIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
    <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
  </svg>
);

export default LearningJourney;
