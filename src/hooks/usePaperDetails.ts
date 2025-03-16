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
  keyConceptsItems: LearningItem[];
  methodologyItems: LearningItem[];
  resultsItems: LearningItem[];
  isLoadingLearningItems: boolean;
}

export const usePaperDetails = (paperId: string): UsePaperDetailsReturn => {
  const [paper, setPaper] = useState<PaperResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [videoItems, setVideoItems] = useState<LearningItem[]>([]);
  const [quizItems, setQuizItems] = useState<LearningItem[]>([]);
  const [flashcardItems, setFlashcardItems] = useState<LearningItem[]>([]);
  const [keyConceptsItems, setKeyConceptsItems] = useState<LearningItem[]>([]);
  const [methodologyItems, setMethodologyItems] = useState<LearningItem[]>([]);
  const [resultsItems, setResultsItems] = useState<LearningItem[]>([]);
  const [isLoadingLearningItems, setIsLoadingLearningItems] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPaper = async () => {
      setIsLoading(true);
      
      try {
        const paperData = await papersAPI.getPaper(paperId);
        // Set pdf_url based on source_type
        let pdfUrl = paperData.pdf_url;
        
        if (!pdfUrl) {
          if (paperData.source_type === 'arxiv' && paperData.arxiv_id) {
            pdfUrl = `https://arxiv.org/pdf/${paperData.arxiv_id}`;
          } else if (paperData.source_type === 'pdf') {
            pdfUrl = paperData.source_url;
          }
        }
        
        setPaper({
          ...paperData,
          pdf_url: pdfUrl
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
      const concepts = materials.filter(item => item.type === 'concepts');
      const methodology = materials.filter(item => item.type === 'methodology');
      const results = materials.filter(item => item.type === 'results');

      setVideoItems(videos);
      setQuizItems(quizzes);
      setFlashcardItems(cards);
      setKeyConceptsItems(concepts);
      setMethodologyItems(methodology);
      setResultsItems(results);
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
    keyConceptsItems,
    methodologyItems,
    resultsItems,
    isLoadingLearningItems
  };
}; 