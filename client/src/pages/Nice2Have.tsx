import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lightbulb, Send, Heart, Star, MessageCircle, User, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ReputationBadge } from "@/components/ReputationBadge";

export default function Nice2Have() {
  const [ideaText, setIdeaText] = useState("");
  const [userName, setUserName] = useState("");
  const { toast } = useToast();

  const { data: ideas, isLoading } = useQuery({
    queryKey: ['/api/ideas'],
    queryFn: async () => {
      const response = await fetch('/api/ideas');
      return response.json();
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['/api/users/leaderboard'],
    queryFn: async () => {
      const response = await fetch('/api/users/leaderboard');
      return response.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const submitIdeaMutation = useMutation({
    mutationFn: async (ideaData: { text: string; userName: string }) => {
      return await apiRequest('POST', '/api/ideas', ideaData);
    },
    onSuccess: () => {
      setIdeaText("");
      setUserName("");
      queryClient.invalidateQueries({ queryKey: ['/api/ideas'] });
      toast({
        title: "Idea submitted!",
        description: "Thanks for your suggestion! We'll review it and consider it for future updates.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to submit idea",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const voteIdeaMutation = useMutation({
    mutationFn: async (ideaId: string) => {
      return await apiRequest('POST', `/api/ideas/${ideaId}/vote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ideas'] });
      toast({
        title: "Vote recorded!",
        description: "Thanks for supporting this idea!",
      });
    },
    onError: () => {
      toast({
        title: "Vote failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaText.trim()) {
      toast({
        title: "Please enter an idea",
        description: "Your idea description is required.",
        variant: "destructive",
      });
      return;
    }
    submitIdeaMutation.mutate({ text: ideaText, userName: userName || "Anonymous" });
  };

  const handleVote = (ideaId: string) => {
    voteIdeaMutation.mutate(ideaId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'considering': return 'bg-yellow-100 text-yellow-800';
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                <Lightbulb className="mr-3 text-yellow-500" size={32} />
                Nice2Have
              </h1>
              <p className="mt-2 text-slate-600">Share your ideas and help shape the future of SmoothEDIT</p>
            </div>
            <Link href="/">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Submit New Idea */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <div className="flex items-center mb-4">
                <Lightbulb className="mr-2 text-yellow-500" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">Submit Your Idea</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="userName" className="text-sm font-medium text-slate-700">
                    Your Name (Optional)
                  </Label>
                  <Input
                    id="userName"
                    type="text"
                    placeholder="John Doe"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="mt-1"
                    data-testid="input-user-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ideaText" className="text-sm font-medium text-slate-700">
                    Your Idea *
                  </Label>
                  <Textarea
                    id="ideaText"
                    placeholder="Describe your feature idea or improvement suggestion..."
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    className="mt-1 min-h-[120px]"
                    required
                    data-testid="textarea-idea"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={submitIdeaMutation.isPending}
                  data-testid="button-submit-idea"
                >
                  {submitIdeaMutation.isPending ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Submit Idea
                    </>
                  )}
                </Button>
              </form>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <Heart className="inline mr-1" size={14} />
                  Your ideas help us build better features! All suggestions are reviewed by our team.
                </p>
              </div>
            </Card>
          </div>

          {/* Ideas List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                <MessageCircle className="mr-2 text-blue-500" size={20} />
                Community Ideas
              </h2>
              <Badge variant="outline" className="text-sm">
                {ideas?.length || 0} ideas submitted
              </Badge>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-slate-500">Loading ideas...</div>
              </div>
            ) : !ideas || ideas.length === 0 ? (
              <Card className="p-8 text-center">
                <Lightbulb className="mx-auto text-slate-400 mb-3" size={48} />
                <p className="text-slate-500">No ideas submitted yet</p>
                <p className="text-sm text-slate-400 mt-1">Be the first to share your suggestion!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {ideas.map((idea: any) => (
                  <Card key={idea.id} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2 flex-wrap gap-2">
                          <div className="flex items-center">
                            <User className="mr-2 text-slate-400" size={16} />
                            <span className="text-sm font-medium text-slate-700">{idea.userName}</span>
                          </div>
                          <ReputationBadge reputation={Math.floor(Math.random() * 500)} size="sm" showReputation={false} />
                          <div className="flex items-center">
                            <Calendar className="mr-1 text-slate-400" size={14} />
                            <span className="text-sm text-slate-500">
                              {new Date(idea.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {idea.status && (
                            <Badge className={`${getStatusColor(idea.status)}`}>
                              {idea.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-800 mb-3">{idea.text}</p>
                        <div className="flex items-center space-x-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleVote(idea.id)}
                            className="text-blue-600 hover:text-blue-700"
                            disabled={voteIdeaMutation.isPending}
                            data-testid={`button-vote-${idea.id}`}
                          >
                            <Star size={16} className="mr-1" />
                            {idea.votes || 0} votes
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Reputation Leaderboard */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <div className="flex items-center mb-4">
                <Trophy className="mr-2 text-yellow-500" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">Reputation Leaders</h2>
              </div>
              
              {leaderboardLoading ? (
                <div className="text-center py-6">
                  <div className="text-slate-500 text-sm">Loading leaderboard...</div>
                </div>
              ) : !leaderboard || leaderboard.length === 0 ? (
                <div className="text-center py-6">
                  <Trophy className="mx-auto text-slate-400 mb-2" size={32} />
                  <p className="text-slate-500 text-sm">No contributors yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((user: any, index: number) => (
                    <div key={user.id} className="flex items-center justify-between" data-testid={`leaderboard-user-${index}`}>
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700 truncate max-w-[100px]">
                            {user.username}
                          </span>
                          <ReputationBadge reputation={user.reputation || 0} size="sm" showReputation={false} />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-900">{user.reputation || 0}</div>
                        <div className="text-xs text-slate-500">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">How to earn reputation:</h3>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Submit ideas: +10 points</li>
                  <li>• Receive votes: +5 points each</li>
                  <li>• Popular ideas get bonus points</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}