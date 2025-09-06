import { useRoute } from "wouter";
import { useState } from "react";
import { ArrowLeft, Check, Zap, Users, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { Link } from "wouter";

const planDetails = {
  starter: {
    name: "Starter",
    price: "$0",
    period: "/month",
    icon: Zap,
    color: "from-green-500 to-emerald-600",
    features: [
      "5 videos per month",
      "Basic AI fixes",
      "1080p export quality",
      "Draft backup (7 days)"
    ],
    description: "Perfect for getting started with AI video processing",
    popular: false
  },
  "creator-pro": {
    name: "Creator Pro",
    price: "$15",
    period: "/month",
    icon: Zap,
    color: "from-blue-500 to-purple-600",
    features: [
      "50 videos/month",
      "Advanced AI repair",
      "4K export quality",
      "Smart captions",
      "Draft backup (30 days)",
      "Priority processing"
    ],
    description: "Advanced features for serious content creators",
    popular: true
  },
  business: {
    name: "Creator Pro+",
    price: "$30",
    period: "/month",
    icon: Building,
    color: "from-orange-500 to-red-600",
    features: [
      "Everything in Pro",
      "Unlimited videos",
      "Team collaboration",
      "Brand templates",
      "API access",
      "Analytics dashboard",
      "Priority support"
    ],
    description: "Complete solution for teams and businesses",
    popular: false
  }
};

type PlanType = keyof typeof planDetails;

export default function Subscribe() {
  const [, params] = useRoute("/subscribe/:plan");
  const planKey = params?.plan as PlanType;
  const plan = planDetails[planKey];
  const [step, setStep] = useState<'plan' | 'account' | 'payment'>('plan');

  if (!plan) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Plan Not Found</h1>
          <p className="text-slate-600 mb-8">The subscription plan you're looking for doesn't exist.</p>
          <Link href="/#pricing">
            <Button>View All Plans</Button>
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = plan.icon;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center ${step === 'plan' ? 'text-primary-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-2 ${
                step === 'plan' ? 'bg-primary-600 text-white' : 'bg-slate-200'
              }`}>1</div>
              Choose Plan
            </div>
            <div className={`w-16 h-0.5 ${step !== 'plan' ? 'bg-primary-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center ${step === 'account' ? 'text-primary-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-2 ${
                step === 'account' ? 'bg-primary-600 text-white' : 'bg-slate-200'
              }`}>2</div>
              Account Setup
            </div>
            <div className={`w-16 h-0.5 ${step === 'payment' ? 'bg-primary-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center ${step === 'payment' ? 'text-primary-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-2 ${
                step === 'payment' ? 'bg-primary-600 text-white' : 'bg-slate-200'
              }`}>3</div>
              Payment
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Plan Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}>
                <IconComponent className="w-8 h-8 text-white" />
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                {plan.popular && (
                  <Badge className="bg-primary-600">Popular</Badge>
                )}
              </div>
              
              <p className="text-slate-600 text-sm mb-4">{plan.description}</p>
              
              <div className="mb-6">
                <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-slate-500">{plan.period}</span>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">What's included:</h4>
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    <span className="text-slate-600">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center text-green-800 text-sm">
                  <Check className="w-4 h-4 mr-2" />
                  30-day money-back guarantee
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6">
              <Link href="/#pricing">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Plans
                </Button>
              </Link>
            </div>

            {step === 'plan' && (
              <PlanConfirmation 
                plan={plan} 
                onContinue={() => setStep('account')} 
              />
            )}

            {step === 'account' && (
              <AccountSetup 
                onBack={() => setStep('plan')}
                onContinue={() => setStep('payment')} 
              />
            )}

            {step === 'payment' && (
              <PaymentForm 
                plan={plan}
                onBack={() => setStep('account')} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanConfirmation({ plan, onContinue }: { plan: any; onContinue: () => void }) {
  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Confirm Your Plan</h2>
      <p className="text-slate-600 mb-8">
        You've selected the <strong>{plan.name}</strong> plan. This gives you access to all the features listed.
      </p>
      
      {plan.price === "$0" ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Free Plan Benefits</h3>
          <p className="text-blue-800 text-sm">
            Start processing videos immediately with no payment required. You can upgrade anytime as your needs grow.
          </p>
        </div>
      ) : (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-purple-900 mb-2">7-Day Free Trial</h3>
          <p className="text-purple-800 text-sm">
            Try all premium features risk-free for 7 days. Cancel anytime during the trial period with no charges.
          </p>
        </div>
      )}
      
      <Button 
        onClick={onContinue} 
        className="w-full bg-primary-600 hover:bg-primary-700"
        data-testid="button-continue-plan"
      >
        Continue to Account Setup
      </Button>
    </Card>
  );
}

function AccountSetup({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    onContinue();
  };

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Create Your Account</h2>
      <p className="text-slate-600 mb-8">
        Set up your SmoothEDIT account to get started with AI video processing.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            data-testid="input-name"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            data-testid="input-email"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            required
            minLength={8}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            data-testid="input-password"
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            data-testid="input-confirm-password"
          />
        </div>
        
        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            className="flex-1"
            data-testid="button-back-account"
          >
            Back
          </Button>
          <Button 
            type="submit"
            className="flex-1 bg-primary-600 hover:bg-primary-700"
            data-testid="button-continue-account"
          >
            Continue to Payment
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PaymentForm({ plan, onBack }: { plan: any; onBack: () => void }) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo purposes, show success
    alert(`Successfully subscribed to ${plan.name} plan! Welcome to SmoothEDIT.`);
    setLoading(false);
  };

  if (plan.price === "$0") {
    return (
      <Card className="p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Complete Setup</h2>
        <p className="text-slate-600 mb-8">
          No payment required for the Starter plan. Click below to activate your account and start processing videos!
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-green-900 mb-2">Free Account Benefits</h3>
          <ul className="text-green-800 text-sm space-y-1">
            <li>• Start processing videos immediately</li>
            <li>• No credit card required</li>
            <li>• Upgrade anytime as you grow</li>
          </ul>
        </div>
        
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex-1"
            data-testid="button-back-payment"
          >
            Back
          </Button>
          <Button 
            onClick={() => alert('Free account activated! Welcome to SmoothEDIT.')}
            className="flex-1 bg-green-600 hover:bg-green-700"
            data-testid="button-activate-free"
          >
            Activate Free Account
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Payment Information</h2>
      <p className="text-slate-600 mb-8">
        Enter your payment details to start your 7-day free trial. You won't be charged until the trial ends.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-4">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-4 border rounded-lg flex items-center justify-center ${
                paymentMethod === 'card' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-slate-300'
              }`}
              data-testid="button-payment-card"
            >
              Credit Card
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('paypal')}
              className={`p-4 border rounded-lg flex items-center justify-center ${
                paymentMethod === 'paypal' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-slate-300'
              }`}
              data-testid="button-payment-paypal"
            >
              PayPal
            </button>
          </div>
        </div>

        {paymentMethod === 'card' && (
          <>
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-slate-700 mb-2">
                Card Number
              </label>
              <input
                type="text"
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                data-testid="input-card-number"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiry" className="block text-sm font-medium text-slate-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  id="expiry"
                  placeholder="MM/YY"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  data-testid="input-expiry"
                />
              </div>
              <div>
                <label htmlFor="cvc" className="block text-sm font-medium text-slate-700 mb-2">
                  CVC
                </label>
                <input
                  type="text"
                  id="cvc"
                  placeholder="123"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  data-testid="input-cvc"
                />
              </div>
            </div>
          </>
        )}

        {paymentMethod === 'paypal' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-blue-800 text-sm">
              You'll be redirected to PayPal to complete your payment securely.
            </p>
          </div>
        )}
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <strong>7-Day Free Trial:</strong> Your trial starts today. You can cancel anytime during the trial with no charges.
            After the trial, you'll be billed {plan.price}{plan.period}.
          </p>
        </div>
        
        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            className="flex-1"
            disabled={loading}
            data-testid="button-back-payment"
          >
            Back
          </Button>
          <Button 
            type="submit"
            className="flex-1 bg-primary-600 hover:bg-primary-700"
            disabled={loading}
            data-testid="button-start-trial"
          >
            {loading ? 'Processing...' : 'Start Free Trial'}
          </Button>
        </div>
      </form>
    </Card>
  );
}