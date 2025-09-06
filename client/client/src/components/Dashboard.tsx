import { useQuery } from "@tanstack/react-query";
import { Video, Shield, Download, Share2, Plus, Info, Upload, ExternalLink, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { SiTiktok, SiYoutube, SiX, SiInstagram } from "react-icons/si";

export default function Dashboard() {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [openShareDropdown, setOpenShareDropdown] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats');
      return response.json();
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const { data: videos } = useQuery({
    queryKey: ['/api/videos'],
    queryFn: async () => {
      const response = await fetch('/api/videos');
      return response.json();
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const { data: drafts } = useQuery({
    queryKey: ['/api/drafts'],
    queryFn: async () => {
      const response = await fetch('/api/drafts');
      return response.json();
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const completedVideos = (Array.isArray(videos) ? videos.filter((v: any) => v.status === 'completed') : []);
  const recentDrafts = (Array.isArray(drafts) ? drafts.slice(0, 3) : []);

  const handleDownload = async (videoId: string) => {
    try {
      const baseUrl = window.location.origin;
      const downloadUrl = `${baseUrl}/api/videos/${videoId}/download`;
      
      // Check if download is available first
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.demoMode) {
          toast({
            title: "Demo Mode",
            description: "Downloads are not available for demo videos. In production, you would be able to download your processed videos.",
            variant: "default",
          });
        } else {
          toast({
            title: "Download Failed",
            description: errorData.message || "Video file not available. Please try processing the video again.",
            variant: "destructive",
          });
        }
        return;
      }
      
      // Check if response is JSON (error) or actual file
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        toast({
          title: "Download Failed",
          description: errorData.message || "Video file not available.",
          variant: "destructive",
        });
        return;
      }
      
      // If we get here, it should be a real file - create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-${videoId}.mp4`; // Default filename
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Download Error", 
        description: "Failed to download video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    toast({
      title: `Uploading ${files.length} video${files.length > 1 ? 's' : ''}`,
      description: "Your videos are being uploaded and will be processed automatically.",
    });

    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Step 1: Get upload URL
        const urlResponse = await apiRequest('POST', '/api/videos/upload-url');
        const { uploadUrl } = await urlResponse.json();
        
        // Step 2: Upload directly to cloud storage
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }
        
        // Step 3: Complete upload and create video record
        await apiRequest('POST', '/api/videos/upload-complete', {
          fileName: file.name,
          fileSize: file.size.toString(),
          uploadUrl: uploadUrl,
        });

      } catch (error) {
        toast({
          title: `Failed to upload ${file.name}`,
          description: "Please try uploading this video again.",
          variant: "destructive",
        });
      }
    }

    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/drafts'] });

    toast({
      title: "Upload complete!",
      description: "All videos are now processing. Draft backups will be created automatically.",
    });
  };


  const handleShare = (videoId: string, platform: string, fileName: string) => {
    const shareData = {
      title: `Check out my fixed video: ${fileName}`,
      text: `I used SmoothEdit to fix this video - no more glitches! 🎬✨`,
      url: `${window.location.origin}/video/${videoId}`
    };

    const encodedText = encodeURIComponent(shareData.text);
    const encodedUrl = encodeURIComponent(shareData.url);

    let shareUrl = '';
    
    switch (platform) {
      case 'tiktok':
        shareUrl = `https://www.tiktok.com/upload?caption=${encodedText}`;
        break;
      case 'youtube':
        shareUrl = `https://studio.youtube.com/channel/upload`;
        break;
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'instagram':
        shareUrl = `https://www.instagram.com/`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
      toast({
        title: `Opening ${platform === 'x' ? 'X' : platform.charAt(0).toUpperCase() + platform.slice(1)}`,
        description: `Ready to share your fixed video on ${platform === 'x' ? 'X' : platform}!`,
      });
    }
    
    setOpenShareDropdown(null);
  };

  return (
    <section className="bg-white py-16" id="dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Video Library</h2>
          <p className="mt-2 text-slate-600">Quick access to your videos, drafts, and editing tools</p>
        </div>

        {/* Quick Stats - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center">
              <Video size={16} className="text-primary-600 mr-3" />
              <div>
                <p className="text-xs text-slate-500">Videos</p>
                <p className="text-lg font-semibold text-slate-900">{stats?.videosProcessed || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center">
              <Shield size={16} className="text-green-600 mr-3" />
              <div>
                <p className="text-xs text-slate-500">Drafts</p>
                <p className="text-lg font-semibold text-slate-900">{stats?.draftsSaved || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center">
              <Info size={16} className="text-primary-600 mr-3" />
              <div>
                <p className="text-xs text-slate-500">Fixed</p>
                <p className="text-lg font-semibold text-slate-900">{stats?.issuesFixed || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center">
              <i className="fas fa-clock text-orange-600 mr-3" style={{ fontSize: '16px' }}></i>
              <div>
                <p className="text-xs text-slate-500">Saved</p>
                <p className="text-lg font-semibold text-slate-900">{stats?.timeSaved || '0h'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/videos">
            <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-primary-500">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-primary-100">
                  <Video size={24} className="text-primary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-slate-900">Video Details</h3>
                  <p className="text-sm text-slate-500">View and manage all your processed videos</p>
                  <p className="text-xs text-primary-600 mt-1">
                    {completedVideos.length} videos available
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/drafts">
            <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-green-500">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100">
                  <Shield size={24} className="text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-slate-900">Cloud Backup</h3>
                  <p className="text-sm text-slate-500">Access your automatically saved drafts</p>
                  <p className="text-xs text-green-600 mt-1">
                    {recentDrafts.length} drafts backed up
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/editor">
            <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-orange-500">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-100">
                  <i className="fas fa-cut text-orange-600" style={{ fontSize: '24px' }}></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-slate-900">Editor</h3>
                  <p className="text-sm text-slate-500">Edit and enhance your videos with AI</p>
                  <p className="text-xs text-orange-600 mt-1">
                    Advanced editing tools
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Recent Activity - Compact Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Videos */}
          <Card className="p-4">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Recent Videos</h3>
            </div>
            <div className="space-y-2">
              {completedVideos.slice(0, 3).map((video: any) => (
                <div key={video.id} className="flex items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="w-8 h-6 bg-primary-100 rounded flex items-center justify-center">
                    <Video size={12} className="text-primary-600" />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{video.originalFileName}</p>
                    <p className="text-xs text-slate-500">
                      {Object.values(video.fixesApplied || {}).reduce((acc: number, val: any) => 
                        acc + (typeof val === 'boolean' ? (val ? 1 : 0) : (val || 0)), 0
                      )} fixes • {Math.round(video.fileSize / 1024 / 1024)}MB
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDownload(video.id)}>
                    <Download size={14} />
                  </Button>
                </div>
              ))}
              {completedVideos.length === 0 && (
                <div className="text-center py-4">
                  <Video className="mx-auto text-slate-400 mb-2" size={32} />
                  <p className="text-sm text-slate-500">No videos yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Drafts */}
          <Card className="p-4">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Recent Drafts</h3>
            </div>
            <div className="space-y-2">
              {recentDrafts.map((draft: any) => (
                <div key={draft.id} className="flex items-center p-2 hover:bg-green-50 rounded-lg transition-colors">
                  <div className="w-8 h-6 bg-green-100 rounded flex items-center justify-center">
                    <Shield size={12} className="text-green-600" />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{draft.fileName}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(draft.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-green-600">
                    <Download size={14} />
                  </Button>
                </div>
              ))}
              {recentDrafts.length === 0 && (
                <div className="text-center py-4">
                  <Shield className="mx-auto text-slate-400 mb-2" size={32} />
                  <p className="text-sm text-slate-500">No drafts yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Multi Video Upload Section - Centered */}
        <div className="flex justify-center mt-12">
          <div className="w-full max-w-md">
            {/* Hidden file input for multiple uploads */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.mp4,.mov,.avi"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files) {
                  handleFileUpload(e.target.files);
                }
              }}
            />
            
            <Card 
              className="p-8 text-center border-2 border-dashed border-slate-300 cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200"
              onClick={() => {
                fileInputRef.current?.click();
              }}
            >
              <Upload className="mx-auto text-slate-400 hover:text-primary-500 mb-3 transition-colors duration-200" size={48} />
              <p className="text-slate-500">Upload multiple videos at once</p>
              <p className="text-xs text-slate-400 mt-2">Click to select multiple video files</p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
