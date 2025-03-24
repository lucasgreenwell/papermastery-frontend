import React, { useState } from 'react';
import { LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import { LearningItem } from '@/services/types';
import { learningAPI } from '@/services/learningAPI';
import { toast } from '@/components/ui/use-toast';

interface ResultsStepProps {
  data?: LearningItem;
  isLoading: boolean;
  onComplete: () => void;
  isCompleted?: boolean;
}

const ResultsStep: React.FC<ResultsStepProps> = ({ 
  onComplete, 
  data,
  isLoading = false 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!data?.id) {
      toast({
        title: "Error",
        description: "Item ID is missing. Cannot record progress.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await learningAPI.recordProgress(data.id, true);
      onComplete();
    } catch (error) {
      console.error('Error recording progress:', error);
      toast({
        title: "Error",
        description: "Failed to record progress. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <Button 
        onClick={handleComplete}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Recording progress...' : 'I understand the results'}
      </Button>
    </LearningStepCard>
  );
};

export default ResultsStep; 