import React from 'react';
import { Brain } from 'lucide-react';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import MultipleChoiceQuiz, { QuizQuestion } from '@/components/ui-components/MultipleChoiceQuiz';
import { LearningItem } from '@/services/types';

interface QuizStepProps {
  quizItems: LearningItem[];
  isLoading: boolean;
  onComplete: () => void;
}

const QuizStep: React.FC<QuizStepProps> = ({ quizItems, isLoading, onComplete }) => {
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
  
  // Create quiz questions from the quiz items directly
  // Each quiz item is a question itself
  const formattedQuestions: QuizQuestion[] = quizItems.map((item, index) => {
    // Extract options from metadata
    const options = item.metadata?.options || [];
    
    // Extract correct answer from metadata
    let correctAnswer = 0; // Default to first option
    if (item.metadata?.correct_answer !== undefined) {
      correctAnswer = typeof item.metadata.correct_answer === 'string' 
        ? parseInt(item.metadata.correct_answer, 10) 
        : item.metadata.correct_answer;
    } else if (item.metadata?.correctAnswer !== undefined) {
      correctAnswer = typeof item.metadata.correctAnswer === 'string'
        ? parseInt(item.metadata.correctAnswer, 10)
        : item.metadata.correctAnswer;
    }
    
    return {
      id: item.id || `q${index + 1}`,
      question: item.content || (item.metadata?.title as string) || 'Question not available',
      options: options,
      correctAnswer: correctAnswer,
      explanation: item.metadata?.explanation || ''
    };
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
          No valid quiz questions available for this paper.
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
        onComplete={(score, total) => {
          if (score / total >= 0.7) {
            onComplete();
          }
        }}
        className="mb-4"
      />
    </LearningStepCard>
  );
};

export default QuizStep; 