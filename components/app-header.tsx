'use client';
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorToast, successToast } from "@/components/ui/error-toast";
import { createErrorHandler } from "@/lib/error-handler";
import { NavigationLink } from "@/components/navigation-link";

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  
  if (pathname === "/login") return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    const errorHandler = createErrorHandler("logout", "user session cleanup");
    
    try {
      // Check if user is still logged in
      const user = localStorage.getItem("user");
      if (!user) {
        errorToast("You are already logged out", {
          title: "Session Status"
        });
        router.replace("/login");
        return;
      }

      // Call logout API if it exists
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (apiError) {
        // API logout failed, but we can still clear local storage
        
      }

      // Clear user data from localStorage
      localStorage.removeItem("user");
      
      // Clear any other session-related data
      localStorage.removeItem("lastActivity");
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      successToast("Logged out successfully", {
        title: "Session Ended",
        duration: 3000
      });
      
      router.replace("/login");
    } catch (error) {
      
      errorHandler(error);
      
      // Even if logout fails, try to redirect to login
      try {
        localStorage.removeItem("user");
        router.replace("/login");
      } catch (redirectError) {
        errorToast("Logout completed but navigation failed. Please refresh the page.", {
          title: "Navigation Error",
          duration: 8000
        });
      }
    } finally {
      setLoggingOut(false);
    }
  };
  return (
    <header className="w-full bg-white shadow-sm border-b sticky top-0 z-50">
      {/* Responsive header with logos and title */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 md:gap-8 lg:gap-40 px-2 sm:px-4 py-2 max-w-7xl mx-auto">
        {/* Left Logo */}
        <div className="flex-shrink-0">
          <Image src="/college-logo.png" alt="College Logo" width={50} height={50} className="object-contain sm:w-[60px] sm:h-[60px]" />
        </div>
        {/* Center Text - responsive */}
        <div className="flex flex-col items-center text-center flex-1 min-w-0">
          <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold tracking-wide text-gray-900 leading-tight">
            The Department of Master of Computer Applications (MCA)
          </span>
          <span className="text-xs sm:text-sm text-gray-600 hidden sm:block">Students Management Portal</span>
        </div>
        {/* Right Logo */}
        <div className="flex-shrink-0">
          <Image src="/department-logo.png" alt="Department Logo" width={50} height={50} className="object-contain sm:w-[60px] sm:h-[60px]" />
        </div>
      </div>
      {/* Navigation Bar - responsive */}
      <nav className="bg-gray-100 border-t">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-between py-2">
          {/* Navigation Links - responsive */}
          <div className="flex space-x-2 sm:space-x-4 md:space-x-6 mx-auto overflow-x-auto">
            <NavigationLink href="/admin/dashboard" className="whitespace-nowrap text-sm sm:text-base">Dashboard</NavigationLink>
            <NavigationLink href="/admin/students" className="whitespace-nowrap text-sm sm:text-base">Students</NavigationLink>
            <NavigationLink href="/admin/events" className="whitespace-nowrap text-sm sm:text-base">Events</NavigationLink>
            <NavigationLink href="/admin/analytics" className="whitespace-nowrap text-sm sm:text-base">Analytics</NavigationLink>
            <NavigationLink href="/admin/reports" className="whitespace-nowrap text-sm sm:text-base">Reports</NavigationLink>
          </div>
          {/* Logout Button - responsive */}
          <div className="flex items-center ml-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center space-x-1 text-xs sm:text-sm" 
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  <span className="hidden sm:inline">Logging out...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}