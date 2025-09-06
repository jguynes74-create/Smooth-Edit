import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Volume2, 
  Video, 
  Smartphone, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Sparkles,
  WindIcon,
  Eye,
  Camera,
  Palette
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AIFixesPanelProps {
  videoId: string;
  videoTitle: string;
  currentIssues?: {
    stutteredCuts?: number;
    audioSyncIssues?: boolean;
    droppedFrames?: number;
    corruptedSections?: number;
    windNoise?: boolean;
    shakyFootage?: boolean;
    poorLighting?: boolean;
    blurrySection?: boolean;
  };
}

interface AIFix {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'audio' | 'visual' | 'platform';
  enabled: boolean;
  processing: boolean;
  completed: boolean;
  progress: number;
  detected?: boolean;
}

export default function AIFixesPanel({ videoId, videoTitle, currentIssues }: AIFixesPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [fixes, setFixes] = useState<AIFix[]>([
    // Audio Enhancements
    {
      id: 'wind-noise',
      name: 'Remove Wind Noise',
      description: 'Eliminate background wind and environmental noise',
      icon: <WindIcon size={16} />,
      category: 'audio',
      enabled: false,
      processing: false,
      completed: false,
      progress: 0,
      detected: currentIssues?.windNoise
    },
    {
      id: 'audio-sync',
      name: 'Fix Audio Sync',
      description: 'Synchronize audio with video perfectly',
      icon: <Volume2 size={16} />,
      category: 'audio',
      enabled: false,
      processing: false,
      completed: false,
      progress: 0,
      detected: currentIssues?.audioSyncIssues
    },
    {
      id: 'voice-enhance',
      name: 'Boost Voice Clarity',
      description: 'Enhance dialogue and reduce background noise',
      icon: <Sparkles size={16} />,
      category: 'audio',
      enabled: false,
      processing: false,
      completed: false,
      progress: 0
    },
    
    // Visual Improvements
    {
      id: 'stabilize',
      name: 'Stabilize Footage',
      description: 'Remove camera shake and smooth movement',
      icon: <Camera size={16} />,
      category: 'visual',
      enabled: false,
      processing: false,
      completed: false,
      progress: 0,
      detected: currentIssues?.shakyFootage
    },
    {
      id: 'color-correct',
      name: 'Auto Color Correction',
      description: 'Optimize colors, brightness, and contrast',
      icon: <Palette size={16} />,
      category: 'visual',
      enabled: false,
      processing: false,
      completed: false,
      progress: 0,
      detected: currentIssues?.poorLighting
    },
    {
      id: 'sharpen',
      name: 'Sharpen Blurry Sections',
      description: 'Enhance clarity and focus throughout video',
      icon: <Eye size={16} />,
      category: 'visual',
      enabled: false,
      processing: false,
      completed: false,
      progress: 0,
      detected: currentIssues?.blurrySection
    },
    
    // Platform Optimization
    {
      id: 'tiktok-optimize',
      name: 'TikTok Ready (9:16)',
      description: 'Optimize aspect ratio and quality for TikTok',
      icon: <Smartphone size={16} />,
      category: 'platform',
      enabled: false,
      processing: false,
      completed: false,
      progress: 0
    },
    {
      id: 'instagram-optimize',
      name: 'Instagram Reels',
      description: 'Perfect format and compression for Instagram',
      icon: <Video size={16} />,
      category: 'platform',
      enabled: false,
      processing: false,
      completed: false,
      progress: 0
    },
    {
      id: 'youtube-optimize',
      name: 'YouTube Shorts',
      description: 'Optimized encoding for YouTube platform',
      icon: <Settings size={16} />,
      category: 'platform',
      enabled: false,
      processing: false,
      completed: false,
      progress: 0
    }
  ]);

  const applyFixesMutation = useMutation({
    mutationFn: async (selectedFixes: string[]) => {
      const response = await apiRequest('POST', `/api/videos/${videoId}/apply-fixes`, {
        fixes: selectedFixes
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI fixes started!",
        description: `Processing ${data.fixesApplied} enhancements. This may take a few minutes.`,
      });
      
      // Start simulated progress for enabled fixes
      const enabledFixes = fixes.filter(fix => fix.enabled).map(fix => fix.id);
      enabledFixes.forEach(fixId => {
        simulateProgress(fixId);
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
    },
    onError: () => {
      toast({
        title: "Failed to apply fixes",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const simulateProgress = (fixId: string) => {
    setFixes(prev => prev.map(fix => 
      fix.id === fixId 
        ? { ...fix, processing: true, progress: 0 }
        : fix
    ));

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15 + 5;
      
      if (currentProgress >= 100) {
        currentProgress = 100;
        setFixes(prev => prev.map(fix => 
          fix.id === fixId 
            ? { ...fix, processing: false, completed: true, enabled: false, progress: 100 }
            : fix
        ));
        clearInterval(interval);
      } else {
        setFixes(prev => prev.map(fix => 
          fix.id === fixId 
            ? { ...fix, progress: currentProgress }
            : fix
        ));
      }
    }, 1000 + Math.random() * 1000);
  };

  const toggleFix = (fixId: string) => {
    console.log('Toggling fix:', fixId); // Debug log
    setFixes(prev => prev.map(fix => 
      fix.id === fixId && !fix.completed && !fix.processing
        ? { ...fix, enabled: !fix.enabled }
        : fix
    ));
  };

  const handleApplyFixes = () => {
    const selectedFixes = fixes.filter(fix => fix.enabled && !fix.completed && !fix.processing).map(fix => fix.id);
    
    if (selectedFixes.length === 0) {
      toast({
        title: "No fixes selected",
        description: "Please select at least one enhancement to apply.",
        variant: "destructive",
      });
      return;
    }
    
    applyFixesMutation.mutate(selectedFixes);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'audio': return <Volume2 size={18} className="text-blue-500" />;
      case 'visual': return <Video size={18} className="text-green-500" />;
      case 'platform': return <Smartphone size={18} className="text-purple-500" />;
      default: return <Zap size={18} className="text-orange-500" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'audio': return 'Audio Enhancements';
      case 'visual': return 'Visual Improvements';
      case 'platform': return 'Platform Optimization';
      default: return 'AI Fixes';
    }
  };

  const selectedCount = fixes.filter(fix => fix.enabled).length;
  const processingCount = fixes.filter(fix => fix.processing).length;
  const completedCount = fixes.filter(fix => fix.completed).length;
  const detectedIssues = fixes.filter(fix => fix.detected);

  return (
    <Card className="w-full h-fit bg-white shadow-lg border border-slate-200">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <div className="flex items-center space-x-2">
          <Zap className="text-blue-600" size={20} />
          <h3 className="font-semibold text-slate-900">Quick AI Fixes</h3>
        </div>
      </div>


      <div className="h-96 overflow-y-auto">
        {/* Group fixes by category */}
        {['audio', 'visual', 'platform'].map(category => {
          const categoryFixes = fixes.filter(fix => fix.category === category);
          
          return (
            <div key={category} className="border-b border-slate-100 last:border-b-0">
              <div className="p-3 bg-slate-50 flex items-center space-x-2">
                {getCategoryIcon(category)}
                <span className="text-sm font-medium text-slate-700">
                  {getCategoryName(category)}
                </span>
              </div>
              
              <div className="p-4 space-y-3">
                {categoryFixes.map(fix => (
                  <div key={fix.id} className="flex items-start space-x-3">
                    {/* Toggle button on the left */}
                    <div className="flex items-center mt-0.5">
                      <button
                        onClick={() => toggleFix(fix.id)}
                        disabled={fix.processing || fix.completed}
                        className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
                          fix.enabled 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'border-slate-300 bg-white hover:border-blue-400'
                        } ${fix.processing || fix.completed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        data-testid={`toggle-${fix.id}`}
                      >
                        {fix.enabled && <CheckCircle size={12} />}
                      </button>
                    </div>
                    
                    {/* Fix details on the right */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {fix.detected && (
                          <AlertTriangle size={12} className="text-amber-500" />
                        )}
                        <span className="text-sm font-medium text-slate-900">
                          {fix.name}
                        </span>
                        {fix.completed && (
                          <CheckCircle size={14} className="text-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {fix.description}
                      </p>
                      
                      {fix.processing && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                            <span>Processing...</span>
                            <span>{Math.round(fix.progress)}%</span>
                          </div>
                          <Progress value={fix.progress} className="h-1" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      <div className="p-4 bg-slate-50 border-t">
        <div className="space-y-3">
          {/* Stats */}
          <div className="flex justify-between text-xs text-slate-600">
            <span>{selectedCount} selected</span>
            {processingCount > 0 && <span>{processingCount} processing</span>}
            {completedCount > 0 && <span>{completedCount} completed</span>}
          </div>
          
          <Button
            onClick={handleApplyFixes}
            disabled={selectedCount === 0 || applyFixesMutation.isPending || processingCount > 0}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {applyFixesMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Starting fixes...</span>
              </div>
            ) : processingCount > 0 ? (
              `Processing ${processingCount} fix${processingCount > 1 ? 'es' : ''}...`
            ) : (
              <>
                <Sparkles size={16} className="mr-2" />
                Apply Selected Fixes ({selectedCount})
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}