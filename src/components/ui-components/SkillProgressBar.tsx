
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SkillProgressBarProps {
  currentSkill: number;
  previousSkill?: number;
  maxSkill?: number;
  className?: string;
  animated?: boolean;
  vertical?: boolean;
  variant?: 'bar' | 'dot';
  dotSize?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
}

const SkillProgressBar = ({
  currentSkill,
  previousSkill = 0,
  maxSkill = 100,
  className,
  animated = true,
  vertical = false,
  variant = 'bar',
  dotSize = 'md',
  color = 'blue'
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

  // Get color classes based on the color prop
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'bg-green-500';
      case 'red':
        return 'bg-red-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'gray':
        return 'bg-gray-400';
      case 'blue':
      default:
        return 'bg-blue-600';
    }
  };

  // Get dot size classes
  const getDotSizeClasses = () => {
    switch (dotSize) {
      case 'sm':
        return 'w-2 h-2';
      case 'lg':
        return 'w-6 h-6';
      case 'md':
      default:
        return 'w-4 h-4';
    }
  };

  // For dot variant
  if (variant === 'dot') {
    return (
      <div className={cn(
        "skill-progress-dot",
        getDotSizeClasses(),
        getColorClasses(),
        "rounded-full",
        className
      )} />
    );
  }

  // For standard bar variant
  return (
    <div className={cn(
      "skill-progress-bar",
      vertical ? "h-full w-2" : "h-2 w-full",
      "bg-gray-200 rounded-full overflow-hidden",
      className
    )}>
      <div 
        className={cn(
          "skill-progress-fill",
          getColorClasses(),
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
