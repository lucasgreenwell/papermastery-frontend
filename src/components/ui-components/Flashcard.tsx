import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';

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
  isCompleted?: boolean;
}

const Flashcard = ({ cards, title, className, onComplete, isCompleted = false }: FlashcardProps) => {
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [viewedCards, setViewedCards] = useState<string[]>([]);
  const [allCardsViewed, setAllCardsViewed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setCompleted(isCompleted);
  }, [isCompleted]);

  useEffect(() => {
    if (flipped && cards[currentCard] && !viewedCards.includes(cards[currentCard].id)) {
      setViewedCards(prev => [...prev, cards[currentCard].id]);
    }
  }, [flipped, currentCard, cards, viewedCards]);

  useEffect(() => {
    if (viewedCards.length === cards.length && viewedCards.length > 0) {
      setAllCardsViewed(true);
    }
  }, [viewedCards, cards]);

  const handleFlip = () => {
    if (!isTransitioning) {
      setFlipped(!flipped);
    }
  };

  const handleNextCard = () => {
    if (currentCard < cards.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      
      setFlipped(false);
      
      setTimeout(() => {
        setCurrentCard(currentCard + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handlePrevCard = () => {
    if (currentCard > 0 && !isTransitioning) {
      setIsTransitioning(true);
      
      setFlipped(false);
      
      setTimeout(() => {
        setCurrentCard(currentCard - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleComplete = () => {
    if (allCardsViewed) {
      setCompleted(true);
      if (onComplete) onComplete();
    }
  };

  // Function to convert flashcards to TSV format
  const convertToTSV = (cards: FlashcardData[]): string => {
    // Add header row
    let tsv = "Question\tAnswer\n";
    
    // Process each card
    cards.forEach(card => {
      // Escape tabs and newlines in content
      const front = card.front.replace(/\t/g, ' ').replace(/\n/g, ' ');
      const back = card.back.replace(/\t/g, ' ').replace(/\n/g, ' ');
      
      // Add to TSV
      tsv += `${front}\t${back}\n`;
    });
    
    return tsv;
  };

  // Handle download of flashcards as TSV
  const handleDownload = () => {
    if (cards.length === 0 || isDownloading) return;
    
    setIsDownloading(true);
    
    try {
      // Convert cards to TSV format
      const tsvContent = convertToTSV(cards);
      
      // Create blob with the TSV data
      const blob = new Blob([tsvContent], { type: 'text/tab-separated-values' });
      
      // Create a download URL
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = title ? `${title.replace(/\s+/g, '_')}_flashcards.tsv` : 'flashcards.tsv';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success toast
      toast({
        title: "Download Successful",
        description: `${cards.length} flashcards downloaded as TSV file.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error downloading flashcards:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download flashcards. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const totalCards = cards.length;
  const viewedCount = viewedCards.length;
  const progress = totalCards > 0 ? (viewedCount / totalCards) * 100 : 0;

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
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-sm text-gray-500">{viewedCount}/{totalCards} viewed</span>
        </div>
      </div>
      
      <div 
        className={cn(
          "relative cursor-pointer w-full h-60 md:h-80 perspective-1000 transition-transform duration-300 mb-4",
          flipped ? "rotate-y-180" : "",
          isTransitioning ? "pointer-events-none" : ""
        )}
        onClick={handleFlip}
      >
        <div 
          key={`front-${currentCard}`}
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
          key={`back-${currentCard}`}
          className={cn(
            "absolute w-full h-full rounded-lg border border-gray-200 p-4 flex flex-col justify-center items-center backface-hidden bg-blue-50 rotate-y-180 transition-all duration-500",
            flipped ? "visible" : "invisible opacity-0"
          )}
        >
          <div className="text-center max-w-md">
            <p className="text-lg">{cards[currentCard].back}</p>
            <p className="mt-4 text-gray-500 text-sm">Click to see question</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handlePrevCard}
          disabled={currentCard === 0 || isTransitioning}
          className="flex items-center gap-1"
        >
          <ChevronLeft size={16} />
          Previous
        </Button>
        
        <span className="text-sm text-gray-500">
          Card {currentCard + 1} of {totalCards}
          {completed && " (Completed)"}
        </span>
        
        <Button 
          variant="outline"
          size="sm"
          onClick={handleNextCard}
          disabled={currentCard === cards.length - 1 || isTransitioning}
          className="flex items-center gap-1"
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
      
      <div className="flex justify-between items-center">
        <Button 
          onClick={handleComplete}
          disabled={!allCardsViewed || completed}
          className={cn(
            "flex-1 mr-2",
            completed && "bg-green-600 hover:bg-green-700"
          )}
        >
          {completed 
            ? "Completed ✓" 
            : allCardsViewed 
              ? "Mark All Flashcards as Completed" 
              : `View All Flashcards to Complete (${viewedCount}/${totalCards})`}
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading || cards.length === 0}
                className="flex items-center gap-1"
              >
                <Download size={16} className={isDownloading ? "animate-bounce" : ""} />
                Export Anki Format
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download flashcards in Anki-compatible TSV format</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default Flashcard;
