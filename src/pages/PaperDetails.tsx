import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PdfViewer from '@/components/ui-components/PdfViewer';
import SkillLevelSidebar from '@/components/ui-components/SkillLevelSidebar';
import LearningJourney from '@/components/ui-components/LearningJourney';
import {
  SummaryStep,
  KeyConceptsStep,
  MethodologyStep,
  ResultsStep,
  VideoExplanationStep,
  QuizStep,
  FlashcardsStep,
  RelatedPapersStep,
  MasteryStep,
  ConsultingStep
} from '@/components/learning-steps';
import { usePaperDetails } from '@/hooks/usePaperDetails';
import { useSkillLevel } from '@/hooks/useSkillLevel';

const PaperDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { skillLevel, handleStepComplete } = useSkillLevel(0);
  const { 
    paper, 
    isLoading, 
    videoItems, 
    quizItems, 
    flashcardItems, 
    keyConceptsItems,
    methodologyItems,
    resultsItems,
    isLoadingLearningItems 
  } = usePaperDetails(id || '');
  
  const [showPdf, setShowPdf] = useState(true);
  
  // Add state for cached content
  const [cachedContent, setCachedContent] = useState<string | File | null>(null);
  const [contentType, setContentType] = useState<'url' | 'file' | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check if we have cached content from navigation state
    if (location.state?.cachedContent) {
      setCachedContent(location.state.cachedContent);
      setContentType(location.state.contentType);
    } else {
      // Try to restore from localStorage
      const storedType = localStorage.getItem(`paper_${id}_content_type`);
      if (storedType === 'url') {
        const storedUrl = localStorage.getItem(`paper_${id}_content`);
        if (storedUrl) {
          setCachedContent(storedUrl);
          setContentType('url');
        }
      }
    }
  }, [id, location]);

  // Create memoized PDF source that prioritizes cached content
  const pdfSource = useMemo(() => {
    if (paper?.pdf_url || paper?.source_url) {
      // Paper is processed, use the actual PDF URL from Supabase
      // Clear localStorage once we have the actual paper data
      if (id) {
        localStorage.removeItem(`paper_${id}_content`);
        localStorage.removeItem(`paper_${id}_content_type`);
      }
      return paper.pdf_url || paper.source_url;
    } else if (cachedContent) {
      // Paper is still processing, use cached content
      if (contentType === 'url') {
        return cachedContent as string;
      } else if (contentType === 'file') {
        // Create temporary URL for the file
        return URL.createObjectURL(cachedContent as File);
      }
    }
    return null;
  }, [paper, cachedContent, contentType, id]);

  // Clean up object URLs when they're no longer needed
  useEffect(() => {
    return () => {
      // Clean up any created object URLs when component unmounts
      if (contentType === 'file' && pdfSource && pdfSource.startsWith('blob:')) {
        URL.revokeObjectURL(pdfSource);
      }
    };
  }, [contentType, pdfSource]);
  
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
  
  const togglePdfView = () => {
    setShowPdf(!showPdf);
  };

  const learningJourneySteps = [
    <SummaryStep 
      key="summary-step"
      paper={paper} 
      onComplete={() => handleStepComplete(0)} 
    />,
    <KeyConceptsStep 
      key="key-concepts-step"
      data={keyConceptsItems.length > 0 ? keyConceptsItems[0] : undefined}
      isLoading={isLoadingLearningItems}
      onComplete={() => handleStepComplete(1)} 
    />,
    <MethodologyStep 
      key="methodology-step"
      data={methodologyItems.length > 0 ? methodologyItems[0] : undefined}
      isLoading={isLoadingLearningItems}
      onComplete={() => handleStepComplete(2)} 
    />,
    <ResultsStep 
      key="results-step"
      data={resultsItems.length > 0 ? resultsItems[0] : undefined}
      isLoading={isLoadingLearningItems}
      onComplete={() => handleStepComplete(3)} 
    />,
    <VideoExplanationStep 
      key="video-explanation-step"
      videoItems={videoItems} 
      isLoading={isLoadingLearningItems} 
      onComplete={() => handleStepComplete(4)} 
    />,
    <QuizStep 
      key="quiz-step"
      quizItems={quizItems} 
      isLoading={isLoadingLearningItems} 
      onComplete={() => handleStepComplete(5)} 
    />,
    <FlashcardsStep 
      key="flashcards-step"
      flashcardItems={flashcardItems} 
      isLoading={isLoadingLearningItems} 
      onComplete={() => handleStepComplete(6)} 
    />,
    <RelatedPapersStep 
      key="related-papers-step"
      paper={paper} 
      onComplete={() => handleStepComplete(7)} 
    />,
    <MasteryStep 
      key="mastery-step"
      onComplete={() => handleStepComplete(8)} 
    />,
    <ConsultingStep
      key="consulting-step"
      paperId={id || ''}
      onComplete={() => handleStepComplete(8)}
    />,
  ];

  if (isLoading && !cachedContent) {
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
            {paper?.title || "Processing..."}
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
        <div className="grid grid-cols-1 md:grid-cols-2 h-[calc(100vh-12rem)] overflow-hidden">
          {(showPdf || window.innerWidth >= 768) && (
            <div className={`h-full ${!showPdf ? 'hidden md:block' : ''}`}>
              <PdfViewer pdfUrl={pdfSource} className="h-full" />
            </div>
          )}
          
          {(!showPdf || window.innerWidth >= 768) && (
            <div className={`h-full p-2 sm:p-4 flex flex-col overflow-hidden ${showPdf ? 'hidden md:block' : ''}`}>
              <LearningJourney
                steps={learningJourneySteps}
                onCompleteStep={handleStepComplete}
                paperTitle={paper?.title || "Processing..."}
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
