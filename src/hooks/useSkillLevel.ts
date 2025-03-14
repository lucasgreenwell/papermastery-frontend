import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseSkillLevelReturn {
  skillLevel: number;
  handleStepComplete: (stepIndex: number) => void;
}

export const useSkillLevel = (initialLevel: number = 0): UseSkillLevelReturn => {
  const [skillLevel, setSkillLevel] = useState(initialLevel);
  const { toast } = useToast();
  
  const handleStepComplete = (stepIndex: number) => {
    const newLevel = Math.min(skillLevel + 10, 100);
    
    if (newLevel > skillLevel) {
      setSkillLevel(newLevel);
      
      toast({
        title: "Skill level increased!",
        description: "You've made progress in understanding this paper."
      });
    }
  };
  
  return {
    skillLevel,
    handleStepComplete
  };
}; 