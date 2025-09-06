import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export function VerifyEmail() {
  const [location, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
          setStatus("error");
          setMessage("Invalid verification link. Please check your email for the correct link.");
          return;
        }

        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to verify email. The link may be expired or invalid.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to verify email. Please try again later.");
      }
    };

    verifyEmail();
  }, []);

  const handleContinue = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-2 px-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "loading" && (
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" && "Verifying your email..."}
            {status === "success" && "Email verified!"}
            {status === "error" && "Verification failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-slate-600">{message}</p>
          
          {status === "success" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Your account is now verified. You can log in and start using SmoothEDIT.
              </p>
              <Button 
                onClick={handleContinue}
                className="w-full"
                data-testid="button-continue-to-login"
              >
                Continue to Login
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Please check your email for a new verification link or contact support if the problem persists.
              </p>
              <Button 
                onClick={handleContinue}
                variant="outline"
                className="w-full"
                data-testid="button-back-to-login"
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}