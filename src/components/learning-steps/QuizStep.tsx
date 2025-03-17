import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import MultipleChoiceQuiz, { QuizQuestion } from '@/components/ui-components/MultipleChoiceQuiz';
import { LearningItem } from '@/services/types';
import { learningAPI } from '@/services/learningAPI';
import { toast } from '@/components/ui/use-toast';

interface QuizStepProps {
  quizItems: LearningItem[];
  isLoading: boolean;
  onComplete: () => void;
}

const QuizStep: React.FC<QuizStepProps> = ({ quizItems, isLoading, onComplete }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startTime = React.useRef(Date.now());

  const handleComplete = async (score: number, total: number) => {
    if (quizItems.length === 0) {
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

  if (isLoading) {
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
  
  // Create quiz questions from the quiz items
  const formattedQuestions: QuizQuestion[] = [];
  
  quizItems.forEach((item, itemIndex) => {
    // Check for different possible data structures
    
    // Case 1: Questions array in data.questions or metadata.questions
    const questionsArray = item.data?.questions || item.metadata?.questions;
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
      const options = item.metadata?.options || item.data?.options || [];
      
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
      } else if (item.data?.correct_answer !== undefined) {
        correctAnswer = typeof item.data.correct_answer === 'string'
          ? parseInt(item.data.correct_answer, 10)
          : item.data.correct_answer;
      }
      
      // Get the question text
      const questionText = item.content || item.title || item.data?.question || 
        (item.metadata?.title as string) || 'Question not available';
      
      if (Array.isArray(options) && options.length > 0) {
        formattedQuestions.push({
          id: item.id || `q${itemIndex}`,
          question: questionText,
          options: options,
          correctAnswer: correctAnswer,
          explanation: item.metadata?.explanation || item.data?.explanation || ''
        });
      }
    }
  });
  
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
      </p>
      <MultipleChoiceQuiz
        questions={validQuestions}
        onComplete={handleComplete}
        className="mb-4"
      />
    </LearningStepCard>
  );
};

export default QuizStep; 