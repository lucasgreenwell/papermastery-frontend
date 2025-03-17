import React, { useState } from 'react';
import { Microscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import { LearningItem } from '@/services/types';
import { learningAPI } from '@/services/learningAPI';
import { toast } from '@/components/ui/use-toast';

interface MethodologyStepProps {
  onComplete: () => void;
  data?: LearningItem;
  isLoading?: boolean;
}

const MethodologyStep: React.FC<MethodologyStepProps> = ({ 
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
        title="Methodology" 
        icon={<Microscope size={20} />}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-gray-500">Loading methodology...</div>
        </div>
      </LearningStepCard>
    );
  }

  return (
    <LearningStepCard 
      title={data?.title || "Methodology"} 
      icon={<Microscope size={20} />}
    >
      {data?.content ? (
        <div className="prose prose-sm max-w-none text-gray-700 mb-6 whitespace-pre-wrap">
          {data.content}
        </div>
      ) : (
        <div className="text-gray-500 mb-6">No methodology information available for this paper.</div>
      )}
      <Button 
        onClick={handleComplete}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Recording progress...' : 'I understand the methodology'}
      </Button>
    </LearningStepCard>
  );
};

export default MethodologyStep; 