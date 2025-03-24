import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { learningAPI } from '@/services/learningAPI';
import { useQuizHistory, QuizAnswer } from '@/hooks/useQuizHistory';
import { Skeleton } from '@/components/ui/skeleton';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface MultipleChoiceQuizProps {
  questions: QuizQuestion[];
  title?: string;
  className?: string;
  onComplete?: (score: number, total: number) => void;
  isCompleted?: boolean;
  previousAnswers?: Record<string, QuizAnswer>;
}

const MultipleChoiceQuiz = ({ 
  questions, 
  title, 
  className,
  onComplete,
  isCompleted: initialIsCompleted = false,
  previousAnswers: providedPreviousAnswers
}: MultipleChoiceQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>(Array(questions.length).fill(-1));
  const [showResults, setShowResults] = useState<boolean[]>(Array(questions.length).fill(false));
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
  const { toast } = useToast();
  
  // Get quiz history if not provided externally
  const { answers: userAnswers, isLoading: isLoadingHistory } = useQuizHistory();
  const [previousAnswers, setPreviousAnswers] = useState<Record<string, QuizAnswer>>(providedPreviousAnswers || {});

  // Reset current question when questions array changes
  useEffect(() => {
    setCurrentQuestion(0);
    setSelectedOptions(Array(questions.length).fill(-1));
    setShowResults(Array(questions.length).fill(false));
  }, [questions]);

  // Process user answers to create a map of question ID to answer details
  useEffect(() => {
    // If previous answers were provided directly, use those instead of fetching
    if (providedPreviousAnswers) {
      setPreviousAnswers(providedPreviousAnswers);
      
      // Pre-populate selected options and results from provided answers
      const newSelections = Array(questions.length).fill(-1);
      const newResults = Array(questions.length).fill(false);
      
      questions.forEach((question, index) => {
        const previousAnswer = providedPreviousAnswers[question.id];
        if (previousAnswer) {
          newSelections[index] = previousAnswer.selected_answer;
          newResults[index] = true;
        }
      });
      
      setSelectedOptions(newSelections);
      setShowResults(newResults);
      return;
    }
    
    // Otherwise use the answers from the hook
    if (!userAnswers || userAnswers.length === 0) return;
    
    // Create a map of question IDs to answer details
    const answerMap: Record<string, QuizAnswer> = {};
    
    // For each user answer, store it by question ID
    userAnswers.forEach(answer => {
      answerMap[answer.question_id] = answer;
    });
    
    setPreviousAnswers(answerMap);
    
    // Pre-populate selected options and results if we have previous answers
    const newSelections = Array(questions.length).fill(-1);
    const newResults = Array(questions.length).fill(false);
    
    questions.forEach((question, index) => {
      const previousAnswer = answerMap[question.id];
      if (previousAnswer) {
        newSelections[index] = previousAnswer.selected_answer;
        newResults[index] = true;
      }
    });
    
    setSelectedOptions(newSelections);
    setShowResults(newResults);
  }, [userAnswers, providedPreviousAnswers, questions]);

  useEffect(() => {
    setIsCompleted(initialIsCompleted);
    
    if (initialIsCompleted) {
      setShowResults(Array(questions.length).fill(true));
      
      if (selectedOptions.every(opt => opt === -1)) {
        const defaultSelections = Array(questions.length).fill(0).map((_, i) => questions[i].correctAnswer);
        setSelectedOptions(defaultSelections);
      }
    }
  }, [initialIsCompleted, questions.length, questions, selectedOptions]);

  // Early return if no questions
  if (questions.length === 0) {
    return (
      <div className={cn("p-4 bg-white rounded-lg border border-gray-200", className)}>
        <p className="text-gray-500 text-center">No questions available.</p>
      </div>
    );
  }

  const handleSelectOption = (optionIndex: number) => {
    if (isCompleted) return;
    
    const newSelections = [...selectedOptions];
    newSelections[currentQuestion] = optionIndex;
    setSelectedOptions(newSelections);
  };

  const handleCheckAnswer = async () => {
    if (selectedOptions[currentQuestion] === -1) {
      toast({
        title: "No option selected",
        description: "Please select an answer before checking.",
        variant: "destructive"
      });
      return;
    }

    // Get the current question ID and selected answer
    const currentQuestionId = questions[currentQuestion].id;
    const selectedAnswer = selectedOptions[currentQuestion];

    console.log('Submitting answer for question ID:', currentQuestionId);

    try {
      // Submit the answer to the backend
      await learningAPI.submitAnswer(currentQuestionId, selectedAnswer);
      
      // Update UI to show results
      const newResults = [...showResults];
      newResults[currentQuestion] = true;
      setShowResults(newResults);
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error",
        description: "Failed to submit your answer. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeQuiz();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const completeQuiz = () => {
    if (isCompleted) return;
    
    const score = selectedOptions.reduce((total, selected, index) => {
      return selected === questions[index].correctAnswer ? total + 1 : total;
    }, 0);
    
    setIsCompleted(true);
    
    if (onComplete) {
      onComplete(score, questions.length);
    }
  };

  const getResultIcon = (questionIndex: number, optionIndex: number) => {
    if (!showResults[questionIndex]) return null;
    
    const isSelected = selectedOptions[questionIndex] === optionIndex;
    const currentQuestionId = questions[questionIndex].id;
    const previousAnswer = previousAnswers[currentQuestionId];
    
    // If we have a previous answer for this question, use it
    if (previousAnswer) {
      const isCorrect = previousAnswer.correct_answer === optionIndex;
      
      if (isSelected && isCorrect) {
        return <CheckCircle2 className="text-green-500" size={20} />;
      } else if (isSelected && !isCorrect) {
        return <XCircle className="text-red-500" size={20} />;
      } else if (!isSelected && isCorrect) {
        return <CheckCircle2 className="text-green-400 opacity-70" size={20} />;
      }
      return null;
    }
    
    // Otherwise, use the local state
    const isCorrect = questions[questionIndex].correctAnswer === optionIndex;
    
    if (isSelected && isCorrect) {
      return <CheckCircle2 className="text-green-500" size={20} />;
    } else if (isSelected && !isCorrect) {
      return <XCircle className="text-red-500" size={20} />;
    } else if (!isSelected && isCorrect) {
      return <CheckCircle2 className="text-green-400 opacity-70" size={20} />;
    }
    
    return null;
  };

  if (isLoadingHistory) {
    return (
      <div className={cn("p-4 bg-white rounded-lg border border-gray-200", className)}>
        <Skeleton className="h-6 w-1/4 mb-4" />
        <Skeleton className="h-12 w-full mb-3" />
        <div className="space-y-3 mb-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-4 bg-white rounded-lg border border-gray-200", className)}>
      {title && (
        <h3 className="text-xl font-semibold mb-6">{title}</h3>
      )}
      
      <div className="mb-4 flex justify-between text-sm text-gray-500">
        <span>Question {currentQuestion + 1} of {questions.length}</span>
        {isCompleted && <span className="text-green-600 font-medium">Quiz completed ✓</span>}
      </div>
      
      <div className="quiz-question mb-6">
        <h4 className="text-lg font-medium mb-4">{questions[currentQuestion].question}</h4>
        
        <div className="space-y-3">
          {questions[currentQuestion].options.map((option, optionIndex) => (
            <div 
              key={optionIndex}
              className={cn(
                "p-3 border rounded-lg flex items-start transition-colors",
                !isCompleted && "cursor-pointer",
                selectedOptions[currentQuestion] === optionIndex 
                  ? "border-blue-300 bg-blue-50" 
                  : "border-gray-200 hover:bg-gray-50",
                showResults[currentQuestion] && questions[currentQuestion].correctAnswer === optionIndex
                  ? "border-green-300 bg-green-50" 
                  : ""
              )}
              onClick={() => !showResults[currentQuestion] && !isCompleted && handleSelectOption(optionIndex)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <span className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm mr-3">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span>{option}</span>
                </div>
                {getResultIcon(currentQuestion, optionIndex)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {showResults[currentQuestion] && questions[currentQuestion].explanation && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <HelpCircle size={18} className="text-blue-500 mt-0.5 mr-2" />
            <p className="text-sm text-gray-700">{questions[currentQuestion].explanation}</p>
          </div>
        </div>
      )}
      
      <div className="flex justify-between mt-4">
        <Button 
          variant="outline"
          onClick={handlePrevQuestion}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>
        
        {!showResults[currentQuestion] ? (
          <Button onClick={handleCheckAnswer} disabled={isCompleted}>
            Check Answer
          </Button>
        ) : (
          <Button onClick={handleNextQuestion} disabled={isCompleted && currentQuestion === questions.length - 1}>
            {currentQuestion < questions.length - 1 ? "Next Question" : "Finish Quiz"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default MultipleChoiceQuiz;
