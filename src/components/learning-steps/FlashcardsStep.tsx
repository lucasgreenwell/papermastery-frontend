import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import Flashcard, { FlashcardData } from '@/components/ui-components/Flashcard';
import { LearningItem } from '@/services/types';
import { learningAPI } from '@/services/learningAPI';
import { toast } from '@/components/ui/use-toast';

interface FlashcardsStepProps {
  flashcardItems: LearningItem[];
  isLoading: boolean;
  onComplete: () => void;
}

const FlashcardsStep: React.FC<FlashcardsStepProps> = ({ 
  flashcardItems, 
  isLoading, 
  onComplete 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startTime = React.useRef(Date.now());

  const handleComplete = async () => {
    if (flashcardItems.length === 0) {
      onComplete();
      return;
    }

    setIsSubmitting(true);
    try {
      // Record progress for each flashcard item
      for (const item of flashcardItems) {
        await learningAPI.recordProgress(item.id, true);
      }
      
      onComplete();
    } catch (error) {
      console.error('Error recording flashcard progress:', error);
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
        title="Flashcards" 
        icon={<Layers size={20} />}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse flex flex-col items-center">
            <Layers size={32} className="text-blue-200 mb-4" />
            <p className="text-gray-400">Loading flashcards...</p>
          </div>
        </div>
      </LearningStepCard>
    );
  }
  
  if (flashcardItems.length === 0) {
    return (
      <LearningStepCard 
        title="Flashcards" 
        icon={<Layers size={20} />}
      >
        <p className="text-gray-700 mb-4">
          No flashcards available for this paper.
        </p>
      </LearningStepCard>
    );
  }
  
  // Extract flashcards from the items
  const extractedCards: FlashcardData[] = [];
  
  flashcardItems.forEach((item, itemIndex) => {
    // For individual flashcard items, the content is the front and metadata.back is the back
    extractedCards.push({
      id: `f${itemIndex + 1}`,
      front: item.content,
      back: item.metadata.back || ''
    });
  });
  
  if (extractedCards.length === 0) {
    return (
      <LearningStepCard 
        title="Flashcards" 
        icon={<Layers size={20} />}
      >
        <p className="text-gray-700 mb-4">
          No flashcards available for this paper.
        </p>
      </LearningStepCard>
    );
  }
  
  return (
    <LearningStepCard 
      title="Flashcards" 
      icon={<Layers size={20} />}
    >
      <p className="text-gray-700 mb-4">
        Solidify your understanding with these key concept flashcards:
      </p>
      <Flashcard
        cards={extractedCards}
        onComplete={handleComplete}
        className="mb-4"
      />
    </LearningStepCard>
  );
};

export default FlashcardsStep; 