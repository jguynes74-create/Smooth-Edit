import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      slug: "starter",
      price: "$0",
      period: "/month",
      features: [
        "5 videos per month",
        "Basic AI fixes",
        "1080p export quality",
        "Draft backup (7 days)"
      ],
      buttonText: "Get Started Free",
      buttonVariant: "outline" as const,
      popular: false
    },
    {
      name: "Creator Pro",
      slug: "creator-pro",
      price: "$15",
      period: "/month",
      features: [
        "50 videos/month",
        "Advanced AI repair",
        "4K export quality",
        "Smart captions",
        "Draft backup (30 days)",
        "Priority processing"
      ],
      buttonText: "Start Pro Trial",
      buttonVariant: "default" as const,
      popular: true
    },
    {
      name: "Creator Pro+",
      slug: "business",
      price: "$30",
      period: "/month",
      features: [
        "Everything in Pro",
        "Unlimited videos",
        "Team collaboration",
        "Brand templates",
        "API access",
        "Analytics dashboard",
        "Priority support"
      ],
      buttonText: "Start Creator Pro+",
      buttonVariant: "outline" as const,
      popular: false
    }
  ];

  return (
    <section className="py-16 bg-white" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, Creator-Friendly Pricing</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Choose the plan that fits your content creation needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`p-8 relative ${
                plan.popular 
                  ? 'bg-primary-600 text-white ring-2 ring-primary-600' 
                  : 'bg-slate-50'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-secondary-500">
                  Most Popular
                </Badge>
              )}
              
              <div className="text-center">
                <h3 className={`text-xl font-semibold mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  <span className={plan.popular ? 'text-primary-200' : 'text-slate-500'}>
                    {plan.period}
                  </span>
                </div>
                
                <ul className="text-left space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check 
                        className={`mr-3 ${plan.popular ? 'text-green-400' : 'text-green-600'}`} 
                        size={16} 
                      />
                      <span className={plan.popular ? 'text-white' : 'text-slate-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Link href={`/subscribe/${plan.slug}`}>
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-white hover:bg-slate-50 text-primary-600' 
                        : plan.buttonVariant === 'outline'
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                    variant={plan.popular ? 'secondary' : plan.buttonVariant}
                    data-testid={`button-plan-${plan.slug}`}
                  >
                    {plan.buttonText}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-600">
            <Check className="inline mr-2 text-green-600" size={16} />
            30-day money-back guarantee on all paid plans
          </p>
        </div>
      </div>
    </section>
  );
}
