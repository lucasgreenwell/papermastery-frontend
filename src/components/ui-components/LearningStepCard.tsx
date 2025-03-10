
import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

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
    <Card className={cn("p-6 bg-white border border-gray-200 shadow-sm", className)}>
      <div className="flex items-center gap-3 mb-4">
        {icon && <div className="text-blue-600">{icon}</div>}
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      </div>
      <div>
        {children}
      </div>
    </Card>
  );
};

export default LearningStepCard;
