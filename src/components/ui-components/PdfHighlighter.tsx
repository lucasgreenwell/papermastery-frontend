import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { 
  PdfLoader, 
  PdfHighlighter as ReactPdfHighlighter,
  Highlight as PdfHighlightType
} from 'react-pdf-highlighter-extended';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

// Import from pdfjs-dist
import { GlobalWorkerOptions } from 'pdfjs-dist';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { papersAPI } from '@/services/papersAPI';
import { highlightsAPI, HighlightResponse } from '@/services/highlightsAPI';
import { api } from '@/services/apiClient';
import { PaperResponse } from '@/services/types';
import ErrorBoundary from './ErrorBoundary';

// Feature flag to disable API calls during development
// Set these to false when the backend endpoints are ready
const DISABLE_HIGHLIGHT_API = true;
const DISABLE_ARXIV_API = false; // Enable API calls to get Supabase URLs for arXiv links

// Configure the PDF worker
// The worker must be loaded from the same origin or CORS-enabled location
// We serve the worker file locally from our public directory
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

// Additional debugging for document loading
const logPdfInfo = (pdfUrl: string): void => {
  console.log('Attempting to load PDF with URL:', pdfUrl);
  
  try {
    const url = new URL(pdfUrl);
    console.log('URL protocol:', url.protocol);
    console.log('URL hostname:', url.hostname);
    console.log('URL pathname:', url.pathname);
    console.log('URL search params:', url.search);
  } catch (e) {
    console.error('Failed to parse URL:', e);
  }
};

// Supabase storage configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_BUCKET = 'papers'; // The bucket name where PDFs are stored

// Helper function to build the complete PDF URL for Supabase storage
const buildPdfUrl = (filename: string): string => {
  const completeUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${filename}`;
  console.log(`Building Supabase URL: '${filename}' → '${completeUrl}'`);
  return completeUrl;
};

// Position and rectangle types for highlights
export interface BoundingRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  pageNumber: number;
}

export interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  pageNumber?: number;
}

// Custom TypeScript interfaces for highlights
export interface IHighlight {
  id: string;
  content: {
    text: string;
    image?: string;
  };
  position: {
    boundingRect: BoundingRect;
    rects: Rect[];
    pageNumber: number;
  };
  comment?: string;
}

interface PdfHighlighterProps {
  pdfUrl: string | null;
  className?: string;
  paperId?: string;
}

// Type for new highlight data
interface NewHighlight {
  content: {
    text: string;
  };
  position: {
    boundingRect: BoundingRect;
    rects: Rect[];
    pageNumber: number;
  };
  comment: string;
  id: string;
}

// Custom Highlight component for future phases
export const Highlight: React.FC<{
  position: {
    boundingRect: BoundingRect;
    rects: Rect[];
    pageNumber: number;
  };
  onClick?: () => void;
  isScrolledTo?: boolean;
}> = ({ position, onClick, isScrolledTo }) => {
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
      onClick={onClick}
    />
  );
};

// Custom AreaHighlight component for future phases
export const AreaHighlight: React.FC<{
  highlight: IHighlight;
  onChange?: (boundingRect: BoundingRect) => void;
  isScrolledTo?: boolean;
}> = ({ highlight, onChange, isScrolledTo }) => {
  return (
    <div
      className={`
        absolute 
        bg-blue-200 
        opacity-30 
        cursor-pointer
        ${isScrolledTo ? 'ring-2 ring-blue-500' : ''}
      `}
      style={{
        left: highlight.position.boundingRect.x1,
        top: highlight.position.boundingRect.y1,
        width: highlight.position.boundingRect.width,
        height: highlight.position.boundingRect.height,
      }}
      onClick={() => onChange?.(highlight.position.boundingRect)}
    />
  );
};

// Custom Tip component for future phases
export const Tip: React.FC<{
  position: { left: number; top: number };
  onHighlight: () => void;
  onSummarize: () => void;
  onExplain: () => void;
  onCancel: () => void;
}> = ({ position, onHighlight, onSummarize, onExplain, onCancel }) => {
  return (
    <div 
      style={{
        position: "absolute",
        left: position.left,
        top: position.top,
      }}
      className="bg-white p-2 rounded shadow-lg border border-gray-200 z-50"
    >
      <p className="text-sm mb-2">What would you like to do?</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onHighlight}>
          Highlight
        </Button>
        <Button size="sm" variant="secondary" onClick={onSummarize}>
          Summarize
        </Button>
        <Button size="sm" variant="secondary" onClick={onExplain}>
          Explain
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

const parseIdFromHash = () => {
  const hash = window.location.hash?.slice('#highlight-'.length);
  return hash || null;
};

const resetHash = () => {
  window.location.hash = '';
};

const PdfHighlighter = ({ pdfUrl, className, paperId }: PdfHighlighterProps) => {
  const [highlights, setHighlights] = useState<IHighlight[]>([]);
  const [scrollToHighlightId, setScrollToHighlightId] = useState<string | null>(null);
  const [currentHighlight, setCurrentHighlight] = useState<NewHighlight | null>(null);
  const [showTip, setShowTip] = useState<boolean>(false);
  const [tipPosition, setTipPosition] = useState<{ left: number; top: number } | null>(null);
  const [supabasePdfUrl, setSupabasePdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState<boolean>(false);

  // Clean up stored URLs on unmount
  const storedPdfUrl = useRef<string | null>(null);
  
  // Load existing highlights if we have a paperId
  useEffect(() => {
    const loadHighlights = async () => {
      if (!paperId) return;
      if (DISABLE_HIGHLIGHT_API) return; // Skip API call if feature flag is enabled
      
      try {
        setIsLoadingHighlights(true);
        const loadedHighlights = await highlightsAPI.getHighlights(paperId);
        
        // Convert from API format to react-pdf-highlighter format
        const convertedHighlights = loadedHighlights.map((h: HighlightResponse): IHighlight => ({
          id: h.id,
          content: { text: h.text },
          position: JSON.parse(h.position),
          comment: ''
        }));
        
        setHighlights(convertedHighlights);
      } catch (error) {
        console.error('Error loading highlights:', error);
      } finally {
        setIsLoadingHighlights(false);
      }
    };
    
    loadHighlights();
  }, [paperId]);
  
  // Handle getting PDF URL
  useEffect(() => {
    const getPdfUrl = async () => {
      // If we don't have a URL or paperId, we can't proceed
      if (!pdfUrl && !paperId) {
        console.log("No PDF URL or paperId available");
        return;
      }
      
      setIsLoadingPdf(true);
      
      try {
        let response;
        let finalUrl = null;
        
        // Prioritize paperId if available - this is the recommended approach
        if (paperId) {
          console.log("Getting PDF URL using paperId:", paperId);
          
          try {
            // First get the paper details to find the arxivId
            const paperResponse = await api.get<PaperResponse>(`/papers/${paperId}`);
            console.log("Paper details:", paperResponse);
            
            const arxivId = paperResponse.arxiv_id;
            console.log("Extracted arXiv ID from paper:", arxivId);
            
            if (!arxivId) {
              throw new Error("Paper has no arXiv ID");
            }
            
            // Use the endpoint directly with the arxiv_id parameter
            console.log("Getting PDF filename for arXiv ID:", arxivId);
            const pdfUrlResponse = await api.get('/papers/pdf-url', {
              params: {
                arxiv_id: arxivId
              }
            });
            
            console.log("PDF filename response:", pdfUrlResponse);
            response = pdfUrlResponse;
          } catch (error) {
            console.error("Error during paper details or PDF URL retrieval:", error);
            throw error;
          }
        } 
        // Fallback to using the pdfUrl directly if it's an arXiv URL
        else if (pdfUrl && (pdfUrl.includes('arxiv.org') || pdfUrl.includes('doi.org'))) {
          console.log("Fetching Supabase URL for arXiv URL:", pdfUrl);
          
          // Create a timeout promise to handle API timeouts
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('API request timed out')), 30000)
          );
          
          // Race the API call against the timeout
          const fetchStart = Date.now();
          response = await Promise.race([
            papersAPI.getPdfUrl(pdfUrl),
            timeoutPromise
          ]) as { pdf_url?: string, url?: string };
          
          console.log(`API call took ${Date.now() - fetchStart}ms`);
          console.log('API response:', response);
        } else {
          // For non-arXiv URLs, use directly
          console.log("Not an arXiv URL, using directly:", pdfUrl);
          finalUrl = pdfUrl;
        }
        
        // Process the API response if we have one
        if (response) {
          // Handle different response formats
          if (response.pdf_url) {
            // Standard format
            finalUrl = response.pdf_url;
            console.log('Successfully retrieved Supabase PDF URL:', finalUrl);
          } else if (response.url) {
            // Alternative format - might just be a filename without full URL
            const url = response.url;
            console.log('Retrieved PDF filename:', url);
            
            // Check if it's a full URL or just a filename
            if (url.startsWith('http')) {
              finalUrl = url;
            } else {
              // Use our helper function to build the Supabase URL
              finalUrl = buildPdfUrl(url);
              console.log('Constructed Supabase storage URL:', finalUrl);
            }
          }
        }
        
        // Verify and set the URL
        if (finalUrl && finalUrl.startsWith('http')) {
          setSupabasePdfUrl(finalUrl);
        } else {
          console.error('Invalid URL from backend:', finalUrl);
          setSupabasePdfUrl(null);
        }
      } catch (error) {
        console.error('Error getting PDF URL from backend:', error);
        // Clear any previous URL since we can't use it
        setSupabasePdfUrl(null);
      } finally {
        setIsLoadingPdf(false);
      }
    };
    
    getPdfUrl();
  }, [pdfUrl, paperId]);
  
  // Process the final PDF URL to use
  const processedPdfUrl = useMemo(() => {
    if (supabasePdfUrl) {
      console.log('Using Supabase PDF URL:', supabasePdfUrl);
      
      // Ensure the URL is properly encoded
      try {
        // Parse and re-encode to ensure proper formatting
        const parsedUrl = new URL(supabasePdfUrl);
        return parsedUrl.toString();
      } catch (e) {
        console.error('Error parsing Supabase URL:', e);
        return supabasePdfUrl; // Fall back to the original URL
      }
    }
    
    if (!pdfUrl) {
      console.log('No PDF URL available');
      return null;
    }
    
    // Only return direct URLs if they don't contain arxiv.org
    if (pdfUrl.includes('arxiv.org')) {
      console.warn('Attempting to use arXiv URL directly, may cause CORS issues:', pdfUrl);
    }
    
    // Ensure the URL is properly encoded
    try {
      // Parse and re-encode to ensure proper formatting
      const parsedUrl = new URL(pdfUrl);
      return parsedUrl.toString();
    } catch (e) {
      console.error('Error parsing original URL:', e);
      return pdfUrl; // Fall back to the original URL
    }
  }, [pdfUrl, supabasePdfUrl]);
  
  // Is the URL a valid one we can display?
  const hasValidUrl = useMemo(() => {
    if (!processedPdfUrl) return false;
    
    // Log processed URL for debugging
    console.log('Final PDF URL being used:', processedPdfUrl);
    
    // Basic URL validation
    try {
      // Make sure it's a string
      if (typeof processedPdfUrl !== 'string') {
        console.error('ProcessedPdfUrl is not a string:', processedPdfUrl);
        return false;
      }
      
      // Empty strings are not valid
      if (processedPdfUrl.trim() === '') {
        console.error('ProcessedPdfUrl is an empty string');
        return false;
      }
      
      // Check if it's a valid URL
      new URL(processedPdfUrl);
      
      // Check for valid URL scheme
      if (!processedPdfUrl.startsWith('http://') && 
          !processedPdfUrl.startsWith('https://')) {
        console.error('URL has invalid scheme:', processedPdfUrl);
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Invalid URL:', processedPdfUrl, e);
      return false;
    }
  }, [processedPdfUrl]);

  // Handle scrolling to a highlight
  const scrollToHighlight = useCallback(
    (highlightId: string) => {
      setScrollToHighlightId(highlightId);
    },
    []
  );

  // Add a new highlight
  const addHighlight = async (highlight: NewHighlight) => {
    // Add to local state regardless of API
    setHighlights([...highlights, highlight as IHighlight]);
    
    // Skip API call if feature flag is enabled or no paperId
    if (DISABLE_HIGHLIGHT_API || !paperId) {
      console.log('Highlight API disabled or no paperId - storing highlight locally only');
      setShowTip(false);
      setTipPosition(null);
      setCurrentHighlight(null);
      return;
    }
    
    try {
      // Format the highlight for the API
      const highlightData = {
        paper_id: paperId,
        text: highlight.content.text,
        page_number: highlight.position.pageNumber,
        position: JSON.stringify(highlight.position)
      };
      
      // Save to API
      const savedHighlight = await highlightsAPI.saveHighlight(highlightData);
      
      // Update local state with the returned ID
      const updatedHighlights = [...highlights];
      const index = updatedHighlights.findIndex(h => h.id === highlight.id);
      
      if (index !== -1) {
        updatedHighlights[index] = {
          ...highlight,
          id: savedHighlight.id
        } as IHighlight;
        
        setHighlights(updatedHighlights);
      }
    } catch (error) {
      console.error('Error saving highlight:', error);
      // Highlight is already added to local state above
    } finally {
      // Clear tip state
      setShowTip(false);
      setTipPosition(null);
      setCurrentHighlight(null);
    }
  };

  if (!processedPdfUrl || (pdfUrl?.includes('arxiv.org') && !supabasePdfUrl)) {
    return (
      <div className={cn("flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100", className)}>
        <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center flex-col">
          <p className="text-gray-500 mb-2">Unable to load PDF</p>
          {pdfUrl && (pdfUrl.includes('arxiv.org') || pdfUrl.includes('doi.org')) && (
            <div className="text-center max-w-md">
              <p className="text-sm text-amber-600 mb-2">
                PDF could not be loaded from storage.
              </p>
              <p className="text-xs text-gray-600">
                The PDF may not have been uploaded to storage yet or the backend service 
                could not retrieve a valid PDF URL. Please ensure the arXiv ID is valid 
                and that the backend service is running correctly.
              </p>
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-left overflow-auto max-h-24">
                <p className="font-mono">Original URL: {pdfUrl}</p>
                <p className="font-mono">Paper ID: {paperId || 'Not provided'}</p>
                {!DISABLE_ARXIV_API && <p className="font-mono text-red-500">Backend API call failed. Check console for details.</p>}
                {DISABLE_ARXIV_API && <p className="font-mono text-amber-500">Backend API calls are disabled. Enable by setting DISABLE_ARXIV_API to false.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoadingPdf) {
    return (
      <div className={cn("flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100", className)}>
        <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100", className)}>
      <div className="flex-1 overflow-auto bg-gray-50 relative">
        {hasValidUrl ? (
          // Use document prop instead of url for the PdfLoader component
          <ErrorBoundary>
            <>
              {/* Log PDF info before loading */}
              {(() => { logPdfInfo(processedPdfUrl); return null; })()}
              <PdfLoader 
                document={processedPdfUrl}
                workerSrc={GlobalWorkerOptions.workerSrc}
                beforeLoad={(progress) => (
                  <div className="p-4 text-center">
                    <p>Loading PDF... {Math.round(progress.loaded / progress.total * 100) || 0}%</p>
                  </div>
                )}
                onError={(error: Error) => {
                  console.error("Error loading PDF:", error, "URL:", processedPdfUrl);
                  
                  // Get the detailed error name and message
                  const errorDetails = error.toString();
                  const isNoUrlError = errorDetails.includes("no `url` parameter provided");
                  
                  return (
                    <div className="p-4 text-center">
                      <p className="text-red-500 font-medium">Error loading PDF</p>
                      <p className="text-sm text-gray-600 mt-2">
                        {error.message || "Please check that the URL is valid or try a different PDF"}
                      </p>
                      {isNoUrlError && (
                        <p className="text-sm text-orange-600 mt-2">
                          The PDF.js library is expecting a URL parameter.
                          This might be a version compatibility issue.
                        </p>
                      )}
                      <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-left overflow-auto max-h-36">
                        <p className="font-mono">URL: {processedPdfUrl}</p>
                        <p className="font-mono">Error: {errorDetails}</p>
                        <p className="font-mono">Document type: {typeof processedPdfUrl}</p>
                        <p className="font-mono">Paper ID: {paperId || 'Not provided'}</p>
                        <p className="font-mono">PDF.js worker version: {PDFJS_VERSION}</p>
                      </div>
                    </div>
                  );
                }}
              >
                {(pdfDocument: PDFDocumentProxy) => (
                  <ReactPdfHighlighter
                    pdfDocument={pdfDocument}
                    enableAreaSelection={(event: MouseEvent) => event.altKey}
                    // @ts-ignore - Library type definitions are incorrect
                    onSelectionFinished={(
                      position,
                      content,
                      hideTipAndSelection,
                      transformSelection
                    ) => {
                      // Create the highlight object
                      const highlight = {
                        content,
                        position,
                        comment: "",
                        id: Math.random().toString(16).slice(2)
                      };
                      
                      // Update state for the tip
                      setCurrentHighlight(highlight);
                      setTipPosition({
                        left: position.boundingRect.x1,
                        top: position.boundingRect.y1,
                      });
                      setShowTip(true);
                    }}
                    // @ts-ignore - Library type definitions are incorrect
                    highlights={highlights}
                  />
                )}
              </PdfLoader>
            </>
          </ErrorBoundary>
        ) : (
          <div className="p-4 text-center">
            <p className="text-red-500">Invalid PDF URL</p>
            <p className="text-sm text-gray-600 mt-2">
              The PDF URL is invalid or could not be processed.
            </p>
          </div>
        )}
        
        {/* Custom Tooltip for adding highlights */}
        {showTip && tipPosition && (
          <Tip
            position={tipPosition}
            onHighlight={() => {
              if (currentHighlight) {
                addHighlight(currentHighlight);
              }
            }}
            onSummarize={() => {
              // Will be implemented in future phases
              console.log('Summarize clicked');
              if (currentHighlight) {
                addHighlight(currentHighlight);
              }
            }}
            onExplain={() => {
              // Will be implemented in future phases
              console.log('Explain clicked');
              if (currentHighlight) {
                addHighlight(currentHighlight);
              }
            }}
            onCancel={() => {
              setShowTip(false);
              setTipPosition(null);
              setCurrentHighlight(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PdfHighlighter; 