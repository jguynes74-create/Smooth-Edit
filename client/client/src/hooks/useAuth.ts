import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

export interface User {
  id: string;
  username: string;
  email: string;
  emailVerified?: boolean;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  message?: string;
}

interface RegistrationResponse {
  user: User;
  message: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  // Query to get current user
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });

  // Register mutation - doesn't log user in immediately
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData): Promise<RegistrationResponse> => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return await response.json();
    },
    onSuccess: (data) => {
      // Don't set user data since they need to verify email first
      console.log("Registration successful:", data.message);
    },
    onError: (error) => {
      console.error("Registration failed:", error);
    },
  });

  // Resend verification email mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string): Promise<{ message: string; success: boolean }> => {
      const response = await apiRequest("POST", "/api/auth/resend-verification", { email });
      return await response.json();
    },
    onError: (error) => {
      console.error("Resend verification failed:", error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async (): Promise<{ message: string }> => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear(); // Clear all cached data on logout
    },
    onError: (error) => {
      console.error("Logout failed:", error);
    },
  });

  return {
    // User state
    user: (user as AuthResponse)?.user || null,
    isLoading,
    isAuthenticated: !!(user as AuthResponse)?.user,
    error,

    // Mutation functions
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    resendVerification: resendVerificationMutation.mutateAsync,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isResendingVerification: resendVerificationMutation.isPending,

    // Mutation errors
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    logoutError: logoutMutation.error,
    resendVerificationError: resendVerificationMutation.error,

    // Registration result
    registrationResult: registerMutation.data,
  };
}