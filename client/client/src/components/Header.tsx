import { Bell, User, Play, Menu, X, LogOut, Settings, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { SiTiktok, SiYoutube, SiX, SiInstagram } from "react-icons/si";
import logoImage from "@assets/2_1756109812511.png";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import React from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { user, logout, isLoggingOut, isAuthenticated } = useAuth();
  
  // Check if user is admin
  const isAdmin = user && (
    user.email?.includes('admin') || 
    user.username?.toLowerCase().includes('admin') || 
    user.email === 'jason@smooth-edit.com' ||
    user.email === 'jguynes74@gmail.com' // Your admin access
  );
  const { toast } = useToast();

  const getUserInitials = (user: any) => {
    if (!user) return "U";
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white border-b border-slate-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center space-x-3 sm:space-x-6">
              {/* Logo */}
              <a href="/" className="flex items-center">
                <img 
                  src={logoImage} 
                  alt="SmoothEDIT" 
                  className="h-10 sm:h-12 w-auto"
                />
              </a>
              
              {/* Social Media Icons */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-sm bg-black flex items-center justify-center">
                    <SiTiktok className="text-white" size={16} />
                  </div>
                </a>
                <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:opacity-80 transition-opacity">
                  <SiYoutube size={20} className="sm:w-6 sm:h-6" />
                </a>
                <a href="https://www.x.com" target="_blank" rel="noopener noreferrer" className="text-black hover:opacity-80 transition-opacity">
                  <SiX size={20} className="sm:w-6 sm:h-6" />
                </a>
                <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-sm" 
                       style={{ 
                         background: 'linear-gradient(45deg, #405de6, #5851db, #833ab4, #c13584, #e1306c, #fd1d1d)' 
                       }}>
                    <SiInstagram className="text-white w-full h-full" size={16} />
                  </div>
                </a>
              </div>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <a href="/" className="text-slate-900 hover:text-primary-600 px-3 py-2 text-sm font-medium">Home</a>
                {isAuthenticated ? (
                  <a href="/videos" className="text-slate-500 hover:text-slate-700 px-3 py-2 text-sm font-medium">My Videos</a>
                ) : null}
                <a href="#upload" className="text-slate-500 hover:text-slate-700 px-3 py-2 text-sm font-medium">Upload</a>
                <a href="#pricing" className="text-slate-500 hover:text-slate-700 px-3 py-2 text-sm font-medium">Pricing</a>
                {isAuthenticated ? (
                  <a href="/nice2have" className="text-slate-500 hover:text-slate-700 px-3 py-2 text-sm font-medium">Nice2Have</a>
                ) : null}
              </div>
            </div>
          </div>
          
          {/* Desktop Profile Section */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {isAuthenticated ? (
                <>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Bell className="w-4 h-4" />
                  </Button>
                  <div className="ml-3 relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="relative h-8 w-8 rounded-full bg-primary-500 hover:bg-primary-600 text-white"
                          data-testid="button-user-menu"
                        >
                          <span className="text-sm font-medium">
                            {getUserInitials(user)}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {user?.username || "User"}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                              {user?.email || ""}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {isAdmin && (
                          <>
                            <Link href="/admin">
                              <DropdownMenuItem>
                                <UserCog className="mr-2 h-4 w-4" />
                                <span>Admin Panel</span>
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem disabled>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          data-testid="button-logout"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              ) : (
                <Link href="/auth">
                  <Button 
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                    data-testid="button-sign-in"
                  >
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-slate-200">
              <a href="/" className="text-slate-900 hover:text-primary-600 block px-3 py-2 text-base font-medium">Home</a>
              {isAuthenticated && (
                <a href="/videos" className="text-slate-500 hover:text-slate-700 block px-3 py-2 text-base font-medium">My Videos</a>
              )}
              <a href="#upload" className="text-slate-500 hover:text-slate-700 block px-3 py-2 text-base font-medium">Upload</a>
              <a href="#pricing" className="text-slate-500 hover:text-slate-700 block px-3 py-2 text-base font-medium">Pricing</a>
              {isAuthenticated && (
                <a href="/nice2have" className="text-slate-500 hover:text-slate-700 block px-3 py-2 text-base font-medium">Nice2Have</a>
              )}
              
              {/* Mobile Profile Section */}
              {isAuthenticated ? (
                <div className="pt-4 pb-3 border-t border-slate-200">
                  <div className="flex items-center px-3">
                    <div className="bg-primary-500 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {getUserInitials(user)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-slate-900">
                        {user?.username || "User"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {user?.email || ""}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto p-2">
                      <Bell className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="px-3 py-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full text-left justify-start"
                      data-testid="button-logout-mobile"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {isLoggingOut ? "Signing out..." : "Sign out"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 pb-3 border-t border-slate-200 px-3">
                  <Link href="/auth">
                    <Button 
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                      data-testid="button-sign-in-mobile"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
