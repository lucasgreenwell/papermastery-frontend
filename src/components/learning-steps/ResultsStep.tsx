import React from 'react';
import { LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import { LearningItem } from '@/services/types';

interface ResultsStepProps {
  onComplete: () => void;
  data?: LearningItem;
  isLoading?: boolean;
}

const ResultsStep: React.FC<ResultsStepProps> = ({ 
  onComplete, 
  data,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <LearningStepCard 
        title="Results" 
        icon={<LineChart size={20} />}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-gray-500">Loading results...</div>
        </div>
      </LearningStepCard>
    );
  }

  return (
    <LearningStepCard 
      title={data?.title || "Results"} 
      icon={<LineChart size={20} />}
    >
      {data?.content ? (
        <div className="prose prose-sm max-w-none text-gray-700 mb-6 whitespace-pre-wrap">
          {data.content}
        </div>
      ) : (
        <div className="text-gray-500 mb-6">No results information available for this paper.</div>
      )}
      <Button onClick={onComplete}>
        I understand the results
      </Button>
    </LearningStepCard>
  );
};

export default ResultsStep; 