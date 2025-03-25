import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  PdfHighlighter,
  PdfLoader,
  AreaHighlight as PdfAreaHighlight,
} from 'react-pdf-highlighter-extended';
import type { Highlight as PdfHighlightType } from 'react-pdf-highlighter-extended';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import { cn } from '@/lib/utils';
import ErrorBoundary from './ErrorBoundary';
import { Button } from '@/components/ui/button';
import { paperHighlightAPI } from '@/lib/api/paperHighlight';
import { toast } from 'sonner';
import { papersAPI } from '@/services/papersAPI';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getCachedPdf, cachePdf } from '@/utils/cacheUtils';
import { isArxivUrl } from '@/utils/urlUtils';
import { env } from '@/config/env';
import { createRoot } from 'react-dom/client';

// Helper function to check if a URL is valid
const isValidUrl = (url: string): boolean => {
  try {
    // Handle relative URLs (starting with /) by prepending a dummy origin
    const urlToTest = url.startsWith('/') ? `http://example.com${url}` : url;
    new URL(urlToTest);
    return true;
  } catch (e) {
    return false;
  }
};

interface EnhancedPdfHighlighterProps {
  pdfUrl: string | null;
  className?: string;
  paperId?: string;
  onHighlightAction?: (actionType: 'explain' | 'summarize', text: string) => void;
  onAddHighlight?: (highlight: IHighlight) => void;
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

// Simple component for popup 
const Popup: React.FC<{
  children: React.ReactNode;
  popupContent: React.ReactNode;
  onMouseDown?: (event: React.MouseEvent) => boolean;
  onTouchStart?: (event: React.TouchEvent) => boolean;
  hideTipAndSelection?: () => void;
}> = ({ children, popupContent, onMouseDown, onTouchStart, hideTipAndSelection }) => {
  return (
    <div className="relative">
      <div className="absolute bottom-0 left-0 rounded shadow-lg z-10 bg-white">
        {popupContent}
      </div>
      <div
        onMouseDown={onMouseDown ? (e) => onMouseDown(e) && false : undefined}
        onTouchStart={onTouchStart ? (e) => onTouchStart(e) && false : undefined}
      >
        {children}
      </div>
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

// Simple component for highlight popup
const HighlightPopup = ({ onConfirm }: { onConfirm: () => void }) => (
  <div className="p-2">
    <Button
      onClick={() => onConfirm()}
      className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1"
    >
      Save
    </Button>
  </div>
);

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

// Define the Supabase storage bucket for papers
const PAPERS_BUCKET = 'papers';

const EnhancedPdfHighlighter = ({ 
  pdfUrl, 
  className, 
  paperId,
  onHighlightAction,
  onAddHighlight
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
  const [isCheckingCache, setIsCheckingCache] = useState(false);
  const [loadingState, setLoadingState] = useState({ state: 'idle', message: '' });
  const [retryAttempt, setRetryAttempt] = useState(0);
  const pdfScaleValue = "page-width";
  
  // Move the useCallback outside the render to avoid React hook nesting error
  const utilsCallback = useCallback((utils: any) => {
    // Store the scrollViewerTo function if it exists
    if (utils && utils.scrollTo) {
      scrollViewerTo.current = utils.scrollTo;
    }
  }, []);
  
  // Create our custom selection tip as a memoized component to avoid rerenders
  const selectionTipComponent = useMemo(() => {
    return (content: string, trigger: () => void, hide: () => void) => (
      <div className="bg-white p-3 rounded-md shadow-lg border border-gray-200">
        <p className="mt-1 italic line-clamp-2 text-sm text-gray-600 mb-3">
          {content}
        </p>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (onHighlightAction) {
                onHighlightAction('explain', content);
              }
              hide();
            }}
          >
            Explain
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (onHighlightAction) {
                onHighlightAction('summarize', content);
              }
              hide();
            }}
          >
            Summarize
          </Button>
        </div>
      </div>
    );
  }, [onHighlightAction]);
  
  // Function to scroll to a highlight based on URL hash
  const scrollToHighlightFromHash = useCallback(() => {
    const hash = window.location.hash?.substring(1);
    if (!hash || !highlights) return;
    
    const highlight = highlights.find(h => h.id === hash);
    if (highlight && scrollViewerTo.current) {
      // Convert our highlight type to the format the library expects
      const convertedHighlight = {
        ...highlight,
        position: {
          ...highlight.position,
          // Ensure rects have pageNumber property required by the library
          rects: highlight.position.rects.map(rect => ({
            ...rect,
            pageNumber: highlight.position.pageNumber
          }))
        }
      };
      scrollViewerTo.current(convertedHighlight as PdfHighlightType);
    }
  }, [highlights]);
  
  // Reset URL hash when user scrolls away from a highlight
  const resetHash = useCallback(() => {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);
  
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
  
  /**
   * Tests if a URL is accessible and returns a valid PDF
   */
  const testPdfUrlAccessibility = async (url: string): Promise<boolean> => {
    try {
      const uniqueId = Math.random().toString(36).substring(2, 10);
      console.log(`[PDF-Test-${uniqueId}] Testing PDF URL accessibility: ${url}`);
      
      // For static file paths from our backend, use GET and check for PDF signature
      if (url.includes('/static/proxied_pdfs/')) {
        try {
          // Make sure we're using the correct port for backend URLs
          let urlToTest = url;
          
          // Check if the URL contains localhost with a port that's not 8000
          if (url.includes('localhost:') && !url.includes('localhost:8000') && url.includes('/static/proxied_pdfs/')) {
            // Replace the port with 8000 (backend port)
            urlToTest = url.replace(/localhost:\d+/, 'localhost:8000');
            console.log(`[PDF-Test-${uniqueId}] Corrected URL port to backend port: ${urlToTest}`);
          }
          
          // Get the first few bytes to check for PDF signature
          const response = await fetch(urlToTest, {
            method: 'GET',
            headers: { 'Range': 'bytes=0-8' }
          });
          
          if (!response.ok) {
            console.warn(`[PDF-Test-${uniqueId}] URL fetch failed with status: ${response.status}`);
            return false;
          }
          
          // Get the buffer and check for PDF signature
          const buffer = await response.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          // PDF signature is "%PDF-1." (in hex: 25 50 44 46 2D 31 2E)
          const isPdf = bytes.length >= 7 && 
                         bytes[0] === 0x25 && bytes[1] === 0x50 && 
                         bytes[2] === 0x44 && bytes[3] === 0x46 && 
                         bytes[4] === 0x2D && bytes[5] === 0x31 && 
                         bytes[6] === 0x2E;
          
          console.log(`[PDF-Test-${uniqueId}] URL test result:`, {
            status: response.status,
            isPdf: isPdf,
            bytesReceived: bytes.length
          });
          
          return isPdf;
        } catch (err) {
          console.error(`[PDF-Test-${uniqueId}] Error checking PDF signature:`, err);
          return false;
        }
      } else {
        // For external URLs, try HEAD request first
        const response = await fetch(url, { method: 'HEAD' });
        const contentType = response.headers.get('Content-Type') || '';
        
        console.log(`[PDF-Test-${uniqueId}] URL test result:`, {
          status: response.status,
          contentType: contentType
        });
        
        return response.ok && /pdf|octet-stream/.test(contentType.toLowerCase());
      }
    } catch (error) {
      console.error('Error testing URL accessibility:', error);
      return false;
    }
  };

  // Function to handle the PDF processing
  const processPdfUrl = useCallback(async () => {
    if (!pdfUrl) {
      console.error('No PDF URL provided');
      setLoadingState({ state: 'error', message: 'No PDF URL provided' });
      return;
    }

    try {
      // Start with loading state
      setLoadingState({ state: 'loading', message: 'Processing PDF URL...' });
      console.log('Processing PDF URL:', pdfUrl);

      // Normalize the URL (e.g., arXiv abstract URL to PDF URL)
      let normalizedUrl = pdfUrl;
      if (isArxivUrl(pdfUrl) && pdfUrl.includes('arxiv.org/abs/')) {
        const arxivId = pdfUrl.split('arxiv.org/abs/')[1].split(/[?#]/)[0];
        normalizedUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
        console.log('Normalized arXiv URL:', normalizedUrl);
      }

      // Determine if we should use the server proxy
      // For arXiv URLs, we usually need the server proxy to avoid CORS issues
      const useServerProxy = isArxivUrl(normalizedUrl) || 
                             !normalizedUrl.startsWith('http');
      
      // If we decide to use the server proxy, send the request
      if (useServerProxy) {
        try {
          setLoadingState({ state: 'loading', message: 'Fetching from server proxy...' });
          const processStartTime = Date.now();
          const proxyRequestId = Math.random().toString(36).substring(2, 8);
          
          console.log(`[${proxyRequestId}] Sending to server proxy:`, { 
            normalizedUrl, paperId 
          });
          
          // Send the normalized URL to the server proxy
          const proxyResponse = await papersAPI.getServerProxyPdfUrl(normalizedUrl, paperId);
          
          // Check if proxy response contains a valid URL
          if (proxyResponse && proxyResponse.url) {
            const proxyUrl = proxyResponse.url;
            console.log(`[${proxyRequestId}] Server proxy returned URL:`, proxyUrl);
            
            // Convert relative URLs to absolute URLs if needed
            let fullProxyUrl = proxyUrl;
            if (proxyUrl.startsWith('/')) {
              // Use backend URL from environment config, not window.location.origin
              fullProxyUrl = `${env.API_URL}${proxyUrl}`;
              console.log(`[${proxyRequestId}] Converted relative URL to absolute using backend URL:`, fullProxyUrl);
            }
            
            // Test if the proxy URL is accessible and returns a valid PDF
            const isAccessible = await testPdfUrlAccessibility(fullProxyUrl);
            
            if (isAccessible) {
              console.log(`[${proxyRequestId}] Proxy URL is accessible and valid, using it`);
              setProcessedPdfUrl(fullProxyUrl);
              
              // Cache the proxy URL if we have a paper ID
              if (paperId) {
                console.log(`[${proxyRequestId}] Caching proxy URL for paper ${paperId}`);
                await cachePdf(fullProxyUrl, paperId, 'url');
              }
              
              setLoadingState({ state: 'success', message: 'PDF loaded successfully' });
              const processEndTime = Date.now();
              console.log(`[${proxyRequestId}] PDF processing completed in ${processEndTime - processStartTime}ms`);
              return;
            } else {
              console.warn(`[${proxyRequestId}] Proxy URL is not accessible or not a valid PDF, falling back to cached URL`);
            }
          }
          
          // If we get here, the proxy failed or returned an invalid URL
          console.warn(`[${proxyRequestId}] Server proxy failed or returned invalid URL, using cached URL`);
          setProcessedPdfUrl(normalizedUrl);
          setLoadingState({ state: 'success', message: 'Using direct URL' });
          
        } catch (error) {
          console.error('Error using server proxy:', error);
          // Set the PDF URL to the cached URL as a fallback
          setProcessedPdfUrl(normalizedUrl);
          setLoadingState({ state: 'success', message: 'Using direct URL after error' });
        }
      } else {
        // Use the cached URL directly
        console.log('Using cached PDF URL directly:', normalizedUrl);
        setProcessedPdfUrl(normalizedUrl);
        setLoadingState({ state: 'success', message: 'Using direct URL' });
      }
    } catch (error) {
      console.error('Error processing PDF URL:', error);
      setLoadingState({ 
        state: 'error', 
        message: `Failed to process PDF URL: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }, [pdfUrl, paperId, setProcessedPdfUrl]);

  // Process the PDF URL when the component mounts or when the URL changes
  useEffect(() => {
    processPdfUrl();
  }, [processPdfUrl]);

  // Handle retry for loading a PDF
  const handleRetry = async () => {
    if (!processedPdfUrl) {
      console.error('No PDF URL to retry');
      return;
    }

    // Normalize URL if it's an arXiv abstract
    let urlToUse = processedPdfUrl;
    if (isArxivUrl(processedPdfUrl) && processedPdfUrl.includes('arxiv.org/abs/')) {
      const arxivId = processedPdfUrl.split('arxiv.org/abs/')[1].split(/[?#]/)[0];
      urlToUse = `https://arxiv.org/pdf/${arxivId}.pdf`;
      console.log('Normalized arXiv URL for retry:', urlToUse);
    }
    
    try {
      setLoadingState({ state: 'loading', message: 'Retrying with server proxy...' });
      const retryRequestId = Math.random().toString(36).substring(2, 8);
      
      console.log(`[${retryRequestId}] Retrying with server proxy:`, {
        urlToUse,
        paperId,
        attempt: retryAttempt + 1
      });
      
      // Always try the server proxy on retry
      const proxyResponse = await papersAPI.getServerProxyPdfUrl(urlToUse, paperId);
      
      if (proxyResponse && proxyResponse.url) {
        let proxyUrl = proxyResponse.url;
        console.log(`[${retryRequestId}] Server proxy returned URL:`, proxyUrl);
        
        // Convert relative URLs to absolute URLs if needed
        if (proxyUrl.startsWith('/')) {
          // Use backend URL from environment config, not window.location.origin
          proxyUrl = `${env.API_URL}${proxyUrl}`;
          console.log(`[${retryRequestId}] Converted relative URL to absolute using backend URL:`, proxyUrl);
        }
        
        // Test if the proxy URL is accessible and returns a valid PDF
        const isAccessible = await testPdfUrlAccessibility(proxyUrl);
        
        if (isAccessible) {
          console.log(`[${retryRequestId}] Proxy URL is accessible and valid, using it`);
          setProcessedPdfUrl(proxyUrl);
          
          // Cache the proxy URL if we have a paper ID
          if (paperId) {
            console.log(`[${retryRequestId}] Caching proxy URL for paper ${paperId}`);
            await cachePdf(proxyUrl, paperId, 'url');
          }
          
          setLoadingState({ state: 'success', message: 'PDF loaded successfully' });
          setRetryAttempt(retryAttempt + 1);
          return;
        } else {
          console.warn(`[${retryRequestId}] Proxy URL is not accessible or not a valid PDF, trying fallback methods`);
        }
      }
      
      // If server proxy fails, try using CORS proxy as fallback
      const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(urlToUse)}`;
      console.log(`[${retryRequestId}] Using CORS proxy fallback:`, corsProxyUrl);
      
      setProcessedPdfUrl(corsProxyUrl);
      setLoadingState({ state: 'success', message: 'Using CORS proxy' });
      setRetryAttempt(retryAttempt + 1);
      
    } catch (error) {
      console.error('Retry failed:', error);
      
      // Last resort - use a public CORS proxy
      const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(urlToUse)}`;
      console.log('Using public CORS proxy as last resort:', corsProxyUrl);
      
      setProcessedPdfUrl(corsProxyUrl);
      setLoadingState({ state: 'success', message: 'Using fallback CORS proxy' });
      setRetryAttempt(retryAttempt + 1);
    }
  };
  
  // Add document click listener to clear selection when clicking outside
  useEffect(() => {
    // Listen for hash changes to scroll to the right highlight
    window.addEventListener("hashchange", scrollToHighlightFromHash, false);

    return () => {
      window.removeEventListener("hashchange", scrollToHighlightFromHash, false);
    };
  }, [scrollToHighlightFromHash]);

  // Handle adding a new highlight
  const handleAddHighlight = useCallback((highlight: IHighlight) => {
    if (onAddHighlight) {
      onAddHighlight(highlight);
    }
  }, [onAddHighlight]);

  // Handle clicking on a highlight
  const handleHighlightClick = useCallback((highlight: IHighlight) => {
    // Update URL hash to reference this highlight
    window.location.hash = highlight.id;
  }, []);

  if (loadingState.state === 'loading') {
    return (
      <div className={cn("flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100", className)}>
        <div className="flex-1 overflow-auto p-4 bg-gray-50 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">{loadingState.message}</p>
          <p className="text-xs text-gray-500 mt-1">This may take a moment</p>
        </div>
      </div>
    );
  }
  
  if (!processedPdfUrl || !isValidUrl(processedPdfUrl)) {
    return (
      <div className={cn("flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100", className)}>
        <div className="flex-1 overflow-auto p-4 bg-gray-50 flex flex-col items-center justify-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load PDF</h3>
          <p className="text-gray-600 text-center mb-4 max-w-md">
            We encountered an error while trying to load the PDF. 
            The URL might be invalid or the source may be unavailable.
          </p>
          <div className="text-sm text-gray-500 bg-gray-100 p-2 rounded-md mb-4 w-full max-w-md overflow-hidden">
            <strong>URL:</strong> {
              processedPdfUrl?.startsWith('/') 
                ? `${env.API_URL}${processedPdfUrl.length > 80 
                    ? `${processedPdfUrl.substring(0, 80)}...` 
                    : processedPdfUrl}`
                : processedPdfUrl?.length > 80 
                  ? `${processedPdfUrl.substring(0, 80)}...` 
                  : processedPdfUrl
            }
          </div>
          <Button 
            onClick={handleRetry}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry with Server Proxy
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      <PdfLoader 
        document={{
          url: processedPdfUrl.startsWith('/') 
            ? `${env.API_URL}${processedPdfUrl}` 
            : processedPdfUrl,
          withCredentials: false, // Don't send cookies with cross-origin requests
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/cmaps/',
          cMapPacked: true,
        }}
        beforeLoad={() => (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">Loading PDF document...</p>
          </div>
        )}
        errorMessage={(error) => (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Loading Error</h3>
            <p className="text-gray-600 text-center mb-4 max-w-md">
              The PDF document couldn't be loaded. It may be corrupted or in an unsupported format.
            </p>
            <Button 
              onClick={handleRetry}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry with Different Method
            </Button>
          </div>
        )}
      >
        {(pdfDocument) => (
          <PdfHighlighter
            pdfDocument={pdfDocument}
            enableAreaSelection={(event) => event.altKey}
            onScrollAway={resetHash}
            pdfScaleValue={pdfScaleValue}
            utilsRef={utilsCallback}
            // Add a selection tip component
            selectionTip={selectionTipComponent}
            onSelection={(selection) => {
              // Call our highlight action handler for the selected text
              console.log('Text selected:', selection.content.text);
              return null;
            }}
            highlightTransform={(
              highlight,
              index,
              setTip,
              hideTip,
              viewportToScaled,
              screenshot,
              isScrolledTo
            ) => {
              // Ignore the screenshot param which isn't needed
              return (
                <PdfAreaHighlight
                  isScrolledTo={isScrolledTo}
                  highlight={highlight}
                  onChange={() => {
                    // Dummy onChange function for AreaHighlight
                    // We're not allowing edits in this implementation
                  }}
                  onContextMenu={() => {
                    // Handle click via context menu instead
                    handleHighlightClick(highlight as IHighlight);
                  }}
                />
              );
            }}
            highlights={highlights.map(highlight => ({
              ...highlight,
              position: {
                ...highlight.position,
                // Ensure rects have pageNumber property required by the library
                rects: highlight.position.rects.map(rect => ({
                  ...rect,
                  pageNumber: highlight.position.pageNumber
                }))
              }
            }))}
          />
        )}
      </PdfLoader>
    </div>
  );
};

export default EnhancedPdfHighlighter; 