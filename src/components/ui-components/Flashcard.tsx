
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FlashcardData {
  id: string;
  front: string;
  back: string;
}

interface FlashcardProps {
  cards: FlashcardData[];
  title?: string;
  className?: string;
  onComplete?: () => void;
}

const Flashcard = ({ cards, title, className, onComplete }: FlashcardProps) => {
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completedCards, setCompletedCards] = useState<string[]>([]);

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handleNextCard = () => {
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
      setFlipped(false);
    } else if (completedCards.length < cards.length) {
      // Mark all cards as completed
      setCompletedCards(cards.map(card => card.id));
      if (onComplete) onComplete();
    }
  };

  const handlePrevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setFlipped(false);
    }
  };

  const markCardCompleted = () => {
    if (!completedCards.includes(cards[currentCard].id)) {
      setCompletedCards([...completedCards, cards[currentCard].id]);
    }
    handleNextCard();
  };

  const totalCards = cards.length;
  const completedCount = completedCards.length;
  const progress = totalCards > 0 ? (completedCount / totalCards) * 100 : 0;

  return (
    <div className={cn("p-4 bg-white rounded-lg border border-gray-200", className)}>
      {title && (
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
      )}
      
      <div className="mb-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Card {currentCard + 1} of {totalCards}
        </span>
        <div className="flex items-center">
          <div className="h-2 w-24 bg-gray-200 rounded-full mr-2">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-sm text-gray-500">{completedCount}/{totalCards}</span>
        </div>
      </div>
      
      <div 
        className={cn(
          "relative cursor-pointer w-full h-60 md:h-80 perspective-1000 transition-transform duration-300 mb-4",
          flipped ? "rotate-y-180" : ""
        )}
        onClick={handleFlip}
      >
        <div 
          className={cn(
            "absolute w-full h-full rounded-lg border border-gray-200 p-4 flex flex-col justify-center items-center backface-hidden transition-all duration-500",
            flipped ? "rotate-y-180 invisible" : "bg-white"
          )}
        >
          <div className="text-center max-w-md">
            <p className="text-lg font-medium">{cards[currentCard].front}</p>
            <p className="mt-4 text-gray-500 text-sm">Click to reveal answer</p>
          </div>
        </div>
        
        <div 
          className={cn(
            "absolute w-full h-full rounded-lg border border-gray-200 p-4 flex flex-col justify-center items-center backface-hidden bg-blue-50 rotate-y-180 transition-all duration-500",
            flipped ? "visible" : "invisible"
          )}
        >
          <div className="text-center max-w-md">
            <p className="text-lg">{cards[currentCard].back}</p>
            <p className="mt-4 text-gray-500 text-sm">Click to see question</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button 
          variant="outline" 
          onClick={handlePrevCard}
          disabled={currentCard === 0}
        >
          <ArrowLeft size={16} className="mr-1" /> Previous
        </Button>
        
        <Button 
          variant={completedCards.includes(cards[currentCard].id) ? "outline" : "default"}
          onClick={markCardCompleted}
        >
          {completedCards.includes(cards[currentCard].id) 
            ? "Next" 
            : currentCard === cards.length - 1 
              ? "Complete Flashcards" 
              : "Mark Completed & Next"}
          <ArrowRight size={16} className="ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default Flashcard;
