import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PaperResponse, LearningItem } from '@/services/types';
import { usePaperSubscription, useLearningItemsSubscription } from './useSupabaseSubscription';

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
  }, [paperError, learningItemsError, toast]);

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