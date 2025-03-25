import React, { useState, useEffect } from 'react';
import { FileText, Maximize, Minimize } from 'lucide-react';
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
  className?: string;
  paperId?: string;
  onHighlightAction?: (actionType: 'explain' | 'summarize', text: string) => void;
  title?: string;
}

const PdfViewerCard = ({ 
  pdfUrl, 
  className,
  paperId,
  onHighlightAction,
  title = "Paper PDF"
}: PdfViewerCardProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle ESC key for exiting fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Apply body scroll lock when in fullscreen
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card className={cn(
      "bg-white border border-gray-200 shadow-sm h-full flex flex-col transition-all duration-300",
      isFullscreen && "fixed inset-0 z-50 rounded-none border-none",
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
        <div className="flex items-center">
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
          pdfUrl={pdfUrl} 
          className="h-full" 
          paperId={paperId}
          onHighlightAction={onHighlightAction}
        />
      </div>
    </Card>
  );
};

export default PdfViewerCard; 