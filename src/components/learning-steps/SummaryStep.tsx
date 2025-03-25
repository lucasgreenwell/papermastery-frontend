import React, { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import MarkdownRenderer from '@/components/ui-components/MarkdownRenderer';
import { PaperResponse } from '@/services/types';
import { learningAPI } from '@/services/learningAPI';
import { toast } from '@/components/ui/use-toast';

interface SummaryStepProps {
  paper: PaperResponse | null;
  onComplete: () => void;
  isCompleted?: boolean;
}

const SummaryStep: React.FC<SummaryStepProps> = ({ paper, onComplete }) => {
  const [selectedSummaryType, setSelectedSummaryType] = useState<'beginner' | 'intermediate' | 'advanced' | 'abstract'>('beginner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewedTabs, setViewedTabs] = useState<Set<string>>(new Set(['beginner']));
  const [allTabsViewed, setAllTabsViewed] = useState(false);

  // Check if all tabs have been viewed
  useEffect(() => {
    const requiredTabs = ['beginner', 'intermediate', 'advanced', 'abstract'];
    const allViewed = requiredTabs.every(tab => viewedTabs.has(tab));
    setAllTabsViewed(allViewed);
  }, [viewedTabs]);

  const handleTabChange = (tabName: 'beginner' | 'intermediate' | 'advanced' | 'abstract') => {
    setSelectedSummaryType(tabName);
    
    // Add this tab to the viewed tabs
    setViewedTabs(prev => {
      const newSet = new Set(prev);
      newSet.add(tabName);
      return newSet;
    });
  };

  const handleComplete = async () => {
    if (!paper?.id) {
      toast({
        title: "Error",
        description: "Paper ID is missing. Cannot record progress.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await learningAPI.recordPaperProgress(paper.id, 'summary');
      onComplete();
    } catch (error) {
      console.error('Error recording summary progress:', error);
      toast({
        title: "Error",
        description: "Failed to record progress. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render summary not available message
  const renderSummaryNotAvailable = (type: string) => (
    <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg border border-gray-100">
      <Loader2 className="h-6 w-6 text-blue-500 animate-spin mb-3" />
      <p className="text-gray-600 font-medium mb-1">{type.charAt(0).toUpperCase() + type.slice(1)} summary is being generated</p>
      <p className="text-xs text-gray-500">This may take a few moments. Please check back later.</p>
    </div>
  );

  return (
    <LearningStepCard 
      title="Paper Summary" 
      icon={<FileText size={20} />}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedSummaryType === 'beginner' ? 'default' : 'outline'}
            onClick={() => handleTabChange('beginner')}
            size="sm"
          >
            Beginner
          </Button>
          <Button
            variant={selectedSummaryType === 'intermediate' ? 'default' : 'outline'}
            onClick={() => handleTabChange('intermediate')}
            size="sm"
          >
            Intermediate
          </Button>
          <Button
            variant={selectedSummaryType === 'advanced' ? 'default' : 'outline'}
            onClick={() => handleTabChange('advanced')}
            size="sm"
          >
            Advanced
          </Button>
          <Button
            variant={selectedSummaryType === 'abstract' ? 'default' : 'outline'}
            onClick={() => handleTabChange('abstract')}
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
            paper?.summaries?.[selectedSummaryType] ? (
              <MarkdownRenderer 
                content={paper.summaries[selectedSummaryType]} 
                className="text-gray-700"
                maxHeight="300px"
              />
            ) : (
              renderSummaryNotAvailable(selectedSummaryType)
            )
          )}
        </div>
      </div>
      <div className="mt-8">
        {allTabsViewed ? (
          <Button 
            onClick={handleComplete}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Recording progress...' : 'I\'ve read the summary'}
          </Button>
        ) : (
          <p className="text-sm text-gray-500">
            Please view all summary types before marking as complete.
          </p>
        )}
      </div>
    </LearningStepCard>
  );
};

export default SummaryStep; 