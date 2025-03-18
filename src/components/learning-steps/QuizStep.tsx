import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import MultipleChoiceQuiz, { QuizQuestion } from '@/components/ui-components/MultipleChoiceQuiz';
import { LearningItem } from '@/services/types';
import { learningAPI } from '@/services/learningAPI';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuizHistory } from '@/hooks/useQuizHistory';

interface QuizStepProps {
  quizItems: LearningItem[];
  isLoading: boolean;
  onComplete: () => void;
  completedItemIds?: string[]; // Add prop for completed items
  paperId?: string; // Add paper ID for filtering answers
}

interface DbQuestion {
  id: string;
  text: string;
  choices: string[];
  correct_answer: string;
  item_id: string;
  type: string;
}

const QuizStep: React.FC<QuizStepProps> = ({ 
  quizItems, 
  isLoading, 
  onComplete,
  completedItemIds = [], // Default to empty array
  paperId
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allQuizzesCompleted, setAllQuizzesCompleted] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [dbQuestions, setDbQuestions] = useState<DbQuestion[]>([]);
  const startTime = React.useRef(Date.now());

  // Fetch quiz history for this paper
  const { answers: quizAnswers } = useQuizHistory(paperId);

  // Check if all quizzes are already completed
  useEffect(() => {
    const areAllCompleted = quizItems.length > 0 && 
      quizItems.every(item => completedItemIds.includes(item.id));
    setAllQuizzesCompleted(areAllCompleted);
  }, [quizItems, completedItemIds]);

  // Fetch actual questions from the questions table
  useEffect(() => {
    if (quizItems.length === 0 || isLoading) return;

    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      try {
        // Get all item IDs from quizItems
        const itemIds = quizItems.map(item => item.id);

        // Fetch questions directly from the questions table
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .in('item_id', itemIds);

        if (error) throw error;
        
        if (data && data.length > 0) {
          setDbQuestions(data as DbQuestion[]);
        }
      } catch (err) {
        console.error('Error fetching quiz questions:', err);
        toast({
          title: "Error",
          description: "Failed to load quiz questions. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [quizItems, isLoading]);

  const handleComplete = async (score: number, total: number) => {
    if (quizItems.length === 0) {
      onComplete();
      return;
    }

    // Skip if already completed
    if (allQuizzesCompleted) {
      onComplete();
      return;
    }

    // Only proceed if the user passed the quiz (70% or higher)
    if (score / total < 0.7) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Record progress for each quiz item
      for (const item of quizItems) {
        await learningAPI.recordProgress(item.id, true);
      }
      
      setAllQuizzesCompleted(true);
      onComplete();
    } catch (error) {
      console.error('Error recording quiz progress:', error);
      toast({
        title: "Error",
        description: "Failed to record progress. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || loadingQuestions) {
    return (
      <LearningStepCard 
        title="Comprehension Quiz" 
        icon={<Brain size={20} />}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse flex flex-col items-center">
            <Brain size={32} className="text-blue-200 mb-4" />
            <p className="text-gray-400">Loading quiz questions...</p>
          </div>
        </div>
      </LearningStepCard>
    );
  }
  
  if (quizItems.length === 0) {
    return (
      <LearningStepCard 
        title="Comprehension Quiz" 
        icon={<Brain size={20} />}
      >
        <p className="text-gray-700 mb-4">
          No quiz questions available for this paper.
        </p>
      </LearningStepCard>
    );
  }
  
  // Format questions from the database
  const formattedQuestions: QuizQuestion[] = [];
  
  // First try to use questions from the database
  if (dbQuestions.length > 0) {
    dbQuestions.forEach(q => {
      if (q.text && Array.isArray(q.choices) && q.choices.length > 0) {
        const correctAns = typeof q.correct_answer === 'string' 
          ? parseInt(q.correct_answer, 10) 
          : 0;
        
        formattedQuestions.push({
          id: q.id, // Use the actual question ID from the database
          question: q.text,
          options: q.choices,
          correctAnswer: correctAns,
          explanation: ''
        });
      }
    });
  }
  
  // If no database questions, fall back to extracting from items
  if (formattedQuestions.length === 0) {
    quizItems.forEach((item, itemIndex) => {
      // Check for different possible data structures
      
      // Case 1: Questions array in data.questions or metadata.questions
      const itemAny = item as any; // Type assertion to handle dynamic properties
      const questionsArray = itemAny.data?.questions || item.metadata?.questions;
      if (Array.isArray(questionsArray) && questionsArray.length > 0) {
        questionsArray.forEach((q, qIndex) => {
          if (q.question && Array.isArray(q.options) && q.options.length > 0) {
            let correctAns = 0;
            if (q.correct_answer !== undefined) {
              correctAns = typeof q.correct_answer === 'string' 
                ? parseInt(q.correct_answer, 10) 
                : q.correct_answer;
            }
            
            formattedQuestions.push({
              id: `${item.id}-q${qIndex}`,
              question: q.question,
              options: q.options,
              correctAnswer: correctAns,
              explanation: q.explanation || ''
            });
          }
        });
      }
      // Case 2: Single question in the item itself
      else {
        // Extract options from metadata or data
        const options = item.metadata?.options || itemAny.data?.options || [];
        
        // Extract correct answer
        let correctAnswer = 0; // Default to first option
        
        if (item.metadata?.correct_answer !== undefined) {
          correctAnswer = typeof item.metadata.correct_answer === 'string' 
            ? parseInt(item.metadata.correct_answer, 10) 
            : item.metadata.correct_answer;
        } else if (item.metadata?.correctAnswer !== undefined) {
          correctAnswer = typeof item.metadata.correctAnswer === 'string'
            ? parseInt(item.metadata.correctAnswer, 10)
            : item.metadata.correctAnswer;
        } else if (itemAny.data?.correct_answer !== undefined) {
          correctAnswer = typeof itemAny.data.correct_answer === 'string'
            ? parseInt(itemAny.data.correct_answer, 10)
            : itemAny.data.correct_answer;
        }
        
        // Get the question text
        const questionText = item.content || item.title || itemAny.data?.question || 
          (item.metadata?.title as string) || 'Question not available';
        
        if (Array.isArray(options) && options.length > 0) {
          formattedQuestions.push({
            id: item.id,
            question: questionText,
            options: options,
            correctAnswer: correctAnswer,
            explanation: item.metadata?.explanation || itemAny.data?.explanation || ''
          });
        }
      }
    });
  }
  
  // Filter out questions with no options
  const validQuestions = formattedQuestions.filter(q => q.options && q.options.length > 0);
  
  if (validQuestions.length === 0) {
    return (
      <LearningStepCard 
        title="Comprehension Quiz" 
        icon={<Brain size={20} />}
      >
        <p className="text-gray-700 mb-4">
          No valid quiz questions could be extracted for this paper.
        </p>
      </LearningStepCard>
    );
  }
  
  return (
    <LearningStepCard 
      title="Comprehension Quiz" 
      icon={<Brain size={20} />}
    >
      <p className="text-gray-700 mb-4">
        Test your understanding of the paper:
        {allQuizzesCompleted && " (Completed)"}
      </p>
      <MultipleChoiceQuiz
        questions={validQuestions}
        onComplete={handleComplete}
        className="mb-4"
        isCompleted={allQuizzesCompleted}
      />
    </LearningStepCard>
  );
};

export default QuizStep; 