import React from 'react';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LearningStepCard from '@/components/ui-components/LearningStepCard';

interface MasteryStepProps {
  onComplete: () => void;
}

const MasteryStep: React.FC<MasteryStepProps> = ({ onComplete }) => {
  return (
    <LearningStepCard 
      title="Path to Mastery" 
      icon={<GraduationCap size={20} />}
    >
      <p className="text-gray-700 mb-4">
        Congratulations on your progress! To reach mastery level, consider these advanced activities:
      </p>
      <ul className="list-disc list-inside space-y-3 text-gray-700 mb-6">
        <li className="pl-2">
          Implement a simplified version of the Transformer architecture
        </li>
        <li className="pl-2">
          Compare the performance of Transformers with RNNs on a specific task
        </li>
        <li className="pl-2">
          Analyze how subsequent research has improved upon the original Transformer
        </li>
      </ul>
      <Button onClick={onComplete}>
        I'm ready for mastery
      </Button>
    </LearningStepCard>
  );
};

export default MasteryStep; 