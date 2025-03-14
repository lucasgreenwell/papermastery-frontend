import React from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LearningStepCard from '@/components/ui-components/LearningStepCard';

interface KeyConceptsStepProps {
  onComplete: () => void;
}

const KeyConceptsStep: React.FC<KeyConceptsStepProps> = ({ onComplete }) => {
  return (
    <LearningStepCard 
      title="Key Concepts" 
      icon={<BookOpen size={20} />}
    >
      <ul className="list-disc list-inside space-y-3 text-gray-700 mb-6">
        <li className="pl-2">
          <span className="font-medium">Self-Attention:</span> Allows the model to attend to different positions of the input sequence to compute representations.
        </li>
        <li className="pl-2">
          <span className="font-medium">Multi-Head Attention:</span> Runs multiple attention mechanisms in parallel to capture different relationships.
        </li>
        <li className="pl-2">
          <span className="font-medium">Positional Encoding:</span> Since the model has no recurrence or convolution, positional encodings are added to capture sequence order.
        </li>
        <li className="pl-2">
          <span className="font-medium">Layer Normalization:</span> Applied after each sub-layer to stabilize the network.
        </li>
      </ul>
      <Button onClick={onComplete}>
        I understand these concepts
      </Button>
    </LearningStepCard>
  );
};

export default KeyConceptsStep; 