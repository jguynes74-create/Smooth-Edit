import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Search, Users, UserCog, Crown, KeyRound } from "lucide-react";
import Header from "@/components/Header";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  plan: string;
  emailVerified: boolean;
  createdAt: string;
  reputation: number;
  totalIdeasSubmitted: number;
}

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();

  // Fetch all users
  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    retry: false,
  });

  // Mutation to update user plan
  const updatePlanMutation = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
      return apiRequest('PUT', `/api/admin/users/${userId}/plan`, { plan });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Plan updated",
        description: "User plan has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update user plan.",
        variant: "destructive",
      });
    },
  });

  // Mutation to reset user password
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      return apiRequest('PUT', `/api/admin/users/${userId}/password`, { password });
    },
    onSuccess: () => {
      setResetPasswordUserId(null);
      setNewPassword("");
      toast({
        title: "Password reset",
        description: "User password has been successfully reset.",
      });
    },
    onError: (error) => {
      toast({
        title: "Reset failed",
        description: error.message || "Failed to reset user password.",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'free':
        return <Badge variant="secondary">Free</Badge>;
      case 'pro':
        return <Badge variant="default" className="bg-blue-600">Creator Pro</Badge>;
      case 'business':
        return <Badge variant="default" className="bg-orange-600">Creator Pro+</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  const handlePlanUpdate = (userId: string, newPlan: string) => {
    updatePlanMutation.mutate({ userId, plan: newPlan });
  };

  const handlePasswordReset = (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    resetPasswordMutation.mutate({ userId, password: newPassword });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <UserCog className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
          </div>
          <p className="text-slate-600">Manage user accounts and subscription plans</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Creator Pro+ Users</CardTitle>
              <Crown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users?.filter(u => u.plan === 'business').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
              <Badge className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users?.filter(u => u.emailVerified).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              View and manage user accounts and subscription plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search users by email or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Users Table */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-slate-600">Loading users...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium text-slate-900">{user.username}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                        {user.emailVerified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-slate-500">
                        <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                        <span>Reputation: {user.reputation}</span>
                        <span>Ideas: {user.totalIdeasSubmitted}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {getPlanBadge(user.plan)}
                      
                      <Select
                        value={user.plan}
                        onValueChange={(newPlan) => handlePlanUpdate(user.id, newPlan)}
                        disabled={updatePlanMutation.isPending}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Creator Pro</SelectItem>
                          <SelectItem value="business">Creator Pro+</SelectItem>
                        </SelectContent>
                      </Select>

                      <Dialog open={resetPasswordUserId === user.id} onOpenChange={(open) => {
                        if (!open) {
                          setResetPasswordUserId(null);
                          setNewPassword("");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setResetPasswordUserId(user.id)}
                            data-testid={`button-reset-password-${user.id}`}
                          >
                            <KeyRound className="h-4 w-4 mr-2" />
                            Reset Password
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>
                              Set a new password for {user.username} ({user.email})
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="new-password">New Password</Label>
                              <Input
                                id="new-password"
                                type="password"
                                placeholder="Enter new password (min 6 characters)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                data-testid="input-new-password"
                                minLength={6}
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setResetPasswordUserId(null);
                                setNewPassword("");
                              }}
                              disabled={resetPasswordMutation.isPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handlePasswordReset(user.id)}
                              disabled={resetPasswordMutation.isPending || !newPassword}
                              data-testid="button-confirm-reset-password"
                            >
                              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
                
                {filteredUsers.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-slate-500">
                    {searchTerm ? "No users found matching your search." : "No users found."}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}