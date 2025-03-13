import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Brain, GraduationCap, Lightbulb, FileText, Video, Layers, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PdfViewer from '@/components/ui-components/PdfViewer';
import SkillLevelSidebar from '@/components/ui-components/SkillLevelSidebar';
import LearningJourney from '@/components/ui-components/LearningJourney';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import VideoEmbed from '@/components/ui-components/VideoEmbed';
import MultipleChoiceQuiz from '@/components/ui-components/MultipleChoiceQuiz';
import { QuizQuestion } from '@/components/ui-components/MultipleChoiceQuiz';
import Flashcard from '@/components/ui-components/Flashcard';
import { FlashcardData } from '@/components/ui-components/Flashcard';
import GoogleSlidesEmbed from '@/components/ui-components/GoogleSlidesEmbed';
import MarkdownRenderer from '@/components/ui-components/MarkdownRenderer';
import { useToast } from '@/hooks/use-toast';
import { papersAPI } from '@/services/papersAPI';
import { learningAPI } from '@/services/learningAPI';
import { LearningItem, VideoItem } from '@/services/types';

const PaperDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [skillLevel, setSkillLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [paper, setPaper] = useState<any>(null);
  const [selectedSummaryType, setSelectedSummaryType] = useState<'beginner' | 'intermediate' | 'advanced' | 'abstract'>('intermediate');
  const { toast } = useToast();
  
  const [showPdf, setShowPdf] = useState(true);
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [videoItems, setVideoItems] = useState<LearningItem[]>([]);
  const [isLoadingLearningItems, setIsLoadingLearningItems] = useState(true);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowPdf(false);
      } else {
        setShowPdf(true);
      }
    };
    
    handleResize();
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  useEffect(() => {
    const fetchPaper = async () => {
      setIsLoading(true);
      
      try {
        if (id) {
          const paperData = await papersAPI.getPaper(id);
          // Ensure pdfUrl is set for the PDF viewer
          setPaper({
            ...paperData,
            pdfUrl: `https://arxiv.org/pdf/${paperData.arxiv_id}`
          });
          
          // Fetch learning items
          await fetchLearningItems(id);
        }
      } catch (error) {
        console.error('Error fetching paper:', error);
        toast({
          title: 'Error',
          description: 'Failed to load paper details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPaper();
  }, [id, toast]);
  
  const fetchLearningItems = async (paperId: string) => {
    setIsLoadingLearningItems(true);
    
    try {
      // Fetch all learning materials for the paper
      const materials = await learningAPI.getLearningMaterials(paperId);
      setLearningItems(materials);
      
      // Filter video items
      const videos = materials.filter(item => item.type === 'video');
      setVideoItems(videos);
      
      console.log(`Retrieved ${materials.length} learning items, including ${videos.length} video items`);
    } catch (error) {
      console.error('Error fetching learning items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load learning materials. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLearningItems(false);
    }
  };
  
  const togglePdfView = () => {
    setShowPdf(!showPdf);
  };
  
  const handleStepComplete = (stepIndex: number) => {
    const newLevel = Math.min(skillLevel + 10, 100);
    
    if (newLevel > skillLevel) {
      setSkillLevel(newLevel);
      
      toast({
        title: "Skill level increased!",
        description: "You've made progress in understanding this paper."
      });
    }
  };

  const renderSummaryStep = () => (
    <LearningStepCard 
      title="Paper Summary" 
      icon={<FileText size={20} />}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedSummaryType === 'beginner' ? 'default' : 'outline'}
            onClick={() => setSelectedSummaryType('beginner')}
            size="sm"
          >
            Beginner
          </Button>
          <Button
            variant={selectedSummaryType === 'intermediate' ? 'default' : 'outline'}
            onClick={() => setSelectedSummaryType('intermediate')}
            size="sm"
          >
            Intermediate
          </Button>
          <Button
            variant={selectedSummaryType === 'advanced' ? 'default' : 'outline'}
            onClick={() => setSelectedSummaryType('advanced')}
            size="sm"
          >
            Advanced
          </Button>
          <Button
            variant={selectedSummaryType === 'abstract' ? 'default' : 'outline'}
            onClick={() => setSelectedSummaryType('abstract')}
            size="sm"
          >
            Abstract
          </Button>
        </div>

        <div className="mb-8">
          {selectedSummaryType === 'abstract' ? (
            <MarkdownRenderer 
              content={`## Abstract\n\n${paper?.abstract || 'Abstract not available'}`} 
              className="text-gray-700"
              maxHeight="300px"
            />
          ) : (
            <MarkdownRenderer 
              content={paper?.summaries?.[selectedSummaryType] || `${selectedSummaryType} summary not available`} 
              className="text-gray-700"
              maxHeight="300px"
            />
          )}
        </div>
      </div>
      <div className="mt-8">
        <Button onClick={() => handleStepComplete(0)}>
          I've read the summary
        </Button>
      </div>
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
  
  const renderVideoExplanationStep = () => {
    if (isLoadingLearningItems) {
      return (
        <LearningStepCard 
          title="Video Explanation" 
          icon={<Video size={20} />}
        >
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse flex flex-col items-center">
              <Video size={32} className="text-blue-200 mb-4" />
              <p className="text-gray-400">Loading videos...</p>
            </div>
          </div>
        </LearningStepCard>
      );
    }
    
    if (videoItems.length === 0) {
      return (
        <LearningStepCard 
          title="Video Explanation" 
          icon={<Video size={20} />}
        >
          <p className="text-gray-700 mb-4">
            No videos available for this paper.
          </p>
        </LearningStepCard>
      );
    }
    
    // Get the first video item
    const videoItem = videoItems[0];
    const videos = videoItem.metadata.videos || [];
    
    return (
      <LearningStepCard 
        title="Video Explanation" 
        icon={<Video size={20} />}
      >
        <p className="text-gray-700 mb-4">
          Watch these videos to enhance your understanding:
        </p>
        
        {videos.length > 0 ? (
          <div className="space-y-6">
            {videos.map((video: VideoItem, index: number) => (
              <div key={index} className="mb-4">
                <VideoEmbed 
                  videoUrl={`https://www.youtube.com/watch?v=${video.video_id}`}
                  title={video.title}
                  className="mb-2"
                />
                <p className="text-sm text-gray-600">{video.channel}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No videos available in this item.</p>
        )}
        
        <Button onClick={() => handleStepComplete(2)} className="mt-4">
          I've watched the videos
        </Button>
      </LearningStepCard>
    );
  };
  
  const renderQuizStep = () => (
    <LearningStepCard 
      title="Comprehension Quiz" 
      icon={<Brain size={20} />}
    >
      <p className="text-gray-700 mb-4">
        Test your understanding of the Transformer architecture:
      </p>
      {paper?.quiz && paper.quiz.length > 0 ? (
        <MultipleChoiceQuiz
          questions={paper.quiz as QuizQuestion[]}
          onComplete={(score, total) => {
            if (score / total >= 0.7) {
              handleStepComplete(3);
            }
          }}
          className="mb-4"
        />
      ) : (
        <p className="text-gray-500 italic">Quiz loading...</p>
      )}
    </LearningStepCard>
  );
  
  const renderFlashcardsStep = () => (
    <LearningStepCard 
      title="Flashcards" 
      icon={<Layers size={20} />}
    >
      <p className="text-gray-700 mb-4">
        Solidify your understanding with these key concept flashcards:
      </p>
      {paper?.flashcards && paper.flashcards.length > 0 ? (
        <Flashcard
          cards={paper.flashcards as FlashcardData[]}
          onComplete={() => handleStepComplete(4)}
          className="mb-4"
        />
      ) : (
        <p className="text-gray-500 italic">Flashcards loading...</p>
      )}
    </LearningStepCard>
  );
  
  const renderSlidesStep = () => (
    <LearningStepCard 
      title="Visual Presentation" 
      icon={<Presentation size={20} />}
    >
      <p className="text-gray-700 mb-4">
        Review these slides summarizing the key findings and implications:
      </p>
      <GoogleSlidesEmbed 
        slideUrl="https://docs.google.com/presentation/d/e/2PACX-1vTiz3WLkAu4a1Qg2rWxLDk0GhE3ds-73zgdK2feYYc-zC7qaSyPHm7d37SlxYZ3IChgnckw-Qe_ku0s/pub?start=false&loop=false&delayms=3000"
        title="Transformer Architecture - Key Points"
        className="mb-4"
      />
      <Button onClick={() => handleStepComplete(5)}>
        I've reviewed the slides
      </Button>
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
        {paper?.relatedPapers && paper.relatedPapers.map((related: any) => (
          <div key={related.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h4 className="font-medium text-blue-600">{related.title}</h4>
            <p className="text-sm text-gray-500 mt-1">
              This paper builds upon concepts introduced in the Transformer.
            </p>
          </div>
        ))}
      </div>
      <Button onClick={() => handleStepComplete(7)}>
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
      <Button onClick={() => handleStepComplete(8)}>
        I'm ready for mastery
      </Button>
    </LearningStepCard>
  );

  const learningJourneySteps = [
    renderSummaryStep(),
    renderKeyConceptsStep(),
    renderVideoExplanationStep(),
    renderQuizStep(),
    renderFlashcardsStep(),
    renderSlidesStep(),
    renderRelatedPapersStep(),
    renderMasteryStep(),
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <Brain size={48} className="text-blue-200 mb-4" />
          <h2 className="text-xl font-medium text-gray-400 mb-2">Analyzing Paper...</h2>
          <p className="text-gray-400">Building your personalized learning journey</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full no-horizontal-overflow">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-2 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center overflow-hidden flex-shrink-0">
            <Button variant="ghost" size="icon" asChild className="mr-1 sm:mr-2 flex-shrink-0">
              <Link to="/dashboard">
                <ArrowLeft size={18} />
              </Link>
            </Button>
            <Link to="/" className="flex items-center flex-shrink-0">
              <Brain className="text-blue-600 mr-1 sm:mr-2" size={20} />
              <span className="font-bold hidden sm:inline">Paper Mastery</span>
            </Link>
          </div>
          
          <h1 className="text-sm sm:text-lg font-bold truncate text-center flex-1 mx-2">
            {paper?.title}
          </h1>
          
          <div className="md:hidden flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={togglePdfView}
              className="text-xs px-2 py-1 h-8"
            >
              {showPdf ? "Learning" : "PDF"}
            </Button>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <SkillLevelSidebar 
            skillLevel={skillLevel}
            isHorizontal={true} 
          />
        </div>
      </header>
      
      <main className="w-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 h-[calc(100vh-12rem)]">
          {(showPdf || window.innerWidth >= 768) && (
            <div className={`h-full ${!showPdf && window.innerWidth < 768 ? 'hidden' : ''} md:block`}>
              <PdfViewer pdfUrl={paper?.pdfUrl} className="h-full" />
            </div>
          )}
          
          {(!showPdf || window.innerWidth >= 768) && (
            <div className={`h-full p-2 sm:p-4 flex flex-col ${showPdf && window.innerWidth < 768 ? 'hidden' : ''} md:block`}>
              <LearningJourney
                steps={learningJourneySteps}
                onCompleteStep={handleStepComplete}
                paperTitle={paper?.title}
                paperId={id || ''}
                className="h-full"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaperDetails;
