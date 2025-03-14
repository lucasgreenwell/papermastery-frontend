import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface PdfViewerProps {
  pdfUrl: string;
  className?: string;
}

const PdfViewer = ({ pdfUrl, className }: PdfViewerProps) => {
  return (
    <div className={cn("flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100", className)}>
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <div 
          className="w-full h-full flex items-center justify-center"
        >
          {/* This would be replaced with an actual PDF rendering component */}
          <iframe 
            src={pdfUrl} 
            className="w-full h-full rounded border border-gray-200"
            title="PDF Viewer"
          />
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
