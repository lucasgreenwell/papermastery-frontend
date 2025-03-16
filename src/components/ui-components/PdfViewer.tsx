import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PdfViewerProps {
  pdfUrl: string;
  className?: string;
}

const PdfViewer = ({ pdfUrl, className }: PdfViewerProps) => {
  const [viewerUrl, setViewerUrl] = useState<string>('');
  
  useEffect(() => {
    if (!pdfUrl) return;
    
    // Check if this is a Supabase storage URL
    const isSupabaseUrl = pdfUrl.includes('supabase.co/storage/v1/object/public');
    
    if (isSupabaseUrl) {
      // For Supabase URLs, use Google PDF Viewer as a proxy to avoid CORS issues
      setViewerUrl(`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`);
    } else {
      // For other URLs (arXiv, direct PDFs), use direct embedding
      setViewerUrl(pdfUrl);
    }
  }, [pdfUrl]);

  if (!pdfUrl) {
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
          {viewerUrl && (
            viewerUrl.includes('docs.google.com') ? (
              <iframe 
                src={viewerUrl} 
                className="w-full h-full rounded border border-gray-200"
                title="PDF Viewer"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            ) : (
              <iframe 
                src={viewerUrl} 
                className="w-full h-full rounded border border-gray-200"
                title="PDF Viewer"
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
