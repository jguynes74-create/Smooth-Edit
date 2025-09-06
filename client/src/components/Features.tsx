import { Scissors, Volume2, Film, Captions, Cloud, Download } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Features() {
  const features = [
    {
      icon: Scissors,
      title: "Fix Stuttered Cuts",
      description: "Automatically detects and smooths out choppy transitions and awkward jump cuts that make your videos look unprofessional.",
      color: "primary"
    },
    {
      icon: Volume2,
      title: "Audio Sync Repair",
      description: "Fixes audio drift and sync issues that commonly occur when recording or editing on mobile devices.",
      color: "green"
    },
    {
      icon: Film,
      title: "Frame Recovery", 
      description: "Recovers dropped frames and fixes corrupted sections that can occur during recording or export glitches.",
      color: "blue"
    },
    {
      icon: Captions,
      title: "Smart Captions",
      description: "Generate accurate captions that are better than platform defaults, with proper timing and formatting.",
      color: "blue"
    },
    {
      icon: Cloud,
      title: "Cloud Backup",
      description: "Automatically backup your drafts and projects so you never lose hours of work to app crashes again.",
      color: "orange"
    },
    {
      icon: Download,
      title: "Perfect Export",
      description: "Export videos optimized for TikTok, Instagram Reels, and YouTube Shorts with correct specifications every time.",
      color: "red"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      primary: "bg-primary-100 text-primary-600",
      green: "bg-green-100 text-green-600", 
      blue: "bg-blue-100 text-blue-600",
      orange: "bg-orange-100 text-orange-600",
      red: "bg-red-100 text-red-600"
    };
    return colors[color as keyof typeof colors] || colors.primary;
  };

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">AI-Powered Video Repair</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Our advanced AI automatically detects and fixes the most common video issues that frustrate creators
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-8 hover:shadow-md transition-shadow duration-200">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 ${getColorClasses(feature.color)}`}>
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
