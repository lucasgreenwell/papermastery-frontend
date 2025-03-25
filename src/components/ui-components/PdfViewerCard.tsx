import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import { FileText, Maximize, Minimize, RotateCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import EnhancedPdfHighlighter from './EnhancedPdfHighlighter';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PdfViewerCardProps {
  pdfUrl: string | null;
  paperId?: string;
  title?: string;
  className?: string;
  onHighlightAction?: (actionType: 'explain' | 'summarize', text: string) => void;
}

// Render the PDF highlighter only when necessary props change
const StablePdfHighlighter = memo(({ 
  pdfUrl, 
  paperId, 
  onHighlightAction,
  pdfHighlighterRef
}: { 
  pdfUrl: string | null; 
  paperId?: string; 
  onHighlightAction?: (actionType: 'explain' | 'summarize', text: string) => void;
  pdfHighlighterRef: React.RefObject<any>;
}) => {
  return (
    <EnhancedPdfHighlighter 
      ref={pdfHighlighterRef}
      pdfUrl={pdfUrl} 
      className="h-full" 
      paperId={paperId}
      onHighlightAction={onHighlightAction}
    />
  );
}, (prevProps, nextProps) => {
  // Only re-render when essential props change
  return (
    prevProps.pdfUrl === nextProps.pdfUrl && 
    prevProps.paperId === nextProps.paperId
  );
});

StablePdfHighlighter.displayName = 'StablePdfHighlighter';

// Use React.memo to prevent unnecessary re-renders
const PdfViewerCard = memo(({
  pdfUrl,
  paperId,
  title = "PDF Viewer",
  className,
  onHighlightAction
}: PdfViewerCardProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  // Create a ref for the PDF highlighter component
  const pdfHighlighterRef = useRef<{
    processPdfUrl: () => Promise<void>;
  } | null>(null);
  
  // Normalize arXiv URLs before passing to the PDF component
  const normalizedPdfUrl = useMemo(() => {
    if (!pdfUrl) return null;
    
    // Convert arXiv abstract URLs to PDF URLs
    if (pdfUrl.includes('arxiv.org/abs/')) {
      try {
        const arxivId = pdfUrl.split('arxiv.org/abs/')[1].split(/[?#]/)[0];
        const normalizedUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
        console.log('PdfViewerCard: Converting abstract URL to PDF URL:', normalizedUrl);
        return normalizedUrl;
      } catch (error) {
        console.error('Error normalizing arXiv URL:', error);
        return pdfUrl;
      }
    }
    
    return pdfUrl;
  }, [pdfUrl]);
  
  // Handle ESC key for exiting fullscreen
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isFullscreen]);
  
  // Listen for error events from the PDF component
  useEffect(() => {
    const handleErrorMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'pdf-error') {
        setHasError(true);
      }
      
      if (event.data && event.data.type === 'pdf-loaded') {
        setHasError(false);
      }
    };
    
    window.addEventListener('message', handleErrorMessage);
    
    return () => {
      window.removeEventListener('message', handleErrorMessage);
    };
  }, []);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Manually trigger the PDF reload by calling the component's processPdfUrl method
  const handleRetry = () => {
    if (pdfHighlighterRef.current && pdfHighlighterRef.current.processPdfUrl) {
      pdfHighlighterRef.current.processPdfUrl();
      console.log('Manually triggered PDF reload');
    } else {
      console.warn('PDF Highlighter ref not available for reload');
      // Fallback to the old method if the ref approach doesn't work
      setRetryCount(prev => prev + 1);
    }
    setHasError(false); // Reset error state on retry
  };

  // Use useMemo to create a single stable instance of the PDF highlighter
  const pdfHighlighter = useMemo(() => (
    <StablePdfHighlighter
      pdfUrl={normalizedPdfUrl}
      paperId={paperId}
      onHighlightAction={onHighlightAction}
      pdfHighlighterRef={pdfHighlighterRef}
    />
  ), [normalizedPdfUrl, paperId, onHighlightAction]);

  return (
    <Card className={cn(
      "w-full h-full flex flex-col overflow-hidden relative",
      isFullscreen ? "fixed inset-0 z-50 rounded-none" : "",
      className
    )}>
      <div className="flex items-center justify-between py-4 pl-4 pr-2 border-b border-gray-100">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="text-blue-600 flex-shrink-0">
            <FileText size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 truncate">
            {title}
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={cn(
                    "transition-colors p-1 rounded hover:bg-gray-100",
                    hasError 
                      ? "text-amber-500 hover:text-amber-600 animate-pulse" 
                      : "text-gray-500 hover:text-blue-600"
                  )}
                  onClick={handleRetry}
                  aria-label="Reload PDF"
                >
                  {hasError ? <AlertTriangle size={16} /> : <RotateCw size={16} />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {hasError ? "Error loading PDF - Click to try again" : "Reload PDF"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="text-gray-500 hover:text-blue-600 transition-colors p-1 rounded hover:bg-gray-100"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {pdfHighlighter}
      </div>
    </Card>
  );
});

// Display name for React DevTools
PdfViewerCard.displayName = 'PdfViewerCard';

export default PdfViewerCard; 