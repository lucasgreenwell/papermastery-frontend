import React from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LearningStepCard from '@/components/ui-components/LearningStepCard';

interface Concept {
  key_concept: string;
  explainer: string;
}

interface KeyConceptsData {
  title: string;
  content: string;
  metadata: {
    concepts: Concept[];
  };
}

interface KeyConceptsStepProps {
  onComplete: () => void;
  data?: KeyConceptsData;
  isLoading?: boolean;
}

const KeyConceptsStep: React.FC<KeyConceptsStepProps> = ({ 
  onComplete, 
  data,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <LearningStepCard 
        title="Key Concepts" 
        icon={<BookOpen size={20} />}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-gray-500">Loading key concepts...</div>
        </div>
      </LearningStepCard>
    );
  }

  const concepts = data?.metadata?.concepts || [];

  return (
    <LearningStepCard 
      title={data?.title || "Key Concepts"} 
      icon={<BookOpen size={20} />}
    >
      {concepts.length > 0 ? (
        <ul className="list-disc list-inside space-y-3 text-gray-700 mb-6">
          {concepts.map((concept, index) => (
            <li key={index} className="pl-2">
              <span className="font-medium">{concept.key_concept}:</span> {concept.explainer}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-gray-500 mb-6">No key concepts available for this paper.</div>
      )}
      <Button onClick={onComplete}>
        I understand these concepts
      </Button>
    </LearningStepCard>
  );
};

export default KeyConceptsStep; 