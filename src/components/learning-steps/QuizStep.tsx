import React, { useState, useEffect, useMemo } from 'react';
import { Brain, Filter, Loader2 } from 'lucide-react';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import MultipleChoiceQuiz, { QuizQuestion } from '@/components/ui-components/MultipleChoiceQuiz';
import { LearningItem } from '@/services/types';
import { learningAPI } from '@/services/learningAPI';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuizHistory, QuizAnswer } from '@/hooks/useQuizHistory';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

// Define the display mode types
type DisplayMode = 'unanswered' | 'answered';
type AnsweredFilter = 'all' | 'correct' | 'incorrect';

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
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const startTime = React.useRef(Date.now());
  
  // New state for toggle and filter
  const [displayMode, setDisplayMode] = useState<DisplayMode>('unanswered');
  const [answeredFilter, setAnsweredFilter] = useState<AnsweredFilter>('all');
  const [formattedQuestions, setFormattedQuestions] = useState<QuizQuestion[]>([]);

  // Fetch quiz history for this paper
  const { answers: quizAnswers, isLoading: isLoadingAnswers } = useQuizHistory(paperId);
  
  // Filter out questions with no options
  const validQuestions = useMemo(() => {
    return formattedQuestions.filter(q => q.options && q.options.length > 0);
  }, [formattedQuestions]);

  // Create a map of answered questions for easy lookup
  const answeredQuestionMap = useMemo(() => {
    const map: Record<string, QuizAnswer> = {};
    if (quizAnswers && quizAnswers.length > 0) {
      quizAnswers.forEach(answer => {
        map[answer.question_id] = answer;
      });
    }
    return map;
  }, [quizAnswers]);
  
  // Filter questions based on display mode and answer filter
  const filteredQuestions = useMemo(() => {
    if (displayMode === 'unanswered') {
      return validQuestions.filter(q => !answeredQuestionMap[q.id]);
    } else {
      // Filter answered questions
      const answeredQuestions = validQuestions.filter(q => answeredQuestionMap[q.id]);
      
      // Apply additional filter if needed
      if (answeredFilter === 'correct') {
        return answeredQuestions.filter(q => answeredQuestionMap[q.id]?.is_correct);
      } else if (answeredFilter === 'incorrect') {
        return answeredQuestions.filter(q => !answeredQuestionMap[q.id]?.is_correct);
      }
      
      return answeredQuestions;
    }
  }, [validQuestions, displayMode, answeredFilter, answeredQuestionMap]);

  // Calculate counts for badges
  const answeredCount = useMemo(() => {
    return validQuestions.filter(q => answeredQuestionMap[q.id]).length;
  }, [validQuestions, answeredQuestionMap]);
  
  const unansweredCount = useMemo(() => {
    return validQuestions.length - answeredCount;
  }, [validQuestions.length, answeredCount]);
  
  const correctCount = useMemo(() => {
    return validQuestions.filter(q => answeredQuestionMap[q.id]?.is_correct).length;
  }, [validQuestions, answeredQuestionMap]);
  
  const incorrectCount = useMemo(() => {
    return answeredCount - correctCount;
  }, [answeredCount, correctCount]);

  // Check if all quizzes are already completed
  useEffect(() => {
    const areAllCompleted = quizItems.length > 0 && 
      quizItems.every(item => completedItemIds.includes(item.id));
    setAllQuizzesCompleted(areAllCompleted);
  }, [quizItems, completedItemIds]);

  // Process questions once dbQuestions is loaded
  useEffect(() => {
    if (dbQuestions.length === 0 && (quizItems.length === 0 || isLoading)) return;
    
    const newFormattedQuestions: QuizQuestion[] = [];
    
    // First try to use questions from the database
    if (dbQuestions.length > 0) {
      dbQuestions.forEach(q => {
        if (q.text && Array.isArray(q.choices) && q.choices.length > 0) {
          const correctAns = typeof q.correct_answer === 'string' 
            ? parseInt(q.correct_answer, 10) 
            : 0;
          
          newFormattedQuestions.push({
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
    if (newFormattedQuestions.length === 0 && quizItems.length > 0) {
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
              
              newFormattedQuestions.push({
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
            newFormattedQuestions.push({
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
    
    setFormattedQuestions(newFormattedQuestions);
  }, [dbQuestions, quizItems, isLoading]);

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

  const handleGenerateMoreQuestions = async () => {
    if (!paperId) return;
    
    setIsGeneratingQuestions(true);
    try {
      const newQuestions = await learningAPI.generateAdditionalQuestions(paperId);
      
      // Refresh the component to show the new questions
      if (newQuestions.length > 0) {
        toast({
          title: "Success",
          description: `Generated ${newQuestions.length} new questions!`,
          variant: "default"
        });
        
        // Refresh the questions by refetching
        const questions = await learningAPI.getQuizQuestions(paperId);
        setFormattedQuestions(questions);
      } else {
        toast({
          title: "No new questions",
          description: "Could not generate additional questions. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating additional questions:', error);
      toast({
        title: "Error",
        description: "Failed to generate additional questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  if (isLoading || loadingQuestions || isLoadingAnswers) {
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

      {/* Toggle between answered and unanswered questions */}
      <div className="mb-4">
        <ToggleGroup 
          type="single" 
          value={displayMode} 
          onValueChange={(value) => value && setDisplayMode(value as DisplayMode)}
          className="justify-start mb-2"
        >
          <ToggleGroupItem value="unanswered" aria-label="Show unanswered questions">
            Unanswered <Badge variant="outline" className="ml-2">{unansweredCount}</Badge>
          </ToggleGroupItem>
          <ToggleGroupItem value="answered" aria-label="Show answered questions">
            Answered <Badge variant="outline" className="ml-2">{answeredCount}</Badge>
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Show filter for answered questions */}
        {displayMode === 'answered' && answeredCount > 0 && (
          <ToggleGroup 
            type="single" 
            value={answeredFilter} 
            onValueChange={(value) => value && setAnsweredFilter(value as AnsweredFilter)}
            className="justify-start"
          >
            <ToggleGroupItem value="all" aria-label="Show all answered questions">
              All <Badge variant="outline" className="ml-2">{answeredCount}</Badge>
            </ToggleGroupItem>
            <ToggleGroupItem value="correct" aria-label="Show correctly answered questions">
              Correct <Badge variant="outline" className="ml-2">{correctCount}</Badge>
            </ToggleGroupItem>
            <ToggleGroupItem value="incorrect" aria-label="Show incorrectly answered questions">
              Incorrect <Badge variant="outline" className="ml-2">{incorrectCount}</Badge>
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>

      {filteredQuestions.length > 0 ? (
        <MultipleChoiceQuiz
          key={`${displayMode}-${answeredFilter}`}
          questions={filteredQuestions}
          onComplete={handleComplete}
          className="mb-4"
          isCompleted={allQuizzesCompleted || displayMode === 'answered'}
          previousAnswers={displayMode === 'answered' ? answeredQuestionMap : undefined}
        />
      ) : (
        <div className="p-4 border border-gray-200 rounded-md text-center">
          <p className="text-gray-500 mb-4">
            {displayMode === 'unanswered' 
              ? "You've answered all the questions. Generate more questions or switch to 'Answered' to review your answers." 
              : answeredFilter !== 'all' 
                ? `No ${answeredFilter === 'correct' ? 'correctly' : 'incorrectly'} answered questions yet.`
                : "You haven't answered any questions yet."}
          </p>
          {displayMode === 'unanswered' && paperId && (
            <Button 
              onClick={handleGenerateMoreQuestions} 
              disabled={isGeneratingQuestions}
            >
              {isGeneratingQuestions ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                "Generate More Questions"
              )}
            </Button>
          )}
        </div>
      )}
    </LearningStepCard>
  );
};

export default QuizStep; 