
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
}

const MultipleChoiceQuiz = ({ 
  questions, 
  title, 
  className,
  onComplete 
}: MultipleChoiceQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>(Array(questions.length).fill(-1));
  const [showResults, setShowResults] = useState<boolean[]>(Array(questions.length).fill(false));
  const [isCompleted, setIsCompleted] = useState(false);
  const { toast } = useToast();

  const handleSelectOption = (optionIndex: number) => {
    const newSelections = [...selectedOptions];
    newSelections[currentQuestion] = optionIndex;
    setSelectedOptions(newSelections);
  };

  const handleCheckAnswer = () => {
    if (selectedOptions[currentQuestion] === -1) {
      toast({
        title: "No option selected",
        description: "Please select an answer before checking.",
        variant: "destructive"
      });
      return;
    }

    const newResults = [...showResults];
    newResults[currentQuestion] = true;
    setShowResults(newResults);
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
    const score = selectedOptions.reduce((total, selected, index) => {
      return selected === questions[index].correctAnswer ? total + 1 : total;
    }, 0);
    
    setIsCompleted(true);
    
    if (onComplete) {
      onComplete(score, questions.length);
    }
    
    toast({
      title: "Quiz completed!",
      description: `You scored ${score} out of ${questions.length}.`,
      variant: score / questions.length >= 0.7 ? "default" : "destructive"
    });
  };

  const getResultIcon = (questionIndex: number, optionIndex: number) => {
    if (!showResults[questionIndex]) return null;
    
    const isSelected = selectedOptions[questionIndex] === optionIndex;
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

  return (
    <div className={cn("p-4 bg-white rounded-lg border border-gray-200", className)}>
      {title && (
        <h3 className="text-xl font-semibold mb-6">{title}</h3>
      )}
      
      <div className="mb-4 flex justify-between text-sm text-gray-500">
        <span>Question {currentQuestion + 1} of {questions.length}</span>
        {isCompleted && <span className="text-blue-600 font-medium">Quiz completed</span>}
      </div>
      
      <div className="quiz-question mb-6">
        <h4 className="text-lg font-medium mb-4">{questions[currentQuestion].question}</h4>
        
        <div className="space-y-3">
          {questions[currentQuestion].options.map((option, optionIndex) => (
            <div 
              key={optionIndex}
              className={cn(
                "p-3 border rounded-lg flex items-start cursor-pointer transition-colors",
                selectedOptions[currentQuestion] === optionIndex 
                  ? "border-blue-300 bg-blue-50" 
                  : "border-gray-200 hover:bg-gray-50",
                showResults[currentQuestion] && questions[currentQuestion].correctAnswer === optionIndex
                  ? "border-green-300 bg-green-50" 
                  : ""
              )}
              onClick={() => !showResults[currentQuestion] && handleSelectOption(optionIndex)}
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
          <Button onClick={handleCheckAnswer}>
            Check Answer
          </Button>
        ) : (
          <Button onClick={handleNextQuestion}>
            {currentQuestion < questions.length - 1 ? "Next Question" : "Finish Quiz"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default MultipleChoiceQuiz;
