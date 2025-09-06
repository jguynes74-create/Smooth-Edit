import React, { useEffect, useRef, useState } from 'react';
import { Play, Loader2, AlertCircle } from 'lucide-react';

interface VLCPlayerProps {
  videoId: string;
  title: string;
  className?: string;
  onReady?: () => void;
  onError?: () => void;
}

export default function VLCPlayer({ 
  videoId, 
  title, 
  className = '',
  onReady,
  onError 
}: VLCPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [vlcPort, setVlcPort] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    initializeVLCStream();
    
    return () => {
      // Cleanup VLC stream when component unmounts
      if (vlcPort) {
        fetch(`/api/videos/${videoId}/vlc/stop`, { method: 'POST' })
          .catch(err => console.log('VLC cleanup error:', err));
      }
    };
  }, [videoId]);

  const initializeVLCStream = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      console.log(`Initializing VLC stream for video: ${videoId}`);
      
      // Start VLC streaming for this video
      const response = await fetch(`/api/videos/${videoId}/vlc/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to start VLC stream: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('VLC stream response:', data);
      
      if (data.streamUrl) {
        setStreamUrl(data.streamUrl);
        setVlcPort(data.port);
        console.log(`VLC stream ready: ${data.streamUrl}`);
      } else {
        throw new Error('No stream URL received from VLC');
      }

    } catch (error) {
      console.error('Failed to initialize VLC stream:', error);
      setHasError(true);
      setIsLoading(false);
      if (onError) onError();
    }
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setHasError(false);
    if (onReady) onReady();
    console.log(`VLC video loaded successfully: ${title}`);
  };

  const handleVideoError = (error: any) => {
    console.error('VLC video playback error:', error);
    setIsLoading(false);
    setHasError(true);
    if (onError) onError();
  };

  const retryStream = () => {
    initializeVLCStream();
  };

  if (hasError) {
    return (
      <div className={`bg-slate-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="text-red-500" size={20} />
          </div>
          <p className="text-slate-700 text-sm mb-3 font-medium">VLC Player Error</p>
          <p className="text-slate-500 text-xs mb-4">Unable to start VLC stream</p>
          <button
            onClick={retryStream}
            className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200 transition-colors"
            data-testid="retry-vlc-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !streamUrl) {
    return (
      <div className={`bg-slate-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <Loader2 className="animate-spin text-blue-500 mx-auto mb-3" size={32} />
          <p className="text-slate-700 text-sm font-medium mb-1">Starting VLC Player...</p>
          <p className="text-slate-500 text-xs">Enhanced video compatibility</p>
        </div>
      </div>
    );
  }

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
        {...({ 'webkit-playsinline': 'true' } as any)}
        {...({ 'x-webkit-airplay': 'allow' } as any)}
        {...({ 'x5-video-player-type': 'h5' } as any)}
        {...({ 'x5-video-orientation': 'portrait' } as any)}
        className="w-full h-full"
        onLoadStart={() => console.log('VLC video load started')}
        onCanPlay={handleVideoLoad}
        onError={handleVideoError}
        data-testid={`vlc-player-${videoId}`}
      >
        Your browser does not support the video tag.
      </video>
      
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        {title} (VLC)
      </div>
    </div>
  );
}