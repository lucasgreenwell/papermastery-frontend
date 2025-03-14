import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import MarkdownRenderer from '@/components/ui-components/MarkdownRenderer';
import { PaperResponse } from '@/services/types';

interface SummaryStepProps {
  paper: PaperResponse | null;
  onComplete: () => void;
}

const SummaryStep: React.FC<SummaryStepProps> = ({ paper, onComplete }) => {
  const [selectedSummaryType, setSelectedSummaryType] = useState<'beginner' | 'intermediate' | 'advanced' | 'abstract'>('intermediate');

  return (
    <LearningStepCard 
      title="Paper Summary" 
      icon={<FileText size={20} />}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedSummaryType === 'beginner' ? 'default' : 'outline'}
            onClick={() => setSelectedSummaryType('beginner')}
            size="sm"
          >
            Beginner
          </Button>
          <Button
            variant={selectedSummaryType === 'intermediate' ? 'default' : 'outline'}
            onClick={() => setSelectedSummaryType('intermediate')}
            size="sm"
          >
            Intermediate
          </Button>
          <Button
            variant={selectedSummaryType === 'advanced' ? 'default' : 'outline'}
            onClick={() => setSelectedSummaryType('advanced')}
            size="sm"
          >
            Advanced
          </Button>
          <Button
            variant={selectedSummaryType === 'abstract' ? 'default' : 'outline'}
            onClick={() => setSelectedSummaryType('abstract')}
            size="sm"
          >
            Abstract
          </Button>
        </div>

        <div className="mb-8">
          {selectedSummaryType === 'abstract' ? (
            <MarkdownRenderer 
              content={`## Abstract\n\n${paper?.abstract || 'Abstract not available'}`} 
              className="text-gray-700"
              maxHeight="300px"
            />
          ) : (
            <MarkdownRenderer 
              content={paper?.summaries?.[selectedSummaryType] || `${selectedSummaryType} summary not available`} 
              className="text-gray-700"
              maxHeight="300px"
            />
          )}
        </div>
      </div>
      <div className="mt-8">
        <Button onClick={onComplete}>
          I've read the summary
        </Button>
      </div>
    </LearningStepCard>
  );
};

export default SummaryStep; 