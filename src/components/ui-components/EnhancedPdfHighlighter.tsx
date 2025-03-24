import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  PdfHighlighter,
  PdfLoader,
  AreaHighlight as PdfAreaHighlight
} from 'react-pdf-highlighter-extended';
import type { Highlight as PdfHighlightType } from 'react-pdf-highlighter-extended';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import { cn } from '@/lib/utils';
import ErrorBoundary from './ErrorBoundary';
import { Button } from '@/components/ui/button';
import { paperHighlightAPI } from '@/lib/api/paperHighlight';
import { toast } from 'sonner';
import { papersAPI } from '@/services/papersAPI';

interface EnhancedPdfHighlighterProps {
  pdfUrl: string | null;
  className?: string;
  paperId?: string;
  onHighlightAction?: (actionType: 'explain' | 'summarize', text: string) => void;
}

// Define custom types to match the expected structure
type Position = {
  boundingRect: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
    pageNumber: number;
  };
  rects: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
  }>;
  pageNumber: number;
};

type Content = {
  text: string;
  image?: string;
};

type IHighlight = {
  id: string;
  position: Position;
  content: Content;
  comment?: {
    text: string;
    emoji?: string;
  };
};

// Custom component for highlighting
const Highlight: React.FC<{
  position: Position;
  isScrolledTo?: boolean;
  comment?: { text: string; emoji?: string };
}> = ({ position, isScrolledTo }) => {
  return (
    <div
      className={`
        absolute 
        bg-yellow-200 
        opacity-30 
        cursor-pointer
        ${isScrolledTo ? 'ring-2 ring-blue-500' : ''}
      `}
      style={{
        left: position.boundingRect.x1,
        top: position.boundingRect.y1,
        width: position.boundingRect.width,
        height: position.boundingRect.height,
      }}
    />
  );
};

// Custom Popup component for highlights
const Popup: React.FC<{
  children: React.ReactNode;
  popupContent: React.ReactNode;
  onMouseOver: (content: React.ReactNode) => void;
  onMouseOut: () => void;
}> = ({ children, popupContent, onMouseOver, onMouseOut }) => {
  return (
    <div
      className="relative"
      onMouseOver={() => onMouseOver(popupContent)}
      onMouseOut={onMouseOut}
    >
      {children}
    </div>
  );
};

// Configure the PDF worker
const PDFJS_VERSION = '4.4.168'; // Match the version in package.json

// Set worker source to local file - this avoids CORS issues
const configurePdfWorker = () => {
  try {
    // Primary source - local file
    const localWorkerUrl = `/pdf-worker/pdf.worker.min.mjs`;
    GlobalWorkerOptions.workerSrc = localWorkerUrl;
    console.log('PDF.js worker configured with local file:', localWorkerUrl);
    
    // Set up error handling for worker loading
    window.addEventListener('error', (event) => {
      const errorMsg = event.message || '';
      // Check if the error is related to the PDF worker
      if (errorMsg.includes('pdf.worker') || (event.filename && event.filename.includes('pdf.worker'))) {
        console.warn('Error loading PDF worker from local file, trying fallback CDN...');
        // Fallback to CDN if local file fails
        const fallbackWorkerUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
        GlobalWorkerOptions.workerSrc = fallbackWorkerUrl;
        console.log('PDF.js worker configured with fallback CDN:', fallbackWorkerUrl);
      }
    }, { once: true });
  } catch (error) {
    console.error('Failed to configure PDF.js worker:', error);
  }
};

// Initialize the worker
configurePdfWorker();

// Helper to generate unique IDs for highlights
const getNextId = () => String(Math.random()).slice(2);

// Parse highlight ID from URL hash
const parseIdFromHash = () => {
  const hash = window.location.hash;
  return hash ? hash.slice("#highlight-".length) : null;
};

// Reset hash
const resetHash = () => {
  window.location.hash = "";
};

// Highlight popup component
const HighlightPopup = ({ comment }: { comment?: { text: string; emoji?: string } }) => {
  if (!comment || !comment.text) return null;
  
  return (
    <div className="p-2 bg-white rounded-md shadow-md border border-gray-200 max-w-sm">
      {comment.emoji && <span className="mr-1">{comment.emoji}</span>}
      <span>{comment.text}</span>
    </div>
  );
};

// Custom Tip component - the library doesn't export this component
const PdfTip: React.FC<{
  onOpen: () => void;
  onConfirm: (action: { type: 'explain' | 'summarize', text: string }) => void;
  highlightedText: string;
  isProcessing?: boolean;
  actionTaken?: string;
  onClose?: () => void;
}> = ({ onOpen, onConfirm, highlightedText, isProcessing = false, actionTaken, onClose }) => {
  // Call onOpen when the component mounts
  useEffect(() => {
    onOpen();
  }, [onOpen]);

  // Make a copy of the text to ensure we don't lose it when selection is cleared
  const textCopy = useMemo(() => highlightedText, [highlightedText]);
  
  return (
    <div className="bg-white p-3 rounded-md shadow-lg border border-gray-200 max-w-sm">
      <div className="flex justify-between items-start mb-2">
        <strong className="text-sm text-gray-600">Selected text:</strong>
        {onClose && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              // Force clear selection when closing
              window.getSelection()?.removeAllRanges();
              onClose();
            }} 
            className="p-0 h-6 w-6 rounded-full"
          >
            ✕
          </Button>
        )}
      </div>
      
      <p className="mt-1 italic line-clamp-2 text-sm text-gray-600 mb-3">{textCopy}</p>
      
      {actionTaken ? (
        <div className="mb-2 text-sm">
          <div className="flex items-center text-blue-600">
            <span className="mr-1">
              {actionTaken === 'explain' ? '🧠' : '📝'}
            </span>
            <span>
              {actionTaken === 'explain' ? 'Explanation' : 'Summary'} sent to chat
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Check the chat panel for results
          </p>
        </div>
      ) : (
        <div className="flex justify-between items-center mt-2">
          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Clear selection immediately
                window.getSelection()?.removeAllRanges();
                // Call onConfirm with the copied text
                onConfirm({ type: 'explain', text: textCopy });
              }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Explain'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Clear selection immediately
                window.getSelection()?.removeAllRanges();
                // Call onConfirm with the copied text
                onConfirm({ type: 'summarize', text: textCopy });
              }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Summarize'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom HighlightContainer component
const HighlightContainer: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => {
  // This component would normally receive props like editHighlight and onContextMenu
  // and use them to manage highlights
  
  return (
    <div className="HighlightContainer">
      {children}
    </div>
  );
};

const EnhancedPdfHighlighter = ({ 
  pdfUrl, 
  className, 
  paperId,
  onHighlightAction 
}: EnhancedPdfHighlighterProps) => {
  const [highlights, setHighlights] = useState<IHighlight[]>([]);
  const scrollViewerTo = useRef<(highlight: PdfHighlightType) => void>(() => {});
  const [ghostHighlight, setGhostHighlight] = useState<PdfHighlightType | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [isProcessingHighlight, setIsProcessingHighlight] = useState(false);
  const [lastActionTaken, setLastActionTaken] = useState<'explain' | 'summarize' | null>(null);
  const selectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [processedPdfUrl, setProcessedPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [tooltipManuallyClosed, setTooltipManuallyClosed] = useState(false);
  
  // Function to scroll to a highlight based on URL hash
  const scrollToHighlightFromHash = useCallback(() => {
    const highlightId = parseIdFromHash();
    if (!highlightId) return;
    
    const highlight = highlights.find(h => h.id === highlightId);
    if (highlight) {
      scrollViewerTo.current(highlight as unknown as PdfHighlightType);
    }
  }, [highlights]);
  
  // Listen for hash changes to scroll to the right highlight
  useEffect(() => {
    window.addEventListener("hashchange", scrollToHighlightFromHash, false);
    return () => {
      window.removeEventListener("hashchange", scrollToHighlightFromHash, false);
    };
  }, [scrollToHighlightFromHash]);
  
  // Add document click listener to clear selection when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // If clicking outside the PDF container or if a highlight is being processed,
      // clear any selection
      if (
        isProcessingHighlight || 
        !pdfContainerRef.current?.contains(e.target as Node)
      ) {
        handleCloseTooltip();
      }
    };
    
    document.addEventListener('click', handleDocumentClick);
    
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [isProcessingHighlight]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, []);
  
  // Add a new highlight
  const addHighlight = (highlight: {
    content: Content;
    position: Position; 
    comment?: { text: string; emoji?: string }
  }) => {
    console.log("Adding highlight:", highlight);
    setHighlights([...highlights, { ...highlight, id: getNextId() }]);
  };
  
  // Add a temporary ghost highlight during selection
  const handleGhostHighlight = (ghostHighlight: PdfHighlightType) => {
    setGhostHighlight(ghostHighlight);
  };
  
  // Update an existing highlight
  const updateHighlight = (
    highlightId: string,
    position: Partial<Position>,
    content: Partial<Content>
  ) => {
    console.log("Updating highlight:", highlightId, position, content);
    setHighlights(
      highlights.map(h => {
        if (h.id !== highlightId) return h;
        
        return {
          ...h,
          position: { ...h.position, ...position },
          content: { ...h.content, ...content }
        };
      })
    );
  };
  
  // Handle closing the tooltip manually
  const handleCloseTooltip = () => {
    // Set flag that tooltip was manually closed
    setTooltipManuallyClosed(true);
    
    // More aggressive cleanup to ensure tooltip closes
    window.getSelection()?.removeAllRanges();
    
    // Use setTimeout to ensure this runs after any click events
    setTimeout(() => {
      setGhostHighlight(null);
      setSelectedText('');
      setLastActionTaken(null);
      
      // Reset after a delay
      setTimeout(() => {
        setTooltipManuallyClosed(false);
      }, 500);
    }, 0);
    
    // Reset any pending selection timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
      selectionTimeoutRef.current = null;
    }
    
    // Clear any cached highlight action to prevent double processing
    try {
      const cachedAction = sessionStorage.getItem('highlight_action');
      if (cachedAction) {
        console.log('Clearing cached highlight action from session storage');
        sessionStorage.removeItem('highlight_action');
      }
    } catch (error) {
      console.error('Error clearing cached highlight action:', error);
    }
  };

  // Handle explain or summarize action
  const handleExplainOrSummarize = async (action: { type: 'explain' | 'summarize', text: string }) => {
    if (!paperId) {
      console.error('No paper ID available for API call');
      toast.error('Unable to process highlight: Missing paper ID');
      return;
    }
    
    if (!action.text.trim()) {
      console.error('No text selected for highlight action');
      toast.error('Please select text to explain or summarize');
      return;
    }

    // First, aggressively clear tooltip and selection
    handleCloseTooltip();
    window.getSelection()?.removeAllRanges();
    
    // Set processing state to prevent tooltip from showing and block duplicate requests
    setIsProcessingHighlight(true);
    
    // Create a record of what's being processed
    const processToken = Date.now().toString();
    
    // Create a standardized highlight action object
    const highlightAction = {
      type: action.type,
      text: action.text,
      paperId: paperId,
      timestamp: Date.now(),
      highlighted_text: action.text,
      highlight_type: action.type,
      process_token: processToken
    };
    
    console.log(`Processing ${action.type} action with text:`, action.text.substring(0, 100) + (action.text.length > 100 ? '...' : ''));
    
    // Store in session storage to communicate with ChatInterface
    sessionStorage.setItem('highlight_action', JSON.stringify(highlightAction));
    
    // Trigger the callback to open the chat view immediately
    if (onHighlightAction) {
      console.log(`Calling onHighlightAction with ${action.type} for paper ${paperId}`);
      onHighlightAction(action.type, action.text);
    }
    
    // IMPORTANT: Add highlight to document if needed
    if (ghostHighlight) {
      const newHighlight = {
        content: ghostHighlight.content as Content,
        position: ghostHighlight.position as unknown as Position,
        comment: { 
          text: `${action.type === 'explain' ? '🧠 Explaining' : '📝 Summarizing'} this text`,
          emoji: action.type === 'explain' ? '🧠' : '📝'
        }
      };
      addHighlight(newHighlight);
    }
    
    // Set state to show action was taken
    setLastActionTaken(action.type);
    
    // IMPORTANT: Make the API call here to ensure it happens
    try {
      if (action.type === 'explain') {
        console.log(`Making direct API call to explain text for paper ${paperId}`);
        
        try {
          const response = await paperHighlightAPI.explainText(paperId, action.text, processToken);
          console.log("Explanation response received directly:", {
            processToken,
            responseType: typeof response,
            hasExplanation: !!response.explanation,
            hasResponse: !!response.response
          });
          
          // No need to show toast here, ChatInterface will do this
          
        } catch (apiError) {
          console.error("Direct API call to explain text failed:", apiError);
          // Only show error toast if it's a direct error
          toast.error("Failed to get explanation. Please try again.");
        }
      } else {
        console.log(`Making direct API call to summarize text for paper ${paperId}`);
        
        try {
          const response = await paperHighlightAPI.summarizeText(paperId, action.text, processToken);
          console.log("Summary response received directly:", {
            processToken,
            responseType: typeof response,
            hasSummary: !!response.summary,
            hasResponse: !!response.response
          });
          
          // No need to show toast here, ChatInterface will do this
          
        } catch (apiError) {
          console.error("Direct API call to summarize text failed:", apiError);
          // Only show error toast if it's a direct error
          toast.error("Failed to get summary. Please try again.");
        }
      }
    } catch (error) {
      console.error(`Error during direct ${action.type} operation:`, error);
    }

    // Force clearing selection one more time after a short delay
    setTimeout(() => {
      window.getSelection()?.removeAllRanges();
      setSelectedText('');
      setGhostHighlight(null);
      
      // Reset processing state after a longer delay to ensure tooltip doesn't reappear
      setTimeout(() => {
        setIsProcessingHighlight(false);
      }, 300);
    }, 50);
  };
  
  // Function to process ArXiv URLs and avoid CORS issues
  useEffect(() => {
    const processPdfUrl = async () => {
      if (!pdfUrl) return;
      
      try {
        // Check if it's an ArXiv URL that needs to be processed
        if (pdfUrl.includes('arxiv.org')) {
          console.log('Processing ArXiv URL to avoid CORS:', pdfUrl);
          setIsLoadingPdf(true);
          
          try {
            // Use the existing API to get a CORS-friendly URL
            const response = await papersAPI.getPdfUrl(pdfUrl);
            
            if (response.pdf_url) {
              console.log('Using proxy URL for ArXiv PDF:', response.pdf_url);
              setProcessedPdfUrl(response.pdf_url);
            } else if (response.url) {
              console.log('Using proxy URL for ArXiv PDF:', response.url);
              setProcessedPdfUrl(response.url);
            } else {
              // Fallback to direct URL but warn about CORS issues
              console.warn('No proxy URL returned, using direct URL (CORS issues likely):', pdfUrl);
              setProcessedPdfUrl(pdfUrl);
            }
          } catch (error) {
            console.error('Error getting proxy URL for ArXiv PDF:', error);
            // Fall back to direct URL as a last resort
            setProcessedPdfUrl(pdfUrl);
          } finally {
            setIsLoadingPdf(false);
          }
        } else {
          // For non-ArXiv URLs, use directly
          setProcessedPdfUrl(pdfUrl);
        }
      } catch (error) {
        console.error('Error processing PDF URL:', error);
        setProcessedPdfUrl(pdfUrl);
        setIsLoadingPdf(false);
      }
    };
    
    processPdfUrl();
  }, [pdfUrl]);
  
  // Simple validation of the URL
  const isValidUrl = useMemo(() => {
    if (!processedPdfUrl) return false;
    
    try {
      new URL(processedPdfUrl);
      return true;
    } catch (e) {
      console.error('Invalid PDF URL:', e);
      return false;
    }
  }, [processedPdfUrl]);
  
  if (isLoadingPdf) {
    return (
      <div className={cn("flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100", className)}>
        <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">Processing PDF URL to avoid CORS issues...</p>
        </div>
      </div>
    );
  }
  
  if (!processedPdfUrl || !isValidUrl) {
    return (
      <div className={cn("flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100", className)}>
        <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">
            {!processedPdfUrl ? 'No PDF available' : 'Invalid PDF URL'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={cn("flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100", className)}
      ref={pdfContainerRef}
    >
      <ErrorBoundary>
        <div className="flex-1 overflow-hidden relative">
          <PdfLoader 
            document={processedPdfUrl}
            beforeLoad={(progress) => (
              <div className="p-4 text-center">
                <p>Loading PDF... {progress.loaded ? Math.round(progress.loaded / progress.total * 100) : 0}%</p>
              </div>
            )}
            onError={(error: Error) => (
              <div className="p-4 text-center">
                <p className="text-red-500 font-medium">Error loading PDF</p>
                <p className="text-sm text-gray-600 mt-2">{error.message}</p>
                <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-left overflow-auto max-h-36">
                  <p className="font-mono">URL: {processedPdfUrl}</p>
                  <p className="font-mono">Error: {error.toString()}</p>
                </div>
              </div>
            )}
          >
            {pdfDocument => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={(event) => event.altKey}
                onScrollAway={resetHash}
                selectionTip={
                  selectedText && ghostHighlight && !isProcessingHighlight && !tooltipManuallyClosed ? (
                    <PdfTip 
                      onOpen={() => {}}
                      highlightedText={selectedText}
                      onConfirm={(action) => {
                        // Immediately block tooltip reappearance
                        setIsProcessingHighlight(true);
                        
                        // Call the actual handler (which will clear selection)
                        handleExplainOrSummarize(action);
                      }}
                      isProcessing={isProcessingHighlight}
                      actionTaken={lastActionTaken}
                      onClose={() => {
                        // Force tooltip closing - this is important
                        handleCloseTooltip();
                      }}
                    />
                  ) : null
                }
                highlights={highlights as unknown as PdfHighlightType[]}
                utilsRef={(utils) => {
                  scrollViewerTo.current = utils.scrollToHighlight;
                  scrollToHighlightFromHash();
                }}
                onSelection={(selection) => {
                  // Don't process selection if we're already processing a highlight
                  if (isProcessingHighlight) {
                    return;
                  }
                  
                  // Clear any existing timeout
                  if (selectionTimeoutRef.current) {
                    clearTimeout(selectionTimeoutRef.current);
                  }
                  
                  // Clear previous selection state immediately
                  setSelectedText('');
                  setGhostHighlight(null);
                  setLastActionTaken(null);
                  
                  // Add a small delay to ensure selection is complete
                  selectionTimeoutRef.current = setTimeout(() => {
                    // Extract the selected text
                    const content = selection.content;
                    const text = content?.text?.trim() || '';
                    
                    if (text) {
                      console.log("Selected text:", text);
                      setSelectedText(text);
                      
                      // Create ghost highlight
                      const newGhostHighlight = selection.makeGhostHighlight();
                      handleGhostHighlight(newGhostHighlight as unknown as PdfHighlightType);
                    } else {
                      console.log("Empty selection detected");
                    }
                  }, 50); // Small delay to ensure selection is fully captured
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  overflow: 'auto'
                }}
              >
                <HighlightContainer>
                  {/* The highlight rendering will be handled through the HighlightContainer */}
                </HighlightContainer>
              </PdfHighlighter>
            )}
          </PdfLoader>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default EnhancedPdfHighlighter; 