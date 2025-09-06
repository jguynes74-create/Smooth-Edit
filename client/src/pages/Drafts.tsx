import { useQuery } from "@tanstack/react-query";
import { Shield, Download, Archive, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Drafts() {
  const { toast } = useToast();

  const { data: drafts, isLoading } = useQuery({
    queryKey: ['/api/drafts'],
    queryFn: async () => {
      const response = await fetch('/api/drafts');
      return response.json();
    },
    refetchInterval: 5000,
  });

  const handleRestore = (draftId: string) => {
    toast({
      title: "Draft restored",
      description: "Your draft has been restored successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading drafts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Cloud Backup</h1>
              <p className="text-slate-600 mt-2">Manage your automatically saved video drafts</p>
            </div>
            <Link href="/videos">
              <Button variant="ghost" size="sm">
                ← Back to Library
              </Button>
            </Link>
          </div>
        </div>

        {/* Drafts Details */}
        <Card className="overflow-hidden h-[50vh]">
          <div className="px-4 py-2 bg-green-50 border-b">
            <h2 className="text-base font-semibold text-slate-900">Cloud Backup Drafts</h2>
          </div>
          
          <div className="overflow-y-auto h-full p-3">
            {!drafts || drafts.length === 0 ? (
              <div className="p-8 text-center">
                <Shield className="mx-auto text-slate-400 mb-3" size={48} />
                <p className="text-slate-500">No backup drafts yet</p>
                <Link href="/">
                  <Button className="mt-4">Upload Your First Video</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {drafts.map((draft: any) => (
                  <Card key={draft.id} className="p-3 hover:shadow-md transition-shadow">
                    {/* Draft Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-10 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Shield className="text-green-600" size={16} />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-900">
                            {draft.fileName}
                          </div>
                          <div className="text-xs text-slate-500">ID: {draft.id.substring(0, 8)}</div>
                        </div>
                      </div>
                      <Badge className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Shield size={12} className="mr-1" />
                        <span className="ml-1">Backup</span>
                      </Badge>
                    </div>

                    {/* Draft Details Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                      <div>
                        <div className="text-slate-500 mb-1">Backup Date</div>
                        <div className="flex items-center text-slate-900">
                          <Clock size={12} className="mr-1" />
                          {new Date(draft.lastModified).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-1">Auto-Saved</div>
                        <div className="flex items-center text-slate-900">
                          <Archive size={12} className="mr-1" />
                          {new Date(draft.lastModified).toLocaleTimeString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-1">Type</div>
                        <div className="flex items-center text-slate-900">
                          <FileText size={12} className="mr-1" />
                          Draft Backup
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center">
                      <div className="flex items-center space-x-1">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 h-7 px-2 text-xs"
                          onClick={() => handleRestore(draft.id)}
                        >
                          <Archive size={12} className="mr-1" />
                          Restore
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7 px-2"
                        >
                          <Download size={12} />
                        </Button>
                      </div>
                    </div>
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