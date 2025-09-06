import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Video, Download, Share2, Clock, CheckCircle, AlertTriangle, FileText, Calendar, HardDrive, ChevronDown, Trash2, Archive, Eye, Edit3, Save, X, Crown, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import VideoPlayer from "@/components/VideoPlayer";
import AIFixesPanel from "@/components/AIFixesPanel";
import StorylinePanel from "@/components/StorylinePanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useState, useRef } from "react";
import { SiTiktok, SiYoutube, SiX, SiInstagram } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function VideoDetails() {
  const [openShareDropdown, setOpenShareDropdown] = useState<string | null>(null);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState<string>("");
  const shareDropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
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
      
      // Create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fixed_video_${videoId}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "Your processed video is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddToDrafts = async (videoId: string, fileName: string) => {
    try {
      await apiRequest('POST', '/api/drafts', {
        videoId: videoId,
        fileName: fileName,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/drafts'] });
      
      toast({
        title: "Added to Drafts",
        description: `${fileName} has been saved to your drafts.`,
      });
    } catch (error) {
      toast({
        title: "Failed to Add to Drafts",
        description: "Unable to save to drafts. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renameVideoMutation = useMutation({
    mutationFn: async ({ videoId, newName }: { videoId: string; newName: string }) => {
      await apiRequest('PUT', `/api/videos/${videoId}/rename`, {
        fileName: newName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drafts'] });
      setEditingVideoId(null);
      setEditedName("");
      toast({
        title: "Video renamed",
        description: "Video name has been updated in videos and drafts.",
      });
    },
    onError: () => {
      toast({
        title: "Rename failed",
        description: "Unable to rename video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      await apiRequest('DELETE', `/api/videos/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      toast({
        title: "Video deleted",
        description: "Video has been permanently deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Unable to delete video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startEditing = (videoId: string, currentName: string) => {
    setEditingVideoId(videoId);
    setEditedName(currentName);
  };

  const saveRename = () => {
    if (editingVideoId && editedName.trim()) {
      renameVideoMutation.mutate({
        videoId: editingVideoId,
        newName: editedName.trim(),
      });
    }
  };

  const cancelEditing = () => {
    setEditingVideoId(null);
    setEditedName("");
  };

  const handleDeleteVideo = (videoId: string, fileName: string) => {
    if (confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      deleteVideoMutation.mutate(videoId);
    }
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
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={12} className="mr-1" />;
      case 'processing':
        return <Clock size={12} className="mr-1" />;
      case 'failed':
        return <AlertTriangle size={12} className="mr-1" />;
      default:
        return <Clock size={12} className="mr-1" />;
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Video Library</h1>
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

        </div>

        {/* Creator Pro+ Upgrade Banner */}
        <Card className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-slate-900">Advanced Editing Tools</h3>
                <p className="text-slate-600">Unlock professional editing features with Creator Pro+</p>
              </div>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Crown size={16} className="mr-2" />
              Upgrade to Pro+
            </Button>
          </div>
        </Card>

        {/* Video Details Grid */}
        <Card className="overflow-hidden h-[75vh]">
          <div className="px-4 py-2 bg-slate-50 border-b">
            <h2 className="text-base font-semibold text-slate-900">All Videos</h2>
          </div>
          
          <div className="overflow-y-auto h-full p-2">
            {!videos || videos.length === 0 ? (
              <div className="p-8 text-center">
                <Video className="mx-auto text-slate-400 mb-3" size={48} />
                <p className="text-slate-500">No videos uploaded yet</p>
                <Link href="/">
                  <Button className="mt-4">Upload Your First Video</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                {videos.map((video: any) => (
                  <Card key={video.id} className="p-2 hover:shadow-md transition-shadow border-slate-200">
                    {/* Compact Video Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start min-w-0 flex-1">
                        <div className="w-8 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                          <Video className="text-blue-600" size={12} />
                        </div>
                        <div className="ml-2 min-w-0 flex-1">
                          {editingVideoId === video.id ? (
                            <div className="flex items-center space-x-1">
                              <Input
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                className="text-xs font-medium h-6 px-2"
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
                                className="h-6 w-6 p-0"
                              >
                                <Save size={10} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                data-testid={`button-cancel-${video.id}`}
                                className="h-6 w-6 p-0"
                              >
                                <X size={10} />
                              </Button>
                            </div>
                          ) : (
                            <div className="group">
                              <div className="flex items-center space-x-1">
                                <div className="text-xs font-medium text-slate-900 truncate">
                                  {video.originalFileName}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 p-0"
                                  onClick={() => startEditing(video.id, video.originalFileName)}
                                  data-testid={`button-edit-${video.id}`}
                                >
                                  <Edit3 size={8} />
                                </Button>
                              </div>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500">ID: {video.id.substring(0, 8)}</div>
                        </div>
                      </div>
                      <Badge className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor(video.status)}`}>
                        {getStatusIcon(video.status)}
                        <span className="ml-1 capitalize">{video.status}</span>
                      </Badge>
                    </div>

                    {/* Compact Video Details */}
                    <div className="space-y-1 mb-2 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Issues:</span>
                        <span className="text-slate-900">
                          {video.issues ? (
                            <span className="flex items-center space-x-1">
                              {video.issues.stutteredCuts > 0 && <span>{video.issues.stutteredCuts}c</span>}
                              {video.issues.audioSyncIssues && <span>audio</span>}
                              {video.issues.droppedFrames > 0 && <span>{video.issues.droppedFrames}f</span>}
                              {video.issues.corruptedSections > 0 && <span>{video.issues.corruptedSections}s</span>}
                              {video.issues.windNoise && <span>wind</span>}
                            </span>
                          ) : (
                            <span className="text-slate-500">None</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Size:</span>
                        <span className="flex items-center text-slate-900">
                          <HardDrive size={8} className="mr-1" />
                          {formatFileSize(video.fileSize || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Date:</span>
                        <span className="flex items-center text-slate-900">
                          <Calendar size={8} className="mr-1" />
                          {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'No date'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons - Left Aligned at Bottom */}
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-1">
                        {video.status === 'completed' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={`/editor/${video.id}`}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    data-testid={`button-editor-${video.id}`}
                                    className="h-5 w-5 p-0"
                                  >
                                    <Eye size={10} />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-800 text-white rounded px-2 py-1 text-xs">
                                Editor
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        {video.status === 'completed' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleDownload(video.id)}
                            className="bg-blue-600 hover:bg-blue-700 h-5 px-2 text-[10px]"
                            data-testid={`button-download-${video.id}`}
                          >
                            <Download size={8} className="mr-1" />
                            Download
                          </Button>
                        )}
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleAddToDrafts(video.id, video.originalFileName)}
                                className="text-green-600 hover:text-green-700 h-5 w-5 p-0"
                                data-testid={`button-add-to-drafts-${video.id}`}
                              >
                                <Archive size={10} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-green-600 text-white rounded px-2 py-1 text-xs">
                              Drafts
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDeleteVideo(video.id, video.originalFileName)}
                                className="text-red-600 hover:text-red-700 h-5 w-5 p-0"
                                data-testid={`button-delete-${video.id}`}
                              >
                                <Trash2 size={10} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-red-600 text-white rounded px-2 py-1 text-xs">
                              Delete
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <div 
                          className="relative"
                          onMouseEnter={() => {
                            if (shareDropdownTimeout.current) {
                              clearTimeout(shareDropdownTimeout.current);
                              shareDropdownTimeout.current = null;
                            }
                          }}
                          onMouseLeave={() => {
                            if (openShareDropdown === video.id) {
                              shareDropdownTimeout.current = setTimeout(() => {
                                setOpenShareDropdown(null);
                              }, 1000);
                            }
                          }}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => setOpenShareDropdown(openShareDropdown === video.id ? null : video.id)}
                                  className="flex items-center h-5 px-1"
                                  data-testid={`button-share-${video.id}`}
                                >
                                  <Share2 size={8} className="text-blue-500" />
                                  <ChevronDown size={6} className="text-slate-400 ml-0.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-blue-600 text-white rounded px-2 py-1 text-xs">
                                Share
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          {openShareDropdown === video.id && (
                            <div 
                              className="absolute left-0 top-full mt-1 w-32 bg-white rounded shadow-lg border border-slate-200 z-50"
                              onMouseEnter={() => {
                                if (shareDropdownTimeout.current) {
                                  clearTimeout(shareDropdownTimeout.current);
                                  shareDropdownTimeout.current = null;
                                }
                              }}
                              onMouseLeave={() => {
                                shareDropdownTimeout.current = setTimeout(() => {
                                  setOpenShareDropdown(null);
                                }, 1000);
                              }}
                            >
                              <div className="p-1">
                                <button
                                  onClick={() => handleShare(video.id, 'tiktok', video.originalFileName)}
                                  className="w-full flex items-center px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                >
                                  <SiTiktok className="mr-2 text-black" size={10} />
                                  TikTok
                                </button>
                                
                                <button
                                  onClick={() => handleShare(video.id, 'youtube', video.originalFileName)}
                                  className="w-full flex items-center px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                >
                                  <SiYoutube className="mr-2 text-red-600" size={10} />
                                  YouTube
                                </button>
                                
                                <button
                                  onClick={() => handleShare(video.id, 'instagram', video.originalFileName)}
                                  className="w-full flex items-center px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                >
                                  <SiInstagram className="mr-2 text-pink-600" size={10} />
                                  Instagram
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Preview Section */}
                    {previewVideoId === video.id && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="text-center">
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">
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
                                {(user as any)?.plan === 'business' ? (
                                  <AIFixesPanel
                                    videoId={video.id}
                                    videoTitle={video.originalFileName}
                                    currentIssues={video.issues}
                                  />
                                ) : (
                                  <Card className="w-full lg:max-w-sm bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg border border-blue-200">
                                    <div className="p-4 border-b border-blue-200">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <Crown className="text-blue-600" size={20} />
                                        <h3 className="font-semibold text-slate-900">AI Fixes</h3>
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                          Creator Pro+
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-slate-700">
                                        Advanced AI-powered video repair tools
                                      </p>
                                    </div>
                                    
                                    <div className="p-4 space-y-3">
                                      <div className="flex items-start space-x-3">
                                        <Sparkles className="text-blue-500 mt-0.5" size={16} />
                                        <div>
                                          <p className="text-sm font-medium text-slate-900">Cut Smoothing</p>
                                          <p className="text-xs text-slate-600">Fix stuttered cuts automatically</p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-start space-x-3">
                                        <Sparkles className="text-blue-500 mt-0.5" size={16} />
                                        <div>
                                          <p className="text-sm font-medium text-slate-900">Audio Sync</p>
                                          <p className="text-xs text-slate-600">Repair audio synchronization</p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-start space-x-3">
                                        <Sparkles className="text-blue-500 mt-0.5" size={16} />
                                        <div>
                                          <p className="text-sm font-medium text-slate-900">Frame Recovery</p>
                                          <p className="text-xs text-slate-600">Restore dropped frames</p>
                                        </div>
                                      </div>
                                      
                                      <div className="pt-2">
                                        <Link href="/upgrade">
                                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs">
                                            <Crown size={12} className="mr-1" />
                                            Upgrade to Creator Pro+
                                          </Button>
                                        </Link>
                                        <p className="text-xs text-center text-slate-600 mt-2">
                                          Unlock advanced AI features
                                        </p>
                                      </div>
                                    </div>
                                  </Card>
                                )}
                              </div>
                              
                              {/* AI Storyline Panel */}
                              <div className="w-full">
                                {(user as any)?.plan === 'business' ? (
                                  <StorylinePanel
                                    videoId={video.id}
                                    videoTitle={video.originalFileName}
                                  />
                                ) : (
                                  <Card className="w-full lg:max-w-sm bg-gradient-to-br from-orange-50 to-red-50 shadow-lg border border-orange-200">
                                    <div className="p-4 border-b border-orange-200">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <Crown className="text-orange-600" size={20} />
                                        <h3 className="font-semibold text-slate-900">AI Storyline</h3>
                                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                                          Creator Pro+
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-slate-700">
                                        Get AI-powered storyline analysis for your videos
                                      </p>
                                    </div>
                                    
                                    <div className="p-4 space-y-3">
                                      <div className="flex items-start space-x-3">
                                        <Sparkles className="text-orange-500 mt-0.5" size={16} />
                                        <div>
                                          <p className="text-sm font-medium text-slate-900">Scene Analysis</p>
                                          <p className="text-xs text-slate-600">Identify key scenes and transitions</p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-start space-x-3">
                                        <Sparkles className="text-orange-500 mt-0.5" size={16} />
                                        <div>
                                          <p className="text-sm font-medium text-slate-900">Character Detection</p>
                                          <p className="text-xs text-slate-600">Recognize people and objects</p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-start space-x-3">
                                        <Sparkles className="text-orange-500 mt-0.5" size={16} />
                                        <div>
                                          <p className="text-sm font-medium text-slate-900">Mood & Theme Analysis</p>
                                          <p className="text-xs text-slate-600">Understand your video's story</p>
                                        </div>
                                      </div>
                                      
                                      <div className="pt-2 border-t border-orange-200">
                                        <Link href="/subscribe">
                                          <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-sm">
                                            <Crown size={14} className="mr-2" />
                                            Upgrade to Creator Pro+
                                          </Button>
                                        </Link>
                                        <p className="text-xs text-center text-slate-600 mt-2">
                                          Unlock advanced AI features
                                        </p>
                                      </div>
                                    </div>
                                  </Card>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}