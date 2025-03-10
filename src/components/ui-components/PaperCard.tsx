
import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SkillProgressBar from './SkillProgressBar';

export interface PaperCardProps {
  id: string;
  title: string;
  authors: string[];
  date: string;
  skillLevel: number;
}

const PaperCard = ({ id, title, authors, date, skillLevel }: PaperCardProps) => {
  return (
    <Link to={`/papers/${id}`} className="paper-card group border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="p-6 flex-1">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <FileText size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {authors.join(', ')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {date}
            </p>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Understanding
            </span>
            <span className="text-sm font-medium text-gray-700">
              {skillLevel}%
            </span>
          </div>
          <SkillProgressBar 
            currentSkill={skillLevel} 
            maxSkill={100} 
            animated={false}
          />
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-100 flex justify-between items-center">
        <span className="text-sm font-medium text-blue-600">View details</span>
        <ChevronRight 
          size={18} 
          className="text-gray-400 group-hover:text-blue-600 transition-colors group-hover:translate-x-1 duration-300" 
        />
      </div>
    </Link>
  );
};

export default PaperCard;
