import { useState, useEffect } from 'react';
import { learningAPI } from '@/services/learningAPI';
import { useToast } from '@/hooks/use-toast';

export interface QuizAnswer {
  id: string;
  question_id: string;
  question_text: string;
  choices: string[];
  selected_answer: number;
  correct_answer: number;
  is_correct: boolean;
  timestamp: string;
}

interface UseQuizHistoryReturn {
  answers: QuizAnswer[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useQuizHistory = (paperId?: string): UseQuizHistoryReturn => {
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchAnswers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await learningAPI.getUserAnswers(paperId);
      setAnswers(data);
    } catch (err) {
      console.error('Error fetching quiz answers:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch quiz answers'));
      
      toast({
        title: 'Error',
        description: 'Failed to load your quiz answers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnswers();
  }, [paperId]);

  return {
    answers,
    isLoading,
    error,
    refetch: fetchAnswers
  };
}; 