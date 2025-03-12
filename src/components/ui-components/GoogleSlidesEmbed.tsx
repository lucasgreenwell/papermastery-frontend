import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MousePointerClick, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoogleSlidesEmbedProps {
  slideUrl: string;
  title?: string;
  className?: string;
}

const GoogleSlidesEmbed = ({ slideUrl, title, className }: GoogleSlidesEmbedProps) => {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState<number>(0); // Used to force iframe refresh
  
  const formatUrl = (url: string) => {
    if (!url) return null;
    
    try {
      // Transform the Google Slides URL to the proper embed format
      let formattedUrl = url;
      
      // Check if it's already an embed URL
      if (!formattedUrl.includes('/embed')) {
        // Handle published slides
        if (formattedUrl.includes('/pub')) {
          // Replace /pub with /embed if it's not already there
          formattedUrl = formattedUrl.replace('/pub', '/embed');
        } else {
          // For standard presentation URLs, add /embed before any query parameters
          const urlParts = formattedUrl.split('?');
          formattedUrl = `${urlParts[0]}/embed${urlParts.length > 1 ? `?${urlParts[1]}` : ''}`;
        }
      }
      
      // Add parameters to improve appearance
      if (formattedUrl.includes('?')) {
        formattedUrl += '&rm=minimal&slide=id.p';
      } else {
        formattedUrl += '?rm=minimal&slide=id.p';
      }
      
      return formattedUrl;
    } catch (err) {
      console.error('Error formatting Google Slides URL:', err);
      return null;
    }
  };
  
  useEffect(() => {
    if (!slideUrl) {
      setError('Slide URL is required');
      return;
    }
    
    const formattedUrl = formatUrl(slideUrl);
    
    if (formattedUrl) {
      setEmbedUrl(formattedUrl);
      setError(null);
    } else {
      setError('Invalid Google Slides URL');
    }
  }, [slideUrl]);
  
  const handleRestart = () => {
    // Force iframe to reload by changing the key
    setKey(prevKey => prevKey + 1);
  };
  
  if (error) {
    return <div className="p-4 border border-red-200 rounded bg-red-50 text-red-700">{error}</div>;
  }
  
  if (!embedUrl) {
    return <div className="p-4 border border-gray-200 rounded bg-gray-50">Loading presentation...</div>;
  }
  
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <div className="w-full" style={{ aspectRatio: '16/9', minHeight: '450px' }}>
        <iframe
          key={key}
          src={embedUrl}
          title={title || "Google Slides Presentation"}
          allowFullScreen
          className="w-full h-full rounded-lg border border-gray-200"
          style={{ backgroundColor: 'white' }}
          frameBorder="0"
        ></iframe>
      </div>
      <div className="flex flex-wrap items-center justify-between mt-2 gap-2">
        <div className="flex items-center text-sm text-gray-500">
          <MousePointerClick size={16} className="mr-1" />
          <span>Click on the slides to navigate forward</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRestart}
          className="flex items-center gap-1"
        >
          <RefreshCw size={14} />
          <span>Restart</span>
        </Button>
      </div>
      {title && (
        <p className="mt-2 text-sm text-gray-600">{title}</p>
      )}
    </div>
  );
};

export default GoogleSlidesEmbed;
