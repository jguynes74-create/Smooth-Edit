import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import { VerifyEmail } from "@/pages/VerifyEmail";
import FontPreview from "@/components/FontPreview";
import VideoDetails from "@/pages/VideoDetails";
import Drafts from "@/pages/Drafts";
import Editor from "@/pages/Editor";
import Nice2Have from "@/pages/Nice2Have";
import Subscribe from "@/pages/Subscribe";
import Admin from "@/pages/Admin";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/not-found";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes - accessible to everyone */}
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/fonts" component={FontPreview} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      
      {/* Protected routes - require authentication */}
      {isAuthenticated ? (
        <>
          <Route path="/videos" component={VideoDetails} />
          <Route path="/drafts" component={Drafts} />
          <Route path="/editor/:videoId?" component={Editor} />
          <Route path="/nice2have" component={Nice2Have} />
          <Route path="/subscribe/:plan" component={Subscribe} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          {/* Redirect unauthenticated users trying to access protected routes to auth */}
          <Route path="/videos" component={Auth} />
          <Route path="/drafts" component={Auth} />
          <Route path="/editor/:videoId?" component={Auth} />
          <Route path="/nice2have" component={Auth} />
          <Route path="/subscribe/:plan" component={Auth} />
          <Route path="/admin" component={Auth} />
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
