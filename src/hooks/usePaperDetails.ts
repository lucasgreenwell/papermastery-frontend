import { useState, useEffect } from 'react';
import { papersAPI } from '@/services/papersAPI';
import { learningAPI } from '@/services/learningAPI';
import { useToast } from '@/hooks/use-toast';
import { PaperResponse, LearningItem } from '@/services/types';

interface UsePaperDetailsReturn {
  paper: PaperResponse | null;
  isLoading: boolean;
  learningItems: LearningItem[];
  videoItems: LearningItem[];
  quizItems: LearningItem[];
  flashcardItems: LearningItem[];
  isLoadingLearningItems: boolean;
}

export const usePaperDetails = (paperId: string): UsePaperDetailsReturn => {
  const [paper, setPaper] = useState<PaperResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [videoItems, setVideoItems] = useState<LearningItem[]>([]);
  const [quizItems, setQuizItems] = useState<LearningItem[]>([]);
  const [flashcardItems, setFlashcardItems] = useState<LearningItem[]>([]);
  const [isLoadingLearningItems, setIsLoadingLearningItems] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPaper = async () => {
      setIsLoading(true);
      
      try {
        const paperData = await papersAPI.getPaper(paperId);
        // Ensure pdfUrl is set for the PDF viewer
        setPaper({
          ...paperData,
          pdf_url: `https://arxiv.org/pdf/${paperData.arxiv_id}`
        });
        
        // Fetch learning items
        await fetchLearningItems(paperId);
      } catch (error) {
        console.error('Error fetching paper:', error);
        toast({
          title: 'Error',
          description: 'Failed to load paper details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (paperId) {
      fetchPaper();
    }
  }, [paperId, toast]);
  
  const fetchLearningItems = async (id: string) => {
    setIsLoadingLearningItems(true);
    
    try {
      // Fetch all learning materials for the paper
      const materials = await learningAPI.getLearningMaterials(id);
      setLearningItems(materials);
      
      // Filter items by type
      const videos = materials.filter(item => item.type === 'video');
      const quizzes = materials.filter(item => item.type === 'quiz');
      const cards = materials.filter(item => item.type === 'flashcard');
      
      setVideoItems(videos);
      setQuizItems(quizzes);
      setFlashcardItems(cards);
      
      console.log(`Retrieved ${materials.length} learning items:
        - ${videos.length} video items
        - ${quizzes.length} quiz items
        - ${cards.length} flashcard items`);
    } catch (error) {
      console.error('Error fetching learning items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load learning materials. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLearningItems(false);
    }
  };

  return {
    paper,
    isLoading,
    learningItems,
    videoItems,
    quizItems,
    flashcardItems,
    isLoadingLearningItems
  };
}; 