import React, { useState, useEffect, useMemo } from 'react';
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

const PdfViewerCard = ({
  pdfUrl,
  paperId,
  title = "PDF Viewer",
  className,
  onHighlightAction
}: PdfViewerCardProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  
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
  
  // Force the PDF viewer to reload by incrementing the key
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setHasError(false); // Reset error state on retry
  };

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
        <EnhancedPdfHighlighter 
          pdfUrl={normalizedPdfUrl} 
          className="h-full" 
          paperId={paperId}
          onHighlightAction={onHighlightAction}
          key={`pdf-highlighter-${paperId || 'none'}-${retryCount}`}
        />
      </div>
    </Card>
  );
};

export default PdfViewerCard; 