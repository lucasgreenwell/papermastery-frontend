import React, { useState } from 'react';
import { 
  Award, 
  Brain, 
  BookOpen, 
  FileText, 
  Lightbulb, 
  GraduationCap,
  TrendingUp 
} from 'lucide-react';
import SkillProgressBar from './SkillProgressBar';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MilestoneProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isCompleted: boolean;
  isActive: boolean;
  skillLevel: number;
  threshold: number;
  isHorizontal?: boolean;
  showOnHover?: boolean;
}

const Milestone = ({ 
  title, 
  description, 
  icon, 
  isCompleted, 
  isActive, 
  skillLevel,
  threshold,
  isHorizontal = false,
  showOnHover = false
}: MilestoneProps) => {
  
  const content = (
    <div className={cn(
      "transition-all duration-300",
      isHorizontal 
        ? "flex items-center justify-center" 
        : "flex items-start gap-3 p-4 rounded-lg",
      isCompleted ? "text-blue-600" : isActive ? "text-gray-700" : "text-gray-400"
    )}>
      <div className={cn(
        "rounded-full flex items-center justify-center checkpoint-icon-mobile-hidden",
        isHorizontal ? "w-10 h-10" : "w-10 h-10 p-2",
        isCompleted ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
      )}>
        {icon}
      </div>
    </div>
  );
  
  // If showOnHover is true, wrap in Tooltip
  return showOnHover ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{content}</div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-[200px]">
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : content;
};

interface SkillLevelSidebarProps {
  skillLevel: number;
  className?: string;
  isHorizontal?: boolean;
}

const SkillLevelSidebar = ({ 
  skillLevel, 
  className,
  isHorizontal = false 
}: SkillLevelSidebarProps) => {
  const levelName = skillLevel < 20 
    ? "Novice" 
    : skillLevel < 40 
    ? "Beginner"
    : skillLevel < 60 
    ? "Competent"
    : skillLevel < 80 
    ? "Proficient"
    : "Expert";

  const milestones = [
    {
      title: "Introduction",
      description: "Understand the paper summary",
      icon: <FileText size={isHorizontal ? 18 : 18} />,
      threshold: 20,
    },
    {
      title: "Basic Concepts",
      description: "Learn the fundamental concepts",
      icon: <BookOpen size={isHorizontal ? 18 : 18} />,
      threshold: 40,
    },
    {
      title: "Deep Understanding",
      description: "Understand the key innovations",
      icon: <Brain size={isHorizontal ? 18 : 18} />,
      threshold: 60,
    },
    {
      title: "Critical Analysis",
      description: "Analyze implications & limitations",
      icon: <Lightbulb size={isHorizontal ? 18 : 18} />,
      threshold: 80,
    },
    {
      title: "Mastery",
      description: "Connect with broader literature",
      icon: <GraduationCap size={isHorizontal ? 18 : 18} />,
      threshold: 100,
    },
  ];

  return (
    <div className={cn(
      "bg-white rounded-xl shadow-md border border-gray-100",
      isHorizontal ? "p-4 w-full" : "p-4",
      className
    )}>
      {isHorizontal ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg inline-flex mr-2">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{skillLevel}%</div>
              <div className="text-xs font-medium text-gray-500">{levelName}</div>
            </div>
          </div>
          
          <div className="flex-1 relative">
            {/* Main progress bar */}
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-1000"
                style={{ width: `${skillLevel}%` }}
              />
            </div>
            
            {/* Milestones positioned along the progress bar */}
            <div className="absolute top-0 left-0 w-full h-full">
              {milestones.map((milestone, index) => (
                <div 
                  key={index} 
                  className="absolute top-0 -translate-y-1/3"
                  style={{ 
                    left: `${milestone.threshold - 3}%`,
                  }}
                >
                  <Milestone
                    title={milestone.title}
                    description={milestone.description}
                    icon={milestone.icon}
                    skillLevel={skillLevel}
                    threshold={milestone.threshold}
                    isCompleted={skillLevel >= milestone.threshold}
                    isActive={skillLevel < milestone.threshold && 
                            (index === 0 || skillLevel >= milestones[index - 1].threshold)}
                    isHorizontal={true}
                    showOnHover={true}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold mb-2">Your Progress</h3>
            
            <div className="p-3 bg-blue-50 rounded-lg inline-flex mb-2">
              <TrendingUp size={24} className="text-blue-600" />
            </div>
            
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {skillLevel}%
            </div>
            
            <div className="text-sm font-medium text-gray-500 mb-3">
              {levelName} Level
            </div>
          </div>
          
          <div className="flex flex-1 mb-4">
            {/* Vertical progress track */}
            <div className="relative flex flex-col justify-between h-full mr-4 py-2">
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-200 -translate-x-1/2"></div>
              
              {milestones.map((milestone, index) => {
                // Calculate if this bubble should be filled
                // Important: For the progress visualization, we need to invert the index
                // since in the UI the first milestone is at the top but we want to fill from bottom to top
                const invertedIndex = milestones.length - 1 - index;
                const invertedThreshold = milestones[invertedIndex].threshold;
                const isFilled = skillLevel >= invertedThreshold;
                
                return (
                  <div 
                    key={index}
                    className={cn(
                      "relative z-10 w-6 h-6 rounded-full border-2 transition-colors",
                      isFilled
                        ? "bg-blue-500 border-blue-600"
                        : "bg-gray-100 border-gray-300"
                    )}
                  />
                );
              })}
              
              {/* Animated fill for progress */}
              <div 
                className="absolute left-1/2 bottom-0 w-1 bg-blue-500 -translate-x-1/2 transition-all duration-1000"
                style={{ 
                  height: `${skillLevel}%`,
                  maxHeight: '100%'
                }}
              />
            </div>
            
            {/* Milestones */}
            <div className="flex-1 space-y-2 relative">
              {milestones.map((milestone, index) => (
                <Milestone
                  key={index}
                  title={milestone.title}
                  description={milestone.description}
                  icon={milestone.icon}
                  skillLevel={skillLevel}
                  threshold={milestone.threshold}
                  isCompleted={skillLevel >= milestone.threshold}
                  isActive={skillLevel < milestone.threshold && 
                          (index === 0 || skillLevel >= milestones[index - 1].threshold)}
                />
              ))}
            </div>
          </div>
          
          <div className="mt-auto pt-4 border-t border-gray-100">
            <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
              <Award size={20} className="text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-700">Keep going!</h4>
                <p className="text-sm text-gray-600">
                  {100 - skillLevel}% more to become an expert
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SkillLevelSidebar;
