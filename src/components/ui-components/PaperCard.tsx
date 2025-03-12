import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SkillProgressBar from './SkillProgressBar';
import { format } from 'date-fns';

interface Author {
  name: string;
  affiliations: string[];
}

interface PaperCardProps {
  id: string;
  title: string;
  authors: Author[] | string[];
  date?: string;
  publication_date?: string;
  skillLevel?: number;
}

const PaperCard = ({ 
  id, 
  title, 
  authors, 
  date, 
  publication_date, 
  skillLevel = 0 
}: PaperCardProps) => {
  // Format the date
  const formattedDate = date || (publication_date ? 
    format(new Date(publication_date), 'MMM d, yyyy') : 
    'Date unknown');
  
  // Format the authors
  const formattedAuthors = authors.map(author => {
    if (typeof author === 'string') {
      return author;
    }
    return author.name;
  }).join(', ');

  return (
    <Link to={`/papers/${id}`} className="paper-card group">
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
              {formattedAuthors}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formattedDate}
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
