import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import ErrorBoundary from './ErrorBoundary';

interface PdfViewerSimpleProps {
  pdfUrl: string | null;
  className?: string;
  paperId?: string;
}

/**
 * A simple PDF viewer component that uses the browser's built-in PDF viewer
 * instead of a complex React PDF library.
 */
const PdfViewerSimple = ({ pdfUrl, className, paperId }: PdfViewerSimpleProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Handle iframe load event
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  // Handle iframe error event
  const handleError = () => {
    setError('Failed to load PDF');
    setIsLoading(false);
  };
  
  // Simple validation of the URL
  const isValidUrl = pdfUrl && 
    (pdfUrl.startsWith('http://') || 
     pdfUrl.startsWith('https://') || 
     pdfUrl.startsWith('blob:'));
  
  if (!pdfUrl || !isValidUrl) {
    return (
      <div className={cn("flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100", className)}>
        <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">
            {!pdfUrl ? 'No PDF available' : 'Invalid PDF URL'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100", className)}>
      <ErrorBoundary>
        <div className="flex-1 overflow-auto relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-gray-500">Loading PDF...</div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-red-500">{error}</div>
            </div>
          )}
          
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title="PDF Viewer"
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default PdfViewerSimple; 