import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ProcessingJob } from "@shared/schema";

interface ProcessingStatusProps {
  videoId: string;
  fileName: string;
}

export default function ProcessingStatus({ videoId, fileName }: ProcessingStatusProps) {
  const { data: job, isLoading } = useQuery<ProcessingJob>({
    queryKey: ['/api/videos', videoId, 'status'],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${videoId}/status`);
      return response.json();
    },
    refetchInterval: (data) => data?.status === 'processing' ? 2000 : false,
  });

  if (isLoading || !job) return null;

  const getStepDisplay = (step: string) => {
    const steps = {
      'analyzing': 'Analyzing video issues...',
      'fixing_cuts': 'Fixing stuttered cuts...',
      'fixing_audio': 'Repairing audio sync...',
      'recovering_frames': 'Recovering dropped frames...',
      'adding_captions': 'Adding captions...',
      'exporting': 'Exporting video...',
    };
    return steps[step as keyof typeof steps] || step;
  };

  const estimatedMinutes = job.estimatedTimeRemaining ? Math.ceil(job.estimatedTimeRemaining / 60) : 2;

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-slate-900">Processing: {fileName}</h4>
        <span className="text-sm text-slate-500">
          {job.status === 'processing' ? `${estimatedMinutes} min remaining` : 'Complete'}
        </span>
      </div>
      
      <Progress value={job.progress || 0} className="mb-4" />
      
      {job.status === 'processing' && job.currentStep && (
        <div className="text-sm text-blue-600 mb-4">
          <Clock className="inline mr-2" size={16} />
          {getStepDisplay(job.currentStep)}
        </div>
      )}
      
      {job.status === 'completed' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center text-green-600">
            <CheckCircle className="mr-2" size={16} />
            Processing complete!
          </div>
          <div className="flex items-center text-green-600">
            <CheckCircle className="mr-2" size={16} />
            Issues fixed automatically
          </div>
          <div className="flex items-center text-green-600">
            <CheckCircle className="mr-2" size={16} />
            Ready for download
          </div>
        </div>
      )}
      
      {job.status === 'failed' && (
        <div className="text-red-600 text-sm">
          Processing failed: {job.errorMessage || 'Unknown error'}
        </div>
      )}
    </div>
  );
}
