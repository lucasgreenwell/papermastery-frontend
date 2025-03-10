
import React from 'react';
import { cn } from '@/lib/utils';

interface GoogleSlidesEmbedProps {
  slideUrl: string;
  title?: string;
  className?: string;
}

const GoogleSlidesEmbed = ({ slideUrl, title, className }: GoogleSlidesEmbedProps) => {
  if (!slideUrl) {
    return <div className="p-4 border border-red-200 rounded bg-red-50 text-red-700">Slide URL is required</div>;
  }
  
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <div className="aspect-w-16 aspect-h-9">
        <iframe
          src={slideUrl}
          title={title || "Google Slides Presentation"}
          allowFullScreen
          className="w-full h-full rounded-lg border border-gray-200"
        ></iframe>
      </div>
      {title && (
        <p className="mt-2 text-sm text-gray-600">{title}</p>
      )}
    </div>
  );
};

export default GoogleSlidesEmbed;
