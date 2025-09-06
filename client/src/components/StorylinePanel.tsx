import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  BookOpen, 
  Users, 
  Clock, 
  Sparkles, 
  Play, 
  AlertCircle,
  Loader2,
  Tags,
  Brain,
  Star,
  FileText,
  Camera,
  Mic
} from "lucide-react";

interface StorylineScene {
  timestamp: string;
  duration: string;
  description: string;
  emotions: string[];
  keyObjects: string[];
  actions: string[];
}

interface StorylineCharacter {
  name: string;
  description: string;
  appearances: string[];
}

interface StorylineBreakdown {
  id: string;
  videoId: string;
  title: string;
  summary: string;
  scenes: StorylineScene[];
  characters: StorylineCharacter[];
  themes: string[];
  mood: string;
  genre: string;
  confidence: number;
  createdAt: string;
}

interface StorylinePanelProps {
  videoId: string;
  videoTitle: string;
}

export default function StorylinePanel({ videoId, videoTitle }: StorylinePanelProps) {
  const [expandedScene, setExpandedScene] = useState<number | null>(null);
  const { toast } = useToast();

  // Query to check if storyline exists
  const { data: storyline, isLoading: isLoadingStoryline, error } = useQuery({
    queryKey: [`/api/videos/${videoId}/storyline`],
    queryFn: async (): Promise<StorylineBreakdown | null> => {
      const response = await fetch(`/api/videos/${videoId}/storyline`);
      if (response.status === 404) {
        return null; // No storyline exists yet
      }
      if (!response.ok) {
        throw new Error('Failed to fetch storyline');
      }
      return response.json();
    },
    retry: false
  });

  // Mutation to trigger AI analysis
  const analyzeStorylineMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/videos/${videoId}/storyline/analyze`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/storyline`] });
      toast({
        title: "AI Analysis Complete!",
        description: "Your video storyline has been analyzed successfully.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to analyze storyline";
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    analyzeStorylineMutation.mutate();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return "High";
    if (confidence >= 60) return "Medium";
    return "Low";
  };

  if (isLoadingStoryline) {
    return (
      <Card className="w-full h-fit bg-white shadow-lg border border-slate-200">
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <div className="flex items-center space-x-2">
            <BookOpen className="text-purple-600" size={20} />
            <h3 className="font-semibold text-slate-900">AI Storyline</h3>
          </div>
          <p className="text-sm text-slate-600 mt-1">Loading analysis...</p>
        </div>
        <div className="p-8 text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-purple-600" size={32} />
          <p className="text-sm text-slate-600">Checking for storyline analysis...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-fit bg-white shadow-lg border border-slate-200">
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b">
        <div className="flex items-center space-x-2">
          <BookOpen className="text-purple-600" size={20} />
          <h3 className="font-semibold text-slate-900">🎬 AI Storyline</h3>
        </div>
      </div>

      <div className="h-96 overflow-y-auto">
        {!storyline ? (
          // No storyline - show placeholder message
          <div className="p-8 text-center">
            <Brain className="mx-auto mb-4 text-purple-600" size={32} />
            <h4 className="font-medium text-slate-900 mb-2">Discover Story</h4>
            <p className="text-xs text-slate-500">Click "Analyze Storyline" below to discover the story structure, themes, and scenes in your video.</p>
          </div>
        ) : (
          // Show storyline analysis
          <div className="space-y-0">
            {/* Header with title and confidence */}
            <div className="p-4 bg-slate-50 border-b">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-900 text-sm">{storyline.title}</h4>
                <Badge variant="outline" className={`text-xs ${getConfidenceColor(storyline.confidence)}`}>
                  <Star className="mr-1" size={12} />
                  {getConfidenceBadge(storyline.confidence)}
                </Badge>
              </div>
              <p className="text-xs text-slate-600">{storyline.summary}</p>
            </div>

            {/* Genre and Mood */}
            <div className="p-4 border-b">
              <div className="flex items-center space-x-2 mb-2">
                <Camera className="text-purple-600" size={14} />
                <span className="text-xs font-medium text-slate-700">Genre & Mood</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">{storyline.genre}</Badge>
                <Badge variant="outline" className="text-xs">{storyline.mood}</Badge>
              </div>
            </div>

            {/* Themes */}
            {storyline.themes && storyline.themes.length > 0 && (
              <div className="p-4 border-b">
                <div className="flex items-center space-x-2 mb-2">
                  <Tags className="text-purple-600" size={14} />
                  <span className="text-xs font-medium text-slate-700">Key Themes</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {storyline.themes.slice(0, 4).map((theme, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                      {theme}
                    </Badge>
                  ))}
                  {storyline.themes.length > 4 && (
                    <Badge variant="outline" className="text-xs text-slate-500">
                      +{storyline.themes.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Characters */}
            {storyline.characters && storyline.characters.length > 0 && (
              <div className="p-4 border-b">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="text-purple-600" size={14} />
                  <span className="text-xs font-medium text-slate-700">Characters ({storyline.characters.length})</span>
                </div>
                <div className="space-y-2">
                  {storyline.characters.slice(0, 3).map((character, index) => (
                    <div key={index} className="border border-slate-200 rounded p-2">
                      <div className="font-medium text-xs text-slate-900">{character.name}</div>
                      <div className="text-xs text-slate-600 mt-1 leading-relaxed">{character.description}</div>
                      {character.appearances && character.appearances.length > 0 && (
                        <div className="mt-1">
                          <span className="text-xs text-slate-500">Appears: {character.appearances.slice(0, 2).join(', ')}</span>
                          {character.appearances.length > 2 && (
                            <span className="text-xs text-slate-400"> +{character.appearances.length - 2} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {storyline.characters.length > 3 && (
                    <div className="text-xs text-slate-500 text-center py-1">
                      +{storyline.characters.length - 3} more characters
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scenes */}
            {storyline.scenes && storyline.scenes.length > 0 && (
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Clock className="text-purple-600" size={14} />
                  <span className="text-xs font-medium text-slate-700">Scene Breakdown ({storyline.scenes.length})</span>
                </div>
                <div className="space-y-2">
                  {storyline.scenes.slice(0, 5).map((scene, index) => (
                    <div key={index} className="border border-slate-200 rounded">
                      <div 
                        className="p-2 cursor-pointer hover:bg-slate-50"
                        onClick={() => setExpandedScene(expandedScene === index ? null : index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Play className="text-purple-600" size={12} />
                            <span className="text-xs font-medium text-slate-900">{scene.timestamp}</span>
                          </div>
                          <span className="text-xs text-slate-500">{scene.duration}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                          {scene.description}
                        </p>
                      </div>
                      
                      {expandedScene === index && (
                        <div className="border-t border-slate-200 p-2 bg-slate-50">
                          {scene.emotions && scene.emotions.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs font-medium text-slate-700">Emotions: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {scene.emotions.map((emotion, i) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-pink-50 text-pink-700 border-pink-200">
                                    {emotion}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {scene.keyObjects && scene.keyObjects.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs font-medium text-slate-700">Objects: </span>
                              <span className="text-xs text-slate-600">{scene.keyObjects.join(', ')}</span>
                            </div>
                          )}
                          
                          {scene.actions && scene.actions.length > 0 && (
                            <div>
                              <span className="text-xs font-medium text-slate-700">Actions: </span>
                              <span className="text-xs text-slate-600">{scene.actions.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {storyline.scenes.length > 5 && (
                    <div className="text-xs text-slate-500 text-center py-1">
                      +{storyline.scenes.length - 5} more scenes
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Action Button Footer */}
      <div className="p-4 bg-slate-50 border-t">
        <div className="space-y-3">
          {/* Stats */}
          <div className="flex justify-between text-xs text-slate-600">
            <span>{storyline ? `${storyline.scenes?.length || 0} scenes` : 'No analysis'}</span>
            {storyline && <span>{storyline.confidence}% confidence</span>}
          </div>
          
          <Button 
            onClick={handleAnalyze}
            disabled={analyzeStorylineMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            data-testid="analyze-storyline-button"
          >
            {analyzeStorylineMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing story...</span>
              </div>
            ) : storyline ? (
              <>
                <Brain size={16} className="mr-2" />
                Re-analyze Storyline
              </>
            ) : (
              <>
                <Sparkles size={16} className="mr-2" />
                Analyze Storyline
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}