import React from 'react';
import { Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import GoogleSlidesEmbed from '@/components/ui-components/GoogleSlidesEmbed';

interface SlidesStepProps {
  onComplete: () => void;
}

const SlidesStep: React.FC<SlidesStepProps> = ({ onComplete }) => {
  return (
    <LearningStepCard 
      title="Visual Presentation" 
      icon={<Presentation size={20} />}
    >
      <p className="text-gray-700 mb-4">
        Review these slides summarizing the key findings and implications:
      </p>
      <GoogleSlidesEmbed 
        slideUrl="https://docs.google.com/presentation/d/e/2PACX-1vTiz3WLkAu4a1Qg2rWxLDk0GhE3ds-73zgdK2feYYc-zC7qaSyPHm7d37SlxYZ3IChgnckw-Qe_ku0s/pub?start=false&loop=false&delayms=3000"
        title="Transformer Architecture - Key Points"
        className="mb-4"
      />
      <Button onClick={onComplete}>
        I've reviewed the slides
      </Button>
    </LearningStepCard>
  );
};

export default SlidesStep; 