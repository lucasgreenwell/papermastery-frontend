
import React from 'react';
import { cn } from '@/lib/utils';

interface LearningStepCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const LearningStepCard = ({ 
  title, 
  children, 
  className,
  icon 
}: LearningStepCardProps) => {
  return (
    <div className={cn("learning-journey-card", className)}>
      <div className="flex items-center gap-3 mb-4">
        {icon && <div className="text-blue-600">{icon}</div>}
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
};

export default LearningStepCard;
