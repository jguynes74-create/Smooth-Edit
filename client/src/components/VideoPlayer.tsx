import React from 'react';
import { Play } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  className?: string;
}

export default function VideoPlayer({ videoId, title, className = '' }: VideoPlayerProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  
  // Detect mobile devices (more specific detection)
  React.useEffect(() => {
    const userAgent = navigator.userAgent;
    // Only consider actual mobile devices, not desktop browsers
    const mobile = /iPhone|iPod|Android.*Mobile|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) && 
                   !/iPad|Android.*(?!.*Mobile)/i.test(userAgent) &&
                   'ontouchstart' in window;
    setIsMobile(mobile);
  }, []);

  const streamUrl = `/api/videos/${videoId}/stream`;
  const downloadUrl = `/api/videos/${videoId}/download`;

  const handleError = (event: any) => {
    console.log('Video failed to load:', event);
    // Don't immediately set error - try to recover
    setTimeout(() => {
      setHasError(true);
    }, 1000);
  };

  // Only show fallback on actual mobile devices or persistent errors
  if (hasError && isMobile) {
    return (
      <div className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 text-center max-w-xs mx-auto ${className}`}>
        <div className="mb-4">
          <Play className="mx-auto h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        {isMobile ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Tap "View Video" below to open in a new tab.
            </p>
            <div className="space-y-3">
              <a
                href={streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                data-testid={`view-video-${videoId}`}
              >
                View Video
              </a>
              <a
                href={downloadUrl}
                className="block w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                data-testid={`download-video-${videoId}`}
              >
                Download Video File
              </a>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p>💡 iOS Tip: After opening the video, tap the share button (📤) and select "Save to Photos" or "Save to Files"</p>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Video preview is not available. Download to view the video.
            </p>
            <div className="space-y-2">
              <a
                href={downloadUrl}
                download={`${title}.mp4`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                data-testid={`download-video-${videoId}`}
              >
                Download Video
              </a>
              <div>
                <a
                  href={streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium ml-2"
                  data-testid={`open-video-${videoId}`}
                >
                  Open in New Tab
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Simple desktop video player
  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>      
      <video
        src={streamUrl}
        controls
        preload="metadata"
        playsInline
        muted={false}
        className="w-full h-full"
        onError={handleError}
        onLoadStart={() => setHasError(false)}
        style={{ backgroundColor: '#000' }}
        data-testid={`video-player-${videoId}`}
      >
        Your browser does not support the video tag.
      </video>
      
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        {title}
      </div>
    </div>
  );
}