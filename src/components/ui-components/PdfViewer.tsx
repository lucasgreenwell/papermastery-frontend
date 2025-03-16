import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PdfViewerProps {
  pdfUrl: string | null;
  className?: string;
}

const PdfViewer = ({ pdfUrl, className }: PdfViewerProps) => {
  // Determine the appropriate source for the PDF
  const pdfSource = useMemo(() => {
    if (!pdfUrl) return null;
    
    // Handle different types of URLs
    if (pdfUrl.startsWith('blob:') || pdfUrl.startsWith('http')) {
      // Direct URL (blob or http) can be used directly
      return pdfUrl;
    } else if (pdfUrl.startsWith('data:application/pdf')) {
      // Data URL can be used directly
      return pdfUrl;
    } else {
      // For other cases, assume it's a URL that needs to be loaded normally
      return pdfUrl;
    }
  }, [pdfUrl]);

  if (!pdfSource) {
    return (
      <div className={cn("flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100", className)}>
        <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">No PDF available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100", className)}>
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <div 
          className="w-full h-full flex items-center justify-center"
        >
          <iframe 
            src={pdfSource} 
            className="w-full h-full rounded border border-gray-200"
            title="PDF Viewer"
          />
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
