import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Scissors, Wand2, Download, Upload, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link, useParams } from "wouter";
import VideoPlayer from "@/components/VideoPlayer";
import AIFixesPanel from "@/components/AIFixesPanel";
import StorylinePanel from "@/components/StorylinePanel";

export default function Editor() {
  const { videoId } = useParams<{ videoId?: string }>();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(videoId || null);
  const { toast } = useToast();

  const { data: videos, isLoading } = useQuery({
    queryKey: ['/api/videos'],
    queryFn: async () => {
      const response = await fetch('/api/videos');
      return response.json();
    },
    refetchInterval: 5000,
  });

  const completedVideos = videos?.filter((v: any) => v.status === 'completed') || [];
  const selectedVideo = completedVideos.find((v: any) => v.id === selectedVideoId);

  // Auto-select video from URL parameter
  useEffect(() => {
    if (videoId && completedVideos.length > 0) {
      const videoExists = completedVideos.find((v: any) => v.id === videoId);
      if (videoExists) {
        setSelectedVideoId(videoId);
      }
    }
  }, [videoId, completedVideos]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Video Editor</h1>
              <p className="text-slate-600 mt-2">Edit and enhance your processed videos</p>
            </div>
            <Link href="/videos">
              <Button variant="ghost" size="sm">
                ← Back to Library
              </Button>
            </Link>
          </div>
        </div>

        {/* Video Selection - Horizontal Layout */}
        <div className="mb-8">
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
              <Scissors size={18} className="mr-2" />
              Select Video to Edit
            </h3>
            {completedVideos.length === 0 ? (
              <div className="text-center py-8">
                <Upload className="mx-auto text-slate-400 mb-3" size={48} />
                <p className="text-slate-500">No videos available</p>
                <Link href="/#upload">
                  <Button size="sm" className="mt-3">
                    Upload Videos
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {completedVideos.map((video: any) => (
                  <div
                    key={video.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedVideoId === video.id 
                        ? 'bg-primary-100 border-primary-300' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    } border`}
                    onClick={() => setSelectedVideoId(video.id)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-6 bg-primary-100 rounded flex items-center justify-center">
                        <Play size={12} className="text-primary-600" />
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {video.originalFileName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {Math.round(video.fileSize / 1024 / 1024)}MB
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Main Editor Area - Centered and Wide */}
        <div className="max-w-6xl mx-auto">
          {selectedVideo ? (
            <div className="space-y-8">
              {/* Video Player */}
              <Card className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4 text-center">
                  Editing: {selectedVideo.originalFileName}
                </h3>
                <div className="max-w-4xl mx-auto">
                  <VideoPlayer 
                    videoId={selectedVideo.id} 
                    title={selectedVideo.originalFileName}
                    className="w-full h-80"
                  />
                </div>
              </Card>

              {/* AI Fixes and Storyline - Equal 50/50 Split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AIFixesPanel 
                  videoId={selectedVideo.id} 
                  videoTitle={selectedVideo.originalFileName}
                  currentIssues={selectedVideo.fixesApplied}
                />
                <StorylinePanel 
                  videoId={selectedVideo.id} 
                  videoTitle={selectedVideo.originalFileName}
                />
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Wand2 className="mx-auto text-slate-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to Edit</h3>
              <p className="text-slate-500">Select a video from above to start editing</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}