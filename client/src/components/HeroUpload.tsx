import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ProcessingStatus from "./ProcessingStatus";
import logoImage from "@assets/2_1756109812511.png";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function HeroUpload() {
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [processingVideoId, setProcessingVideoId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
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
      const completeResponse = await apiRequest('POST', '/api/videos/upload-complete', {
        fileName: file.name,
        fileSize: file.size.toString(),
        uploadUrl: uploadUrl,
      });
      
      return completeResponse.json();
    },
    onSuccess: (data) => {
      setProcessingVideoId(data.videoId);
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Upload successful!",
        description: "Your video is being processed. We'll fix any issues automatically.",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please create an account or sign in to upload videos.",
        variant: "default",
      });
      return;
    }
    
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadingFiles([file]);
      uploadMutation.mutate(file);
    }
  }, [uploadMutation, isAuthenticated, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi']
    },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12" id="upload">
      <div className="text-center mb-2">
        <div className="flex justify-center mb-1">
          <img 
            src={logoImage} 
            alt="SmoothEDIT Logo" 
            className="h-48 sm:h-64 md:h-80 lg:h-96 w-auto drop-shadow-xl"
          />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl hero-title">
          Never Lose Another{' '}
          <span className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black" style={{ 
            fontFamily: "system-ui, sans-serif",
            background: "linear-gradient(90deg, #3B82F6, #EF4444)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>Video Draft</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-slate-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          AI-powered video repair and cloud backup for creators. Fix glitches, recover drafts, and export perfect videos every time.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div
          {...getRootProps()}
          className={`bg-white rounded-2xl shadow-lg border-2 border-dashed transition-colors duration-200 p-12 cursor-pointer
            ${isDragActive ? 'border-primary-500' : 'border-slate-300 hover:border-primary-500'}`}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <CloudUpload className="mx-auto text-6xl text-slate-400 mb-6" size={96} />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Drop your video here</h3>
            <p className="text-slate-500 mb-6">Or click to browse files</p>
            
            <div className="space-y-3">
              {isAuthenticated ? (
                <Button 
                  className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3"
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Choose Files'}
                </Button>
              ) : (
                <Link href="/auth">
                  <Button 
                    className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3"
                  >
                    Sign in to Upload Videos
                  </Button>
                </Link>
              )}
              <div className="text-sm text-slate-400">
                Supports MP4, MOV, AVI up to 2GB
              </div>
            </div>
          </div>
        </div>

        {processingVideoId && (
          <ProcessingStatus 
            videoId={processingVideoId} 
            fileName={uploadingFiles[0]?.name || 'Unknown file'}
          />
        )}
      </div>
    </section>
  );
}
