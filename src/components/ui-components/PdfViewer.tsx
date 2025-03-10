
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PdfViewerProps {
  pdfUrl: string;
  className?: string;
}

const PdfViewer = ({ pdfUrl, className }: PdfViewerProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const totalPages = 10; // This would come from the actual PDF document

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-100", className)}>
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
          >
            <ZoomOut size={16} />
          </Button>
          <span className="text-sm">{zoom}%</span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
          >
            <ZoomIn size={16} />
          </Button>
        </div>
        
        <div className="flex items-center">
          <span className="text-sm mr-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ transform: `scale(${zoom / 100})` }}
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
