import { useState } from "react";
import { useLocation } from "wouter";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import logoImage from "@assets/2_1756109812511.png";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleAuthSuccess = () => {
    setLocation("/");
  };

  const handleSwitchToRegister = () => {
    setActiveTab("register");
  };

  const handleSwitchToLogin = () => {
    setActiveTab("login");
  };

  if (isAuthenticated) {
    return null; // Prevent flash while redirecting
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center pt-2 px-4 pb-8 overflow-x-hidden">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-1">
            <img 
              src="/images/auth-hero.png" 
              alt="SmoothEDIT Logo" 
              className="h-24 sm:h-32 md:h-40 w-auto drop-shadow-xl"
            />
          </div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl hero-title text-center leading-tight">
            Never Lose Another
            <br />
            <span className="text-2xl sm:text-3xl md:text-4xl font-black" style={{ 
              fontFamily: "system-ui, sans-serif",
              background: "linear-gradient(90deg, #3B82F6, #EF4444)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>Video Draft</span>
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="login" data-testid="tab-login" className="text-base min-h-[44px]">Sign In</TabsTrigger>
            <TabsTrigger value="register" data-testid="tab-register" className="text-base min-h-[44px]">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-6">
            <LoginForm 
              onSwitchToRegister={handleSwitchToRegister}
              onSuccess={handleAuthSuccess}
            />
          </TabsContent>
          
          <TabsContent value="register" className="mt-6">
            <RegisterForm 
              onSwitchToLogin={handleSwitchToLogin}
              onSuccess={handleAuthSuccess}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>By signing in, you agree to our terms of service and privacy policy.</p>
        </div>
      </div>
    </div>
  );
}