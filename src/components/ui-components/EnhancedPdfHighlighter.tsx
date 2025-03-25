import React, { useState, useEffect, useCallback, useRef, useMemo, ReactNode, forwardRef, useImperativeHandle, memo } from 'react';
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

// Export the interface for the ref
export interface EnhancedPdfHighlighterRef {
  processPdfUrl: () => Promise<void>;
}

// Define a proper interface for the utils object
interface PdfHighlighterUtils {
  scrollTo?: (highlight: PdfHighlightType) => void;
  [key: string]: unknown; // More specific than any
}

// Define proper props for the selection tip component
interface SelectionTipProps {
  onConfirm: () => void;
  content: { text: string };
}

// Create a standard function component for the selection tip
// IMPORTANT: Define this OUTSIDE the main component to prevent re-creation
// This is crucial because the library likely expects a component constructor
function SelectionTip(props: SelectionTipProps) {
  console.log('SelectionTip rendering with props:', props);
  const { onConfirm, content } = props;
  const text = content.text;
  
  return (
    <div className="bg-white p-3 rounded-md shadow-lg border border-gray-200">
      <p className="mt-1 italic line-clamp-2 text-sm text-gray-600 mb-3">
        {text}
      </p>
      <div className="flex space-x-2">
        <button
          className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-sm"
          onClick={() => {
            console.log('Explain button clicked');
            // We don't have direct access to onHighlightAction here
            // Instead we'll use a custom event
            const customEvent = new CustomEvent('highlight-action', {
              detail: {
                type: 'explain',
                text
              },
              bubbles: true
            });
            document.dispatchEvent(customEvent);
            onConfirm();
          }}
        >
          Explain
        </button>
        <button
          className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded text-sm"
          onClick={() => {
            console.log('Summarize button clicked');
            // We don't have direct access to onHighlightAction here
            // Instead we'll use a custom event
            const customEvent = new CustomEvent('highlight-action', {
              detail: {
                type: 'summarize',
                text
              },
              bubbles: true
            });
            document.dispatchEvent(customEvent);
            onConfirm();
          }}
        >
          Summarize
        </button>
      </div>
    </div>
  );
}

// Add displayName for debugging purposes
SelectionTip.displayName = 'SelectionTip';

// Interface for the tooltip selection props from the library
interface TooltipSelectionProps {
  content: { text: string };
  onConfirm: () => void;
}

// Define a React class component for the selection tooltip
// The library appears to expect a class component instead of a function component
class TooltipSelection extends React.Component<TooltipSelectionProps> {
  render() {
    const { content, onConfirm } = this.props;
    console.log('TooltipSelection class rendering:', content);
    
    return (
      <div className="bg-white p-3 rounded-md shadow-lg border border-gray-200">
        <p className="mt-1 italic line-clamp-2 text-sm text-gray-600 mb-3">
          {content.text}
        </p>
        <div className="flex space-x-2">
          <button
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-sm"
            onClick={() => {
              console.log('Explain button clicked');
              // Create and dispatch custom event
              const customEvent = new CustomEvent('highlight-action', {
                detail: {
                  type: 'explain',
                  text: content.text
                },
                bubbles: true
              });
              document.dispatchEvent(customEvent);
              onConfirm();
            }}
          >
            Explain
          </button>
          <button
            className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded text-sm"
            onClick={() => {
              console.log('Summarize button clicked');
              // Create and dispatch custom event
              const customEvent = new CustomEvent('highlight-action', {
                detail: {
                  type: 'summarize',
                  text: content.text
                },
                bubbles: true
              });
              document.dispatchEvent(customEvent);
              onConfirm();
            }}
          >
            Summarize
          </button>
        </div>
      </div>
    );
  }
}

// This function creates a DOM structure for the selection tip
const createTooltipElement = (content: { text: string }, onConfirm: () => void) => {
  // Create tooltip container
  const container = document.createElement('div');
  container.className = 'bg-white p-3 rounded-md shadow-lg border border-gray-200';
  
  // Add text paragraph
  const paragraph = document.createElement('p');
  paragraph.className = 'mt-1 italic line-clamp-2 text-sm text-gray-600 mb-3';
  paragraph.textContent = content.text || '';
  container.appendChild(paragraph);
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'flex space-x-2';
  
  // Add explain button
  const explainButton = document.createElement('button');
  explainButton.className = 'px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-sm';
  explainButton.textContent = 'Explain';
  explainButton.style.marginRight = '8px';
  explainButton.onclick = () => {
    console.log('Explain button clicked');
    const customEvent = new CustomEvent('highlight-action', {
      detail: {
        type: 'explain',
        text: content.text || ''
      },
      bubbles: true
    });
    document.dispatchEvent(customEvent);
    onConfirm();
  };
  buttonContainer.appendChild(explainButton);
  
  // Add summarize button
  const summarizeButton = document.createElement('button');
  summarizeButton.className = 'px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded text-sm';
  summarizeButton.textContent = 'Summarize';
  summarizeButton.onclick = () => {
    console.log('Summarize button clicked');
    const customEvent = new CustomEvent('highlight-action', {
      detail: {
        type: 'summarize',
        text: content.text || ''
      },
      bubbles: true
    });
    document.dispatchEvent(customEvent);
    onConfirm();
  };
  buttonContainer.appendChild(summarizeButton);
  
  // Add button container to tooltip
  container.appendChild(buttonContainer);
  
  return container;
};

// Special factory function that returns the tip element creation function
const tipPlugin = {
  mouseAdapter: () => null,
  touchAdapter: () => null,
  renderTip: (props: any) => {
    console.log('renderTip called with props:', props);
    
    // Check if content and onConfirm exist in props
    if (props?.content?.text && typeof props.onConfirm === 'function') {
      return createTooltipElement(props.content, props.onConfirm);
    }
    
    // Fallback div if props are missing
    const fallbackDiv = document.createElement('div');
    fallbackDiv.textContent = 'Select text to explain or summarize';
    return fallbackDiv;
  }
};

// A proper tooltip component based on the library's examples
const SelectionTooltip: React.FC = () => {
  console.log('SelectionTooltip rendering');
  
  // Add useEffect to ensure text is loaded into the tooltip
  useEffect(() => {
    // Try to update the selected text display
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString() || '';
      
      console.log('Selection tooltip text check:', text ? text.substring(0, 30) + '...' : 'none');
      
      // If there's text but the tooltip text isn't set, try to set it
      if (text && text.trim()) {
        const textElement = document.getElementById('selected-text');
        if (textElement && (!textElement.textContent || textElement.textContent.trim() === '')) {
          console.log('Updating tooltip text element with selection text');
          textElement.textContent = text;
        }
      }
    }, 50);
  }, []);
  
  return (
    <div className="Tip" style={{ 
      background: 'white', 
      padding: '0.75rem', 
      borderRadius: '0.375rem', 
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 
      border: '1px solid rgba(209, 213, 219, 1)',
      maxWidth: '20rem'
    }}>
      <p style={{ 
        fontStyle: 'italic', 
        fontSize: '0.875rem', 
        color: 'rgba(75, 85, 99, 1)', 
        marginTop: '0rem',
        marginBottom: '0.5rem',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        <span id="selected-text"></span>
      </p>
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem',
        marginTop: '-0.25rem',
        marginBottom: '0.25rem'
      }}>
        <button
          onClick={() => {
            // Get the selected text from the DOM (library should have set this)
            const textElement = document.getElementById('selected-text');
            const selectedText = textElement?.textContent || '';
            
            // If no text in the tooltip element, grab from selection
            let textToExplain = selectedText;
            if (!textToExplain || textToExplain.trim() === '') {
              const selection = window.getSelection();
              textToExplain = selection?.toString() || '';
              
              // Log selection issue for troubleshooting
              console.log('Tooltip text element was empty, using selection instead:', 
                textToExplain ? textToExplain.substring(0, 30) + '...' : 'none found');
            }
            
            if (!textToExplain || textToExplain.trim() === '') {
              console.error('No text to explain');
              toast.error('No text selected to explain');
              return;
            }
            
            console.log('Explain button clicked for text:', textToExplain.substring(0, 50) + '...');
            
            // Dispatch the custom event for handling the explain action
            const customEvent = new CustomEvent('highlight-action', {
              detail: {
                type: 'explain',
                text: textToExplain
              },
              bubbles: true
            });
            document.dispatchEvent(customEvent);
          }}
          style={{
            padding: '0.25rem 0.75rem',
            backgroundColor: 'rgba(219, 234, 254, 1)',
            color: 'rgba(29, 78, 216, 1)',
            borderRadius: '0.25rem',
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Explain
        </button>
        <button
          onClick={() => {
            // Get the selected text from the DOM (library should have set this)
            const textElement = document.getElementById('selected-text');
            const selectedText = textElement?.textContent || '';
            
            // If no text in the tooltip element, grab from selection
            let textToSummarize = selectedText;
            if (!textToSummarize || textToSummarize.trim() === '') {
              const selection = window.getSelection();
              textToSummarize = selection?.toString() || '';
              
              // Log selection issue for troubleshooting
              console.log('Tooltip text element was empty, using selection instead:', 
                textToSummarize ? textToSummarize.substring(0, 30) + '...' : 'none found');
            }
            
            if (!textToSummarize || textToSummarize.trim() === '') {
              console.error('No text to summarize');
              toast.error('No text selected to summarize');
              return;
            }
            
            console.log('Summarize button clicked for text:', textToSummarize.substring(0, 50) + '...');
            
            // Dispatch the custom event for handling the summarize action
            const customEvent = new CustomEvent('highlight-action', {
              detail: {
                type: 'summarize',
                text: textToSummarize
              },
              bubbles: true
            });
            document.dispatchEvent(customEvent);
          }}
          style={{
            padding: '0.25rem 0.75rem',
            backgroundColor: 'rgba(220, 252, 231, 1)',
            color: 'rgba(22, 101, 52, 1)',
            borderRadius: '0.25rem',
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Summarize
        </button>
      </div>
    </div>
  );
};

// For debugging purposes
SelectionTooltip.displayName = 'SelectionTooltip';

// Properly combine forwardRef and memo
const EnhancedPdfHighlighterBase = forwardRef<EnhancedPdfHighlighterRef, EnhancedPdfHighlighterProps>(({ 
  pdfUrl, 
  className, 
  paperId,
  onHighlightAction,
  onAddHighlight
}, ref) => {
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
  
  // Use the interface in the callback
  const utilsCallback = useCallback((utils: PdfHighlighterUtils) => {
    console.log('Utils callback called with:', utils);
    // Store the scrollViewerTo function if it exists
    if (utils && utils.scrollTo) {
      scrollViewerTo.current = utils.scrollTo;
    }
  }, []);
  
  // Add a focus management effect
  useEffect(() => {
    // Function to handle when focus returns to the PDF viewer
    const handleFocus = () => {
      console.log('Focus returned to document');
      // Reset processing state to allow new selections to trigger the tooltip
      setIsProcessingHighlight(false);
      setTooltipManuallyClosed(false);
    };

    // Function to handle when the window is clicked
    const handleWindowClick = (e: MouseEvent) => {
      // If we're clicking within the PDF container after having interacted with chat,
      // reset the selection/tooltip state to allow new selections
      if (pdfContainerRef.current?.contains(e.target as Node)) {
        if (isProcessingHighlight || tooltipManuallyClosed) {
          console.log('Click detected in PDF after chat interaction, resetting tooltip state');
          setIsProcessingHighlight(false);
          setTooltipManuallyClosed(false);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('click', handleWindowClick);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('click', handleWindowClick);
    };
  }, [isProcessingHighlight, tooltipManuallyClosed]);

  // Set up a custom event listener for highlight actions
  useEffect(() => {
    const handleHighlightAction = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && onHighlightAction) {
        const { type, text } = customEvent.detail;
        console.log(`Custom event received for ${type} with text:`, text.substring(0, 30) + '...');
        onHighlightAction(type, text);
      }
    };
    
    document.addEventListener('highlight-action', handleHighlightAction);
    
    return () => {
      document.removeEventListener('highlight-action', handleHighlightAction);
    };
  }, [onHighlightAction]);

  // Log when component renders to track issues
  console.log('EnhancedPdfHighlighter rendering with processedPdfUrl:', 
    processedPdfUrl ? `${processedPdfUrl.substring(0, 30)}...` : 'null');

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
      // Skip handling if clicking inside:
      // 1. Chat input field
      // 2. Any textarea or input element
      // 3. Elements with chat-container or chat-input-container class
      const target = e.target as HTMLElement;
      
      // Check if click is within chat components
      const isInChat = 
        target.closest('.chat-container') || 
        target.closest('.chat-input-container') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA';
      
      // Don't handle clicks in chat areas
      if (isInChat) {
        return;
      }
      
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
    
    // Only clear selections within the PDF container
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      // Only clear if the selection is within our PDF container
      if (pdfContainerRef.current && 
         (pdfContainerRef.current === container || 
          pdfContainerRef.current.contains(container as Node))) {
        selection.removeAllRanges();
      }
    }
    
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

    console.log(`Starting ${action.type} action with text:`, action.text.substring(0, 40) + (action.text.length > 40 ? '...' : ''));

    // First, clear tooltip but be careful with selections
    handleCloseTooltip();
    
    // Only clear PDF selections, not chat selections
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      // Only clear if the selection is within our PDF container
      if (pdfContainerRef.current && 
         (pdfContainerRef.current === container || 
          pdfContainerRef.current.contains(container as Node))) {
        selection.removeAllRanges();
      }
    }
    
    // Make sure we're not already processing an action (prevents double-processing)
    if (isProcessingHighlight) {
      console.log('Already processing a highlight action, returning early');
      toast.info('Already processing a request, please wait');
      return;
    }
    
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
    
    // Clear any existing action before setting the new one
    try {
      sessionStorage.removeItem('highlight_action');
    } catch (error) {
      console.error('Error clearing cached highlight action:', error);
    }
    
    // Store in session storage to communicate with ChatInterface
    sessionStorage.setItem('highlight_action', JSON.stringify(highlightAction));
    
    // Dispatch a custom event to notify ChatInterface about the new highlight action
    // This helps ensure the action is processed even if ChatInterface is already mounted
    try {
      console.log('Dispatching highlight-action-added event');
      window.dispatchEvent(new CustomEvent('highlight-action-added'));
    } catch (error) {
      console.error('Error dispatching highlight action event:', error);
    }
    
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
          
        } catch (apiError) {
          console.error("Direct API call to explain text failed:", apiError);
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
          
        } catch (apiError) {
          console.error("Direct API call to summarize text failed:", apiError);
          toast.error("Failed to get summary. Please try again.");
        }
      }
    } catch (error) {
      console.error(`Error during direct ${action.type} operation:`, error);
    } finally {
      // Reset state variables after a delay, regardless of API call outcome
      setTimeout(() => {
        setIsProcessingHighlight(false);
        setSelectedText('');
        setGhostHighlight(null);
        setLastActionTaken(null);
        
        // Reset tooltip flags
        setTooltipManuallyClosed(false);
      }, 1000);
    }

    // Force clearing selection one more time after a short delay
    setTimeout(() => {
      // Only clear PDF selections, not chat selections
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        
        // Only clear if the selection is within our PDF container
        if (pdfContainerRef.current && 
           (pdfContainerRef.current === container || 
            pdfContainerRef.current.contains(container as Node))) {
          selection.removeAllRanges();
        }
      }
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
      // Check if URL is external (not relative or from our domain)
      const isExternalUrl = normalizedUrl.startsWith('http') && 
                            !normalizedUrl.includes(window.location.hostname);
      
      // Always use server proxy for external URLs (to avoid CORS issues) or relative URLs
      const useServerProxy = isExternalUrl || !normalizedUrl.startsWith('http');
      
      // Log which URLs we'll proxy
      if (isExternalUrl) {
        console.log('Using server proxy for external URL:', normalizedUrl);
      }
      
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
                await cachePdf(paperId, "url" as const, fullProxyUrl);
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

  // Expose the processPdfUrl method to parent components via ref
  useImperativeHandle(ref, () => ({
    processPdfUrl
  }), [processPdfUrl]);

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
            await cachePdf(paperId, "url" as const, proxyUrl);
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

  // Memoize the document configuration to prevent unnecessary reloads
  const documentConfig = useMemo(() => ({
    url: processedPdfUrl ? (
      processedPdfUrl.startsWith('/') 
        ? `${env.API_URL}${processedPdfUrl}` 
        : processedPdfUrl
    ) : '',
    withCredentials: false, // Don't send cookies with cross-origin requests
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/cmaps/',
    cMapPacked: true,
  }), [processedPdfUrl, env.API_URL]);

  // Memoize the loading component to prevent recreation on every render
  const loadingComponent = useCallback(() => (
    <div className="flex flex-col items-center justify-center h-full">
      <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
      <p className="text-gray-600">Loading PDF document...</p>
    </div>
  ), []);

  // Memoize the error component
  const errorComponent = useCallback((error: Error) => (
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
  ), [handleRetry]);

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
    console.log('PDF URL invalid, showing error state');
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
  
  console.log('Rendering PdfHighlighter component');
  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)} ref={pdfContainerRef}>
      {processedPdfUrl && isValidUrl(processedPdfUrl) ? (
        <PdfLoader 
          document={documentConfig}
          beforeLoad={loadingComponent}
          errorMessage={errorComponent}
        >
          {(pdfDocument) => {
            console.log('PdfLoader rendered with document, rendering PdfHighlighter');
            return (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={(event) => event.altKey}
                onScrollAway={resetHash}
                pdfScaleValue={pdfScaleValue}
                utilsRef={utilsCallback}
                selectionTip={<SelectionTooltip />}
                onSelection={(selection) => {
                  // Set the selected text in the DOM so the tooltip can access it
                  const textElement = document.getElementById('selected-text');
                  if (textElement) {
                    textElement.textContent = selection.content.text;
                  }
                  console.log('Text selected:', selection.content.text);
                  setSelectedText(selection.content.text);
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
            )
          }}
        </PdfLoader>
      ) : null}
    </div>
  );
});

// Apply memo to the base component
const EnhancedPdfHighlighter = memo(EnhancedPdfHighlighterBase);

// Add display name for debugging
EnhancedPdfHighlighter.displayName = 'EnhancedPdfHighlighter';

export default EnhancedPdfHighlighter; 