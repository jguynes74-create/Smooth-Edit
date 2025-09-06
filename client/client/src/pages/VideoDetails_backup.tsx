import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Video, Download, Share2, Clock, CheckCircle, AlertTriangle, FileText, Calendar, HardDrive, ChevronDown, Trash2, Archive, Eye, Edit3, Save, X } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import AIFixesPanel from "@/components/AIFixesPanel";
import StorylinePanel from "@/components/StorylinePanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useState } from "react";
import { SiTiktok, SiYoutube, SiX, SiInstagram } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function VideoDetails() {
  const [openShareDropdown, setOpenShareDropdown] = useState<string | null>(null);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState<string>("");
  const { toast } = useToast();
  
  const { data: videos, isLoading } = useQuery({
    queryKey: ['/api/videos'],
    queryFn: async () => {
      const response = await fetch('/api/videos');
      return response.json();
    },
    refetchInterval: 2000, // Auto-refresh every 2 seconds
  });

  const { data: drafts } = useQuery({
    queryKey: ['/api/drafts'],
    queryFn: async () => {
      const response = await fetch('/api/drafts');
      return response.json();
    },
    refetchInterval: 5000,
  });

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

  const handleDeleteVideo = async (videoId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiRequest('DELETE', `/api/videos/${videoId}`);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      
      toast({
        title: "Video deleted",
        description: `${fileName} has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Failed to delete video",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddToDrafts = async (videoId: string, fileName: string) => {
    try {
      await apiRequest('POST', `/api/videos/${videoId}/add-to-drafts`);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/drafts'] });
      
      toast({
        title: "Added to drafts",
        description: `${fileName} has been added to your drafts.`,
      });
    } catch (error) {
      toast({
        title: "Failed to add to drafts",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Rename video mutation
  const renameVideoMutation = useMutation({
    mutationFn: async ({ videoId, fileName }: { videoId: string; fileName: string }) => {
      const response = await apiRequest('PUT', `/api/videos/${videoId}/rename`, {
        fileName
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Video renamed",
        description: `Video renamed to "${data.fileName}" successfully.`,
      });
      setEditingVideoId(null);
      setEditedName("");
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
    },
    onError: () => {
      toast({
        title: "Failed to rename video",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const startEditing = (videoId: string, currentName: string) => {
    setEditingVideoId(videoId);
    setEditedName(currentName);
  };

  const cancelEditing = () => {
    setEditingVideoId(null);
    setEditedName("");
  };

  const saveRename = () => {
    if (editingVideoId && editedName.trim()) {
      renameVideoMutation.mutate({ 
        videoId: editingVideoId, 
        fileName: editedName.trim() 
      });
    }
  };

  const handleShare = (videoId: string, platform: string, fileName: string) => {
    const shareData = {
      title: `Check out my fixed video: ${fileName}`,
      text: `I used SmoothEDIT to fix this video - no more glitches! 🎬✨`,
      url: `${window.location.origin}/video/${videoId}`
    };

    const encodedText = encodeURIComponent(shareData.text);
    const encodedUrl = encodeURIComponent(shareData.url);
    const encodedTitle = encodeURIComponent(shareData.title);

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'processing': return <Clock size={16} />;
      case 'failed': return <AlertTriangle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading video details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Video Library</h1>
              <p className="mt-2 text-slate-600">Manage and download all your processed videos</p>
            </div>
            <Link href="/">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <Card className="p-3">
            <div className="flex items-center">
              <Video className="text-blue-500" size={20} />
              <div className="ml-3">
                <p className="text-xs font-medium text-slate-600">Total Videos</p>
                <p className="text-xl font-bold text-slate-900">{videos?.length || 0}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center">
              <CheckCircle className="text-green-500" size={20} />
              <div className="ml-3">
                <p className="text-xs font-medium text-slate-600">Completed</p>
                <p className="text-xl font-bold text-slate-900">
                  {videos?.filter((v: any) => v.status === 'completed')?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center">
              <Clock className="text-blue-500" size={20} />
              <div className="ml-3">
                <p className="text-xs font-medium text-slate-600">Processing</p>
                <p className="text-xl font-bold text-slate-900">
                  {videos?.filter((v: any) => v.status === 'processing')?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center">
              <FileText className="text-purple-500" size={20} />
              <div className="ml-3">
                <p className="text-xs font-medium text-slate-600">Draft Backups</p>
                <p className="text-xl font-bold text-slate-900">{drafts?.length || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Video Details Grid */}
        <Card className="overflow-hidden h-[50vh]">
          <div className="px-4 py-2 bg-slate-50 border-b">
            <h2 className="text-base font-semibold text-slate-900">All Videos</h2>
          </div>
          
          <div className="overflow-y-auto h-full p-3">
            {!videos || videos.length === 0 ? (
              <div className="p-8 text-center">
                <Video className="mx-auto text-slate-400 mb-3" size={48} />
                <p className="text-slate-500">No videos uploaded yet</p>
                <Link href="/">
                  <Button className="mt-4">Upload Your First Video</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {videos.map((video: any) => (
                  <Card key={video.id} className="p-3 hover:shadow-md transition-shadow">
                    {/* Video Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-10 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Video className="text-blue-600" size={16} />
                        </div>
                        <div className="ml-3">
                          {editingVideoId === video.id ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                className="text-sm font-medium h-7"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveRename();
                                  if (e.key === 'Escape') cancelEditing();
                                }}
                                autoFocus
                                data-testid={`input-rename-${video.id}`}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={saveRename}
                                disabled={renameVideoMutation.isPending || !editedName.trim()}
                                data-testid={`button-save-${video.id}`}
                                className="h-7 px-2"
                              >
                                <Save size={12} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                data-testid={`button-cancel-${video.id}`}
                                className="h-7 px-2"
                              >
                                <X size={12} />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 group">
                              <div className="text-sm font-medium text-slate-900">
                                {video.originalFileName}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                onClick={() => startEditing(video.id, video.originalFileName)}
                                data-testid={`button-edit-${video.id}`}
                              >
                                <Edit3 size={12} />
                              </Button>
                            </div>
                          )}
                          <div className="text-xs text-slate-500">ID: {video.id.substring(0, 8)}</div>
                        </div>
                      </div>
                      <Badge className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(video.status)}`}>
                        {getStatusIcon(video.status)}
                        <span className="ml-1 capitalize">{video.status}</span>
                      </Badge>
                    </div>

                    {/* Video Details Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                      <div>
                        <div className="text-slate-500 mb-1">Issues Fixed</div>
                        <div className="text-slate-900">
                          {video.issues ? (
                            <div className="space-y-1">
                              {video.issues.stutteredCuts > 0 && (
                                <div>{video.issues.stutteredCuts} cuts</div>
                              )}
                              {video.issues.audioSyncIssues && (
                                <div>Audio sync</div>
                              )}
                              {video.issues.droppedFrames > 0 && (
                                <div>{video.issues.droppedFrames} frames</div>
                              )}
                              {video.issues.corruptedSections > 0 && (
                                <div>{video.issues.corruptedSections} sections</div>
                              )}
                              {video.issues.windNoise && (
                                <div>Wind noise</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">None</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-1">File Size</div>
                        <div className="flex items-center text-slate-900">
                          <HardDrive size={12} className="mr-1" />
                          {formatFileSize(video.fileSize || 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-1">Upload Date</div>
                        <div className="flex items-center text-slate-900">
                          <Calendar size={12} className="mr-1" />
                          {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'No date'}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {video.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPreviewVideoId(previewVideoId === video.id ? null : video.id)}
                            data-testid={`button-preview-${video.id}`}
                            className="h-7 px-2"
                          >
                            <Eye size={14} />
                          </Button>
                        )}
                        {video.status === 'completed' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleDownload(video.id)}
                            className="bg-blue-600 hover:bg-blue-700 h-7 px-2 text-xs"
                            data-testid={`button-download-${video.id}`}
                          >
                            <Download size={12} className="mr-1" />
                            Download
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleAddToDrafts(video.id, video.originalFileName)}
                          className="text-green-600 hover:text-green-700 h-7 px-2"
                          data-testid={`button-add-to-drafts-${video.id}`}
                        >
                          <Archive size={12} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteVideo(video.id, video.originalFileName)}
                          className="text-red-600 hover:text-red-700 h-7 px-2"
                          data-testid={`button-delete-${video.id}`}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                      
                      <div className="relative">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setOpenShareDropdown(openShareDropdown === video.id ? null : video.id)}
                          className="flex items-center h-7 px-2"
                          data-testid={`button-share-${video.id}`}
                        >
                          <Share2 size={12} className="text-blue-500 mr-1" />
                          <ChevronDown size={10} className="text-slate-400" />
                        </Button>
                        
                        {openShareDropdown === video.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                            <div className="p-2">
                              <p className="text-xs font-medium text-slate-600 px-3 py-2">Share to:</p>
                              
                              <button
                                onClick={() => handleShare(video.id, 'tiktok', video.originalFileName)}
                                className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                <div className="mr-3 w-4 h-4 rounded-sm bg-black flex items-center justify-center">
                                  <SiTiktok className="text-white" size={14} />
                                </div>
                                TikTok
                              </button>
                              
                              <button
                                onClick={() => handleShare(video.id, 'youtube', video.originalFileName)}
                                className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                <SiYoutube className="mr-3 text-red-600" size={16} />
                                YouTube
                              </button>
                              
                              <button
                                onClick={() => handleShare(video.id, 'x', video.originalFileName)}
                                className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                <SiX className="mr-3 text-black" size={16} />
                                X (Twitter)
                              </button>
                              
                              <button
                                onClick={() => handleShare(video.id, 'instagram', video.originalFileName)}
                                className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                <div className="mr-3 w-4 h-4 rounded-sm" 
                                     style={{ 
                                       background: 'linear-gradient(45deg, #405de6, #5851db, #833ab4, #c13584, #e1306c, #fd1d1d)' 
                                     }}>
                                  <SiInstagram className="text-white w-full h-full" size={16} />
                                </div>
                                Instagram
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview Section */}
                    {previewVideoId === video.id && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="text-center">
                                {video.originalFileName}
                              </h4>
                              
                              {/* Compact Video Editor Layout */}
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                                {/* Video Player - Centered in column */}
                                <div className="lg:col-span-1 flex flex-col items-center justify-start">
                                  <VideoPlayer 
                                    videoId={video.id} 
                                    title={video.originalFileName}
                                    className="w-full h-24 md:h-32 lg:h-40"
                                  />
                                </div>
                                
                                {/* AI Analysis Panels - Side by side, very compact */}
                                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-1">
                                  {/* AI Fixes Panel */}
                                  <div className="w-full">
                                    <AIFixesPanel
                                      videoId={video.id}
                                      videoTitle={video.originalFileName}
                                      currentIssues={video.issues}
                                    />
                                  </div>
                                  
                                  {/* AI Storyline Panel */}
                                  <div className="w-full">
                                    <StorylinePanel
                                      videoId={video.id}
                                      videoTitle={video.originalFileName}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Draft Backups Section */}
        {drafts && drafts.length > 0 && (
          <Card className="mt-8">
            <div className="px-6 py-4 bg-green-50 border-b">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <FileText className="mr-2 text-green-600" size={20} />
                Cloud Draft Backups
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drafts.map((draft: any) => (
                  <div key={draft.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{draft.fileName}</p>
                        <p className="text-sm text-green-600">
                          Saved {new Date(draft.lastModified).toLocaleString()}
                        </p>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        Restore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}