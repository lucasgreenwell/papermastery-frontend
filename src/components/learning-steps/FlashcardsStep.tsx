import React, { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import Flashcard, { FlashcardData } from '@/components/ui-components/Flashcard';
import { LearningItem } from '@/services/types';
import { learningAPI } from '@/services/learningAPI';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface FlashcardsStepProps {
  flashcardItems: LearningItem[];
  isLoading: boolean;
  onComplete: () => void;
  completedItemIds?: string[]; // Add prop for completed items
}

const FlashcardsStep: React.FC<FlashcardsStepProps> = ({ 
  flashcardItems, 
  isLoading, 
  onComplete,
  completedItemIds = [] // Default to empty array
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedCards, setExtractedCards] = useState<FlashcardData[]>([]);
  const [allCardsCompleted, setAllCardsCompleted] = useState(false);
  const startTime = React.useRef(Date.now());

  // Check if all flashcards are already completed
  useEffect(() => {
    const areAllCompleted = flashcardItems.length > 0 && 
      flashcardItems.every(item => completedItemIds.includes(item.id));
    setAllCardsCompleted(areAllCompleted);
  }, [flashcardItems, completedItemIds]);

  // Extract flashcards from the items when they change
  useEffect(() => {
    if (flashcardItems.length === 0) return;
    
    const cards: FlashcardData[] = [];
    
    flashcardItems.forEach((item, itemIndex) => {
      // Check multiple possible structures for flashcards
      
      // Case 1: If there's a cards array in data.cards or metadata.cards
      const itemAny = item as any; // Type assertion to handle dynamic properties
      const cardsArray = itemAny.metadata?.cards || itemAny.data?.cards;
      if (Array.isArray(cardsArray) && cardsArray.length > 0) {
        cardsArray.forEach((card, cardIndex) => {
          if (card.front && card.back) {
            cards.push({
              id: `f${itemIndex}-${cardIndex}`,
              front: card.front,
              back: card.back
            });
          }
        });
      } 
      // Case 2: For individual flashcard items with front/back in content/metadata
      else if (item.content || item.metadata?.back) {
        cards.push({
          id: `f${itemIndex}`,
          front: item.content || '',
          back: item.metadata?.back || ''
        });
      }
      // Case 3: If there's a structured data object
      else if (itemAny.data) {
        if (typeof itemAny.data === 'object') {
          // Try to find cards structure in data
          const data = itemAny.data;
          
          // Direct front/back
          if (data.front && data.back) {
            cards.push({
              id: `f${itemIndex}-direct`,
              front: data.front,
              back: data.back
            });
          }
        }
      }
    });
    
    setExtractedCards(cards);
  }, [flashcardItems]);

  const handleComplete = async () => {
    if (flashcardItems.length === 0) {
      onComplete();
      return;
    }

    // Skip if already completed
    if (allCardsCompleted) {
      onComplete();
      return;
    }

    setIsSubmitting(true);
    try {
      // Record progress for each flashcard item
      for (const item of flashcardItems) {
        await learningAPI.recordProgress(item.id, true);
      }
      
      setAllCardsCompleted(true);
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
  
  if (extractedCards.length === 0) {
    return (
      <LearningStepCard 
        title="Flashcards" 
        icon={<Layers size={20} />}
      >
        <p className="text-gray-700 mb-4">
          No flashcard data could be extracted for this paper.
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
        {allCardsCompleted && " (Completed)"}
      </p>
      <Flashcard
        cards={extractedCards}
        onComplete={handleComplete}
        className="mb-4"
        isCompleted={allCardsCompleted}
      />
    </LearningStepCard>
  );
};

export default FlashcardsStep; 