import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
}

export function LoginForm({ onSwitchToRegister, onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [userEmailForVerification, setUserEmailForVerification] = useState("");
  const { login, isLoggingIn, loginError, resendVerification, isResendingVerification } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      toast({
        title: "Login successful",
        description: "Welcome back!",
        duration: 3000, // Auto-dismiss after 3 seconds
      });
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid credentials";
      
      // Check if it's an email verification error
      if (errorMessage.includes("Email not verified") || errorMessage.includes("verification")) {
        setShowVerificationMessage(true);
        setUserEmailForVerification(data.username);
        toast({
          title: "Email not verified",
          description: "Please verify your email before logging in.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerification(userEmailForVerification);
      toast({
        title: "Verification email sent",
        description: "Please check your inbox for the verification link.",
      });
    } catch (error) {
      toast({
        title: "Failed to resend email",
        description: error instanceof Error ? error.message : "Failed to resend verification email",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username or Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your username or email"
                      {...field}
                      data-testid="input-username"
                      autoComplete="username"
                      inputMode="email"
                      className="text-base" // Prevents zoom on iOS
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...field}
                        data-testid="input-password"
                        autoComplete="current-password"
                        className="text-base pr-12" // Prevents zoom on iOS, more space for toggle button
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent min-w-[44px] min-h-[44px] flex items-center justify-center"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-password"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {loginError && (
              <div className="text-sm text-destructive text-center">
                {loginError.message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full min-h-[48px] text-base"
              disabled={isLoggingIn}
              data-testid="button-login"
            >
              {isLoggingIn ? (
                "Signing in..."
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
            
            <div className="text-center">
              <a href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline" data-testid="link-forgot-password">
                Forgot your password?
              </a>
            </div>
          </form>
        </Form>

        {showVerificationMessage && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <div className="text-center space-y-2">
              <p className="text-sm text-amber-800">
                Your email address needs to be verified before you can log in.
              </p>
              <Button 
                onClick={handleResendVerification}
                disabled={isResendingVerification}
                variant="outline"
                size="sm"
                className="mt-2"
                data-testid="button-resend-verification-login"
              >
                {isResendingVerification ? "Sending..." : "Resend verification email"}
              </Button>
            </div>
          </div>
        )}

        {onSwitchToRegister && (
          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-primary underline-offset-4 hover:underline"
              data-testid="link-register"
            >
              Sign up
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}