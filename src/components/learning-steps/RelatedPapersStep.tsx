import React from 'react';
import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import { PaperResponse, RelatedPaper } from '@/services/types';

interface RelatedPapersStepProps {
  paper: PaperResponse | null;
  onComplete: () => void;
}

const RelatedPapersStep: React.FC<RelatedPapersStepProps> = ({ paper, onComplete }) => {
  return (
    <LearningStepCard 
      title="Related Papers" 
      icon={<Lightbulb size={20} />}
    >
      <p className="text-gray-700 mb-4">
        Understanding how this paper relates to others in the field will deepen your knowledge:
      </p>
      <div className="space-y-4 mb-6">
        {paper?.related_papers && paper.related_papers.map((related: RelatedPaper, index: number) => (
          <div 
            key={`related-paper-${related.id || index}`} 
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h4 className="font-medium text-blue-600">{related.title}</h4>
            <p className="text-sm text-gray-500 mt-1">
              This paper builds upon concepts introduced in the Transformer.
            </p>
          </div>
        ))}
      </div>
      <Button onClick={onComplete}>
        I've explored related papers
      </Button>
    </LearningStepCard>
  );
};

export default RelatedPapersStep; 