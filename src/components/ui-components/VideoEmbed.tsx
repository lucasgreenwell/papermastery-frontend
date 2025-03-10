
import React from 'react';
import { cn } from '@/lib/utils';

interface VideoEmbedProps {
  videoUrl: string;
  title?: string;
  className?: string;
}

const VideoEmbed = ({ videoUrl, title, className }: VideoEmbedProps) => {
  // Extract video ID from YouTube URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeId(videoUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : videoUrl;

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <div className="aspect-video">
        <iframe
          src={embedUrl}
          title={title || "Embedded video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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

export default VideoEmbed;
