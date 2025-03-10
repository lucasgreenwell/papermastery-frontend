
import React from 'react';
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

interface MilestoneProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isCompleted: boolean;
  isActive: boolean;
  skillLevel: number;
  threshold: number;
  isHorizontal?: boolean;
}

const Milestone = ({ 
  title, 
  description, 
  icon, 
  isCompleted, 
  isActive, 
  skillLevel,
  threshold,
  isHorizontal = false 
}: MilestoneProps) => (
  <div className={cn(
    "relative transition-all duration-300",
    isHorizontal 
      ? "flex items-center gap-2 py-2" 
      : "flex items-start gap-3 p-4 rounded-lg",
    isCompleted ? "bg-blue-50" : isActive ? "bg-gray-50" : "opacity-70"
  )}>
    <div className={cn(
      "rounded-full flex items-center justify-center",
      isHorizontal ? "w-8 h-8 min-w-8" : "p-2",
      isCompleted ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
    )}>
      {icon}
    </div>
    
    {isHorizontal ? (
      <div className="flex-1 min-w-0">
        <h4 className={cn(
          "font-medium text-sm truncate",
          isCompleted ? "text-blue-700" : "text-gray-700"
        )}>
          {title}
        </h4>
      </div>
    ) : (
      <div>
        <h4 className={cn(
          "font-medium",
          isCompleted ? "text-blue-700" : "text-gray-700"
        )}>
          {title}
        </h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    )}
  </div>
);

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
      icon: <FileText size={isHorizontal ? 14 : 18} />,
      threshold: 20,
    },
    {
      title: "Basic Concepts",
      description: "Learn the fundamental concepts",
      icon: <BookOpen size={isHorizontal ? 14 : 18} />,
      threshold: 40,
    },
    {
      title: "Deep Understanding",
      description: "Understand the key innovations",
      icon: <Brain size={isHorizontal ? 14 : 18} />,
      threshold: 60,
    },
    {
      title: "Critical Analysis",
      description: "Analyze implications & limitations",
      icon: <Lightbulb size={isHorizontal ? 14 : 18} />,
      threshold: 80,
    },
    {
      title: "Mastery",
      description: "Connect with broader literature",
      icon: <GraduationCap size={isHorizontal ? 14 : 18} />,
      threshold: 100,
    },
  ];

  return (
    <div className={cn(
      "flex flex-col bg-white rounded-xl shadow-md border border-gray-100",
      isHorizontal ? "p-3" : "p-4",
      className
    )}>
      {isHorizontal ? (
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center">
            <div className="p-2 bg-blue-50 rounded-lg inline-flex mb-1">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-600">{skillLevel}%</div>
            <div className="text-xs font-medium text-gray-500">{levelName}</div>
          </div>
          
          <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 pr-1">
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
                isHorizontal={true}
              />
            ))}
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
              
              {milestones.map((milestone, index) => (
                <div 
                  key={index}
                  className={cn(
                    "relative z-10 w-4 h-4 rounded-full border-2 transition-colors",
                    skillLevel >= milestone.threshold
                      ? "bg-blue-500 border-blue-600"
                      : "bg-gray-100 border-gray-300"
                  )}
                />
              ))}
              
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
