import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Martinez",
      handle: "@sarahcooks",
      followers: "125k followers",
      avatar: "SM",
      avatarColor: "bg-primary-600",
      content: "SmoothEDIT saved my entire cooking series when TikTok crashed and I lost 3 hours of editing. The AI fixes are incredible!"
    },
    {
      name: "Marcus Johnson",
      handle: "@marcusfitness",
      followers: "89k followers",
      avatar: "MJ",
      avatarColor: "bg-green-600",
      content: "The auto-caption feature is a game changer. What used to take me 30 minutes now happens instantly, and the accuracy is amazing."
    },
    {
      name: "Alex Liu",
      handle: "@techwithalex",
      followers: "234k followers",
      avatar: "AL",
      avatarColor: "bg-purple-600",
      content: "Finally, a tool that understands creator problems. The cloud backup feature alone is worth the subscription price."
    }
  ];

  return (
    <section className="py-16 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Loved by Creators Everywhere</h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">See what creators are saying about SmoothEDIT</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-slate-800 text-white p-6 border-slate-700">
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 ${testimonial.avatarColor} rounded-full flex items-center justify-center text-white font-bold`}>
                  {testimonial.avatar}
                </div>
                <div className="ml-4">
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-slate-400">{testimonial.handle} • {testimonial.followers}</p>
                </div>
              </div>
              <p className="text-slate-300 mb-4">{testimonial.content}</p>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
