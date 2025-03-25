import React, { useState, useCallback, useMemo } from 'react';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin } from '@react-pdf-viewer/highlight';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';
import { cn } from '@/lib/utils';
import ErrorBoundary from './ErrorBoundary';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';

interface PdfViewerProps {
  pdfUrl: string | null;
  className?: string;
  paperId?: string;
}

const PdfViewer = ({ pdfUrl, className, paperId }: PdfViewerProps) => {
  // Set up default layout plugin
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => defaultTabs.filter(tab => 
      tab.tabName !== 'bookmark' && tab.tabName !== 'attachment'
    ),
  });
  
  // Set up toolbar plugin
  const toolbarPluginInstance = toolbarPlugin();
  
  // Set up highlight plugin
  const highlightPluginInstance = highlightPlugin();
  
  // Ensure we have a valid URL
  const processedPdfUrl = useMemo(() => {
    if (!pdfUrl) return null;
    
    try {
      // Validate the URL
      new URL(pdfUrl);
      return pdfUrl;
    } catch (e) {
      console.error('Invalid PDF URL:', e);
      return null;
    }
  }, [pdfUrl]);
  
  // Match PDF.js version with the one in package.json
  const workerUrl = "https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.js";
  
  if (!processedPdfUrl) {
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
      <div className="flex-1 overflow-auto">
        <ErrorBoundary>
          <Worker workerUrl={workerUrl}>
            <div className="h-full">
              <Viewer
                fileUrl={processedPdfUrl}
                plugins={[
                  defaultLayoutPluginInstance,
                  highlightPluginInstance,
                  toolbarPluginInstance,
                ]}
                defaultScale={SpecialZoomLevel.PageFit}
              />
            </div>
          </Worker>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default PdfViewer;
