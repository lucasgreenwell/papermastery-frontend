
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
}

const Milestone = ({ title, description, icon, isCompleted, isActive }: MilestoneProps) => (
  <div className={cn(
    "relative flex items-start gap-3 p-4 rounded-lg transition-all duration-300",
    isCompleted ? "bg-blue-50" : isActive ? "bg-gray-50" : "opacity-50"
  )}>
    <div className={cn(
      "p-2 rounded-full",
      isCompleted ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
    )}>
      {icon}
    </div>
    <div>
      <h4 className={cn(
        "font-medium",
        isCompleted ? "text-blue-700" : "text-gray-700"
      )}>
        {title}
      </h4>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </div>
);

interface SkillLevelSidebarProps {
  skillLevel: number;
  className?: string;
}

const SkillLevelSidebar = ({ skillLevel, className }: SkillLevelSidebarProps) => {
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
      icon: <FileText size={18} />,
      threshold: 20,
    },
    {
      title: "Basic Concepts",
      description: "Learn the fundamental concepts",
      icon: <BookOpen size={18} />,
      threshold: 40,
    },
    {
      title: "Deep Understanding",
      description: "Understand the key innovations",
      icon: <Brain size={18} />,
      threshold: 60,
    },
    {
      title: "Critical Analysis",
      description: "Analyze implications & limitations",
      icon: <Lightbulb size={18} />,
      threshold: 80,
    },
    {
      title: "Mastery",
      description: "Connect with broader literature",
      icon: <GraduationCap size={18} />,
      threshold: 100,
    },
  ];

  return (
    <div className={cn("flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100 p-4", className)}>
      <div className="text-center mb-6">
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
        
        <SkillProgressBar 
          currentSkill={skillLevel} 
          maxSkill={100}
          className="h-3 mb-6"
        />
      </div>
      
      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-sm font-medium text-gray-500 mb-4">LEARNING PATH</h4>
        
        <div className="space-y-3">
          {milestones.map((milestone, index) => (
            <Milestone
              key={index}
              title={milestone.title}
              description={milestone.description}
              icon={milestone.icon}
              isCompleted={skillLevel >= milestone.threshold}
              isActive={skillLevel < milestone.threshold && 
                       (index === 0 || skillLevel >= milestones[index - 1].threshold)}
            />
          ))}
        </div>
      </div>
      
      <div className="mt-auto pt-6 border-t border-gray-100">
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
    </div>
  );
};

export default SkillLevelSidebar;
