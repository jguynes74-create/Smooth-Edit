import React, { useEffect, useRef } from 'react';

interface VideoJSPlayerProps {
  videoId: string;
  title: string;
  className?: string;
  onReady?: () => void;
  onError?: () => void;
}

export default function VideoJSPlayer({ 
  videoId, 
  title, 
  className = '',
  onReady,
  onError 
}: VideoJSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const streamUrl = `/api/videos/${videoId}/stream`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Call onReady immediately since we're using a simple video element
    if (onReady) {
      // Give it a short delay to make sure the video element is ready
      setTimeout(onReady, 100);
    }

    const handleError = () => {
      console.error('Video player error:', video.error);
      if (onError) onError();
    };

    const handleCanPlay = () => {
      console.log('Video can play - ready!');
    };

    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [onReady, onError]);

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={streamUrl}
        controls
        preload="metadata"
        playsInline
        muted={false}
        autoPlay={false}
        crossOrigin="anonymous"
        className="w-full h-full"
        data-testid={`videojs-player-${videoId}`}
      >
        Your browser does not support the video tag.
      </video>
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded pointer-events-none">
        {title}
      </div>
    </div>
  );
}