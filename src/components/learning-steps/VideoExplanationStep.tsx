import React, { useState, useEffect } from 'react';
import { Video, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import VideoEmbed from '@/components/ui-components/VideoEmbed';
import { LearningItem, VideoItem } from '@/services/types';
import { learningAPI } from '@/services/learningAPI';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface VideoExplanationStepProps {
  videoItems: LearningItem[];
  isLoading: boolean;
  onComplete: () => void;
}

const VideoExplanationStep: React.FC<VideoExplanationStepProps> = ({ 
  videoItems, 
  isLoading, 
  onComplete 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [currentVideoCompleted, setCurrentVideoCompleted] = useState(false);
  const startTime = React.useRef(Date.now());

  // Extract all videos from video items
  useEffect(() => {
    if (videoItems.length === 0) return;
    
    const extractedVideos: any[] = [];
    
    videoItems.forEach(videoItem => {
      // Try to find videos in different possible locations
      let videos: any[] = [];
      
      if (videoItem.metadata?.video) {
        // Single video in metadata.video
        videos = [videoItem.metadata.video];
      } else if (videoItem.data?.video) {
        // Single video in data.video
        videos = [videoItem.data.video];
      } else if (Array.isArray(videoItem.metadata?.videos)) {
        // Array of videos in metadata.videos
        videos = videoItem.metadata.videos;
      } else if (videoItem.videos) {
        // Videos directly attached to item
        videos = Array.isArray(videoItem.videos) ? videoItem.videos : [videoItem.videos];
      } else if (videoItem.data?.videos) {
        // Videos in data.videos
        videos = videoItem.data.videos;
      } else if (videoItem.data && videoItem.data.video_id) {
        // If video_id is directly in data object
        videos = [videoItem.data];
      } else if (videoItem.metadata && videoItem.metadata.video_id) {
        // If video_id is directly in metadata
        videos = [videoItem.metadata];
      }
      
      // Add item ID to each video for progress tracking
      videos.forEach(video => {
        extractedVideos.push({
          ...video,
          itemId: videoItem.id
        });
      });
    });
    
    setAllVideos(extractedVideos);
  }, [videoItems]);

  const handleComplete = async () => {
    if (allVideos.length === 0) {
      onComplete();
      return;
    }

    setIsSubmitting(true);
    try {
      // Only record progress for the current video's item
      const currentVideo = allVideos[currentVideoIndex];
      if (currentVideo && currentVideo.itemId) {
        await learningAPI.recordProgress(currentVideo.itemId, true);
        setCurrentVideoCompleted(true);
        
        // If this is the last video, call onComplete to move to the next step
        if (currentVideoIndex === allVideos.length - 1) {
          onComplete();
        } else {
          // Otherwise, move to the next video
          goToNextVideo();
        }
      }
    } catch (error) {
      console.error('Error recording video progress:', error);
      toast({
        title: "Error",
        description: "Failed to record progress. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNextVideo = () => {
    if (currentVideoIndex < allVideos.length - 1) {
      setCurrentVideoIndex(prevIndex => prevIndex + 1);
      setCurrentVideoCompleted(false);
    }
  };

  const goToPrevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(prevIndex => prevIndex - 1);
      setCurrentVideoCompleted(false);
    }
  };

  if (isLoading) {
    return (
      <LearningStepCard 
        title="Video Explanation" 
        icon={<Video size={20} />}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse flex flex-col items-center">
            <Video size={32} className="text-blue-200 mb-4" />
            <p className="text-gray-400">Loading videos...</p>
          </div>
        </div>
      </LearningStepCard>
    );
  }
  
  if (videoItems.length === 0 || allVideos.length === 0) {
    return (
      <LearningStepCard 
        title="Video Explanation" 
        icon={<Video size={20} />}
      >
        <p className="text-gray-700 mb-4">
          No videos available for this paper.
        </p>
      </LearningStepCard>
    );
  }
  
  // Get the current video
  const currentVideo = allVideos[currentVideoIndex];
  
  // Create a safe video object handling different structures
  const videoId = currentVideo?.video_id || '';
  const videoTitle = currentVideo?.title || 'Learning Video';
  const videoChannel = currentVideo?.channel || 'Educational Channel';
  
  return (
    <LearningStepCard 
      title="Video Explanation" 
      icon={<Video size={20} />}
    >
      <p className="text-gray-700 mb-4">
        Watch these videos to enhance your understanding:
      </p>
      
      {videoId ? (
        <div className="space-y-6">
          <div className="mb-4">
            <VideoEmbed 
              videoUrl={`https://www.youtube.com/watch?v=${videoId}`}
              title={videoTitle}
              className="mb-2"
            />
            <p className="text-sm text-gray-600">{videoChannel}</p>
          </div>
          
          {/* Video navigation controls */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevVideo}
              disabled={currentVideoIndex === 0}
              className="flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
            
            <span className="text-sm text-gray-500">
              Video {currentVideoIndex + 1} of {allVideos.length}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextVideo}
              disabled={currentVideoIndex === allVideos.length - 1}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">No video content available.</p>
      )}
      
      <Button 
        onClick={handleComplete}
        disabled={isSubmitting || currentVideoCompleted}
        className={cn("mt-4", currentVideoCompleted && "bg-green-600 hover:bg-green-700")}
      >
        {isSubmitting ? 'Recording progress...' : 
         currentVideoCompleted ? 'Watched ✓' : 
         `I've watched this video`}
      </Button>
    </LearningStepCard>
  );
};

export default VideoExplanationStep; 