
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Brain, GraduationCap, Lightbulb, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PdfViewer from '@/components/ui-components/PdfViewer';
import SkillLevelSidebar from '@/components/ui-components/SkillLevelSidebar';
import LearningJourney from '@/components/ui-components/LearningJourney';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import { useToast } from '@/hooks/use-toast';

const PaperDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [skillLevel, setSkillLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [paper, setPaper] = useState<any>(null);
  const { toast } = useToast();
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  // Check screen size for responsive layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1200);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);
  
  // Mock paper data - would fetch from API/Supabase in real app
  useEffect(() => {
    const fetchPaper = async () => {
      setIsLoading(true);
      
      try {
        // Mock data for demonstration
        setTimeout(() => {
          setPaper({
            id,
            title: 'Attention Is All You Need',
            authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar'],
            date: 'June 12, 2017',
            abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely...',
            pdfUrl: 'https://arxiv.org/pdf/1706.03762.pdf',
            relatedPapers: [
              { id: '101', title: 'BERT: Pre-training of Deep Bidirectional Transformers' },
              { id: '102', title: 'GPT-3: Language Models are Few-Shot Learners' }
            ],
            quiz: [
              { 
                question: 'What is the main innovation in the Transformer architecture?',
                options: [
                  'Using only attention mechanisms and no recurrence or convolutions',
                  'Adding more layers to existing RNN models',
                  'Combining CNNs with RNNs',
                  'Using transformations to convert text to images'
                ],
                correctAnswer: 0
              }
            ]
          });
          
          setIsLoading(false);
          
          // Start with skill level 0
          setSkillLevel(0);
          
          // Then after a delay, update to show user has read the summary
          setTimeout(() => {
            setSkillLevel(20);
            
            toast({
              title: "Skill level increased!",
              description: "You've reached Beginner level by reading the summary."
            });
          }, 3000);
        }, 1500);
      } catch (error) {
        console.error('Error fetching paper:', error);
        setIsLoading(false);
      }
    };
    
    fetchPaper();
  }, [id, toast]);
  
  const handleStepComplete = (stepIndex: number) => {
    // Increase skill level as user progresses through steps
    // This is simplified - in a real app you'd base this on quiz results, etc.
    const newLevel = Math.min(skillLevel + 10, 100);
    
    if (newLevel > skillLevel) {
      setSkillLevel(newLevel);
      
      toast({
        title: "Skill level increased!",
        description: "You've made progress in understanding this paper."
      });
    }
  };

  // Learning journey steps
  const renderSummaryStep = () => (
    <LearningStepCard 
      title="Paper Summary" 
      icon={<FileText size={20} />}
    >
      <p className="text-gray-700 mb-4">
        {paper?.abstract}
      </p>
      <p className="text-gray-700 mb-4">
        The paper introduces the Transformer, a novel architecture for sequence transduction that relies entirely on attention mechanisms, without using recurrence or convolution. The Transformer achieves state-of-the-art results on translation tasks while being more parallelizable and requiring less training time than previous models.
      </p>
      <Button onClick={() => handleStepComplete(0)}>
        I've read the summary
      </Button>
    </LearningStepCard>
  );
  
  const renderKeyConceptsStep = () => (
    <LearningStepCard 
      title="Key Concepts" 
      icon={<BookOpen size={20} />}
    >
      <ul className="list-disc list-inside space-y-3 text-gray-700 mb-6">
        <li className="pl-2">
          <span className="font-medium">Self-Attention:</span> Allows the model to attend to different positions of the input sequence to compute representations.
        </li>
        <li className="pl-2">
          <span className="font-medium">Multi-Head Attention:</span> Runs multiple attention mechanisms in parallel to capture different relationships.
        </li>
        <li className="pl-2">
          <span className="font-medium">Positional Encoding:</span> Since the model has no recurrence or convolution, positional encodings are added to capture sequence order.
        </li>
        <li className="pl-2">
          <span className="font-medium">Layer Normalization:</span> Applied after each sub-layer to stabilize the network.
        </li>
      </ul>
      <Button onClick={() => handleStepComplete(1)}>
        I understand these concepts
      </Button>
    </LearningStepCard>
  );
  
  const renderQuizStep = () => (
    <LearningStepCard 
      title="Quiz" 
      icon={<Brain size={20} />}
    >
      <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-3">
          What is the main innovation in the Transformer architecture?
        </h4>
        <div className="space-y-2">
          {paper?.quiz[0].options.map((option: string, idx: number) => (
            <div 
              key={idx}
              className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors"
              onClick={() => {
                if (idx === paper.quiz[0].correctAnswer) {
                  toast({
                    title: "Correct!",
                    description: "Great job! You've answered correctly."
                  });
                  handleStepComplete(2);
                } else {
                  toast({
                    title: "Incorrect",
                    description: "That's not right. Try again!",
                    variant: "destructive"
                  });
                }
              }}
            >
              <label className="flex items-start cursor-pointer">
                <div className="flex items-center h-5">
                  <span className="w-5 h-5 border border-gray-300 rounded-full flex items-center justify-center mr-2">
                    {String.fromCharCode(65 + idx)}
                  </span>
                </div>
                <span className="ml-2 text-gray-700">{option}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </LearningStepCard>
  );
  
  const renderRelatedPapersStep = () => (
    <LearningStepCard 
      title="Related Papers" 
      icon={<Lightbulb size={20} />}
    >
      <p className="text-gray-700 mb-4">
        Understanding how this paper relates to others in the field will deepen your knowledge:
      </p>
      <div className="space-y-4 mb-6">
        {paper?.relatedPapers.map((related: any) => (
          <div key={related.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h4 className="font-medium text-blue-600">{related.title}</h4>
            <p className="text-sm text-gray-500 mt-1">
              This paper builds upon concepts introduced in the Transformer.
            </p>
          </div>
        ))}
      </div>
      <Button onClick={() => handleStepComplete(3)}>
        I've explored related papers
      </Button>
    </LearningStepCard>
  );
  
  const renderMasteryStep = () => (
    <LearningStepCard 
      title="Path to Mastery" 
      icon={<GraduationCap size={20} />}
    >
      <p className="text-gray-700 mb-4">
        Congratulations on your progress! To reach mastery level, consider these advanced activities:
      </p>
      <ul className="list-disc list-inside space-y-3 text-gray-700 mb-6">
        <li className="pl-2">
          Implement a simplified version of the Transformer architecture
        </li>
        <li className="pl-2">
          Compare the performance of Transformers with RNNs on a specific task
        </li>
        <li className="pl-2">
          Analyze how subsequent research has improved upon the original Transformer
        </li>
      </ul>
      <Button onClick={() => handleStepComplete(4)}>
        I'm ready for mastery
      </Button>
    </LearningStepCard>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <Brain size={48} className="text-blue-200 mb-4 animate-float" />
          <h2 className="text-xl font-medium text-gray-400 mb-2">Analyzing Paper...</h2>
          <p className="text-gray-400">Building your personalized learning journey</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-2 sm:px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link to="/dashboard">
                <ArrowLeft size={18} />
              </Link>
            </Button>
            <Link to="/" className="flex items-center">
              <Brain className="text-blue-600 mr-2" size={24} />
              <span className="font-bold hidden sm:inline">Paper Mastery</span>
            </Link>
            <span className="mx-2 text-gray-300">|</span>
            <h1 className="text-lg sm:text-xl font-bold truncate max-w-[150px] sm:max-w-md">
              {paper?.title}
            </h1>
          </div>
        </div>
      </header>
      
      <main className="w-full max-w-full px-1 py-4">
        {isSmallScreen ? (
          // Mobile/Tablet layout - Vertical stacking with horizontal skill level on top
          <div className="flex flex-col space-y-4">
            {/* Skill Level - Horizontal Bar on Top */}
            <div>
              <SkillLevelSidebar 
                skillLevel={skillLevel} 
                className="h-auto" 
                isHorizontal={true} 
              />
            </div>
            
            {/* Two column layout for PDF and Learning Journey */}
            <div className="grid grid-cols-12 gap-3">
              {/* PDF Viewer */}
              <div className="col-span-6 h-[calc(100vh-14rem)]">
                <PdfViewer pdfUrl={paper?.pdfUrl} className="h-full" />
              </div>
              
              {/* Learning Journey */}
              <div className="col-span-6">
                <LearningJourney
                  steps={[
                    renderSummaryStep(),
                    renderKeyConceptsStep(),
                    renderQuizStep(),
                    renderRelatedPapersStep(),
                    renderMasteryStep(),
                  ]}
                  onCompleteStep={handleStepComplete}
                />
              </div>
            </div>
          </div>
        ) : (
          // Desktop layout - Three column with wider PDF on left
          <div className="grid grid-cols-12 gap-3">
            {/* PDF Viewer - Left Column */}
            <div className="col-span-5 h-[calc(100vh-9rem)] sticky top-20">
              <PdfViewer pdfUrl={paper?.pdfUrl} className="h-full" />
            </div>
            
            {/* Learning Journey - Middle Column */}
            <div className="col-span-5">
              <LearningJourney
                steps={[
                  renderSummaryStep(),
                  renderKeyConceptsStep(),
                  renderQuizStep(),
                  renderRelatedPapersStep(),
                  renderMasteryStep(),
                ]}
                onCompleteStep={handleStepComplete}
              />
            </div>
            
            {/* Skill Level - Right Column */}
            <div className="col-span-2 h-[calc(100vh-9rem)] sticky top-20">
              <SkillLevelSidebar 
                skillLevel={skillLevel} 
                className="h-full" 
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PaperDetails;
