import React, { useState } from 'react';
import { Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LearningStepCard from '@/components/ui-components/LearningStepCard';
import VideoEmbed from '@/components/ui-components/VideoEmbed';
import { LearningItem, VideoItem } from '@/services/types';
import { learningAPI } from '@/services/learningAPI';
import { toast } from '@/components/ui/use-toast';

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
  const startTime = React.useRef(Date.now());

  const handleComplete = async () => {
    if (videoItems.length === 0) {
      onComplete();
      return;
    }

    setIsSubmitting(true);
    try {
      // Record progress for each video item
      for (const item of videoItems) {
        await learningAPI.recordProgress(item.id, true);
      }
      
      onComplete();
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
  
  if (videoItems.length === 0) {
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
  
  // Get the first video item
  const videoItem = videoItems[0];
  const videos = videoItem?.metadata?.videos || [];
  
  return (
    <LearningStepCard 
      title="Video Explanation" 
      icon={<Video size={20} />}
    >
      <p className="text-gray-700 mb-4">
        Watch these videos to enhance your understanding:
      </p>
      
      {videos.length > 0 ? (
        <div className="space-y-6">
          {videos.map((video: VideoItem, index: number) => (
            <div key={index} className="mb-4">
              <VideoEmbed 
                videoUrl={`https://www.youtube.com/watch?v=${video.video_id}`}
                title={video.title}
                className="mb-2"
              />
              <p className="text-sm text-gray-600">{video.channel}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No videos available in this item.</p>
      )}
      
      <Button 
        onClick={handleComplete}
        disabled={isSubmitting}
        className="mt-4"
      >
        {isSubmitting ? 'Recording progress...' : 'I\'ve watched the videos'}
      </Button>
    </LearningStepCard>
  );
};

export default VideoExplanationStep; 