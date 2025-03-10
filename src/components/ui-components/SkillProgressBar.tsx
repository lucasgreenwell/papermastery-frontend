
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SkillProgressBarProps {
  currentSkill: number;
  previousSkill?: number;
  maxSkill?: number;
  className?: string;
  animated?: boolean;
  vertical?: boolean;
}

const SkillProgressBar = ({
  currentSkill,
  previousSkill = 0,
  maxSkill = 100,
  className,
  animated = true,
  vertical = false
}: SkillProgressBarProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Calculate the percentage
  const percentage = (currentSkill / maxSkill) * 100;
  const previousPercentage = previousSkill ? (previousSkill / maxSkill) * 100 : 0;
  
  useEffect(() => {
    if (animated && currentSkill > previousSkill) {
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1000); // Match animation duration
      
      return () => clearTimeout(timer);
    }
  }, [currentSkill, previousSkill, animated]);

  return (
    <div className={cn(
      "skill-progress-bar",
      vertical ? "h-full w-2" : "h-2 w-full",
      className
    )}>
      <div 
        className={cn(
          "skill-progress-fill",
          isAnimating && "animate-skill-up"
        )}
        style={vertical ? {
          height: `${percentage}%`,
          width: '100%',
          position: 'absolute',
          bottom: 0,
          '--initial-height': `${previousPercentage}%`,
          '--target-height': `${percentage}%`,
        } as React.CSSProperties : {
          width: `${percentage}%`,
          height: '100%',
          '--initial-width': `${previousPercentage}%`,
          '--target-width': `${percentage}%`,
        } as React.CSSProperties}
      />
    </div>
  );
};

export default SkillProgressBar;
