import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PaperResponse, LearningItem } from '@/services/types';
import { 
  usePaperSubscription, 
  useLearningItemsSubscription, 
  useProgressSubscription 
} from './useSupabaseSubscription';

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
  completedItems: string[];
  summaryCompleted: boolean;
  relatedPapersCompleted: boolean;
  isPaperCompleted: boolean;
  isLoadingProgress: boolean;
}

export const usePaperDetails = (paperId: string): UsePaperDetailsReturn => {
  const { toast } = useToast();
  
  // Use the Supabase subscription hooks
  const { paper, isLoading, error: paperError } = usePaperSubscription(paperId);
  const {
    learningItems,
    videoItems,
    quizItems,
    flashcardItems,
    keyConceptsItems,
    methodologyItems,
    resultsItems,
    isLoading: isLoadingLearningItems,
    error: learningItemsError
  } = useLearningItemsSubscription(paperId);

  // Add progress subscription
  const {
    completedItems,
    summaryCompleted,
    relatedPapersCompleted,
    isPaperCompleted,
    isLoading: isLoadingProgress,
    error: progressError
  } = useProgressSubscription(paperId);

  // Handle errors
  useEffect(() => {
    if (paperError) {
      toast({
        title: 'Error',
        description: 'Failed to load paper details. Please try again.',
        variant: 'destructive',
      });
    }

    if (learningItemsError) {
      toast({
        title: 'Error',
        description: 'Failed to load learning materials. Please try again.',
        variant: 'destructive',
      });
    }

    if (progressError) {
      toast({
        title: 'Error',
        description: 'Failed to load progress data. Please try again.',
        variant: 'destructive',
      });
    }
  }, [paperError, learningItemsError, progressError, toast]);

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
    isLoadingLearningItems,
    completedItems,
    summaryCompleted,
    relatedPapersCompleted,
    isPaperCompleted,
    isLoadingProgress
  };
}; 