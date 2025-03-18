import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseSkillLevelReturn {
  skillLevel: number;
  handleStepComplete: (stepIndex: number) => void;
}

export const useSkillLevel = (initialLevel: number = 0): UseSkillLevelReturn => {
  const [skillLevel, setSkillLevel] = useState(initialLevel);
  const [previousLevel, setPreviousLevel] = useState(initialLevel);
  const { toast } = useToast();
  
  // Update skillLevel when initialLevel changes
  useEffect(() => {
    if (initialLevel !== previousLevel) {
      setSkillLevel(initialLevel);
      setPreviousLevel(initialLevel);
    }
  }, [initialLevel, previousLevel]);
  
  const handleStepComplete = (calculatedLevel: number) => {
    // Only update if the calculated level is higher than current
    if (calculatedLevel > skillLevel) {
      const prevLevel = skillLevel;
      setSkillLevel(calculatedLevel);
      setPreviousLevel(skillLevel);
      
      toast({
        title: "Progress updated!",
        description: "You've made progress in understanding this paper."
      });
    }
  };
  
  return {
    skillLevel,
    handleStepComplete
  };
}; 