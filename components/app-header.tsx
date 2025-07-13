'use client';
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/login") return null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.replace("/login");
  };
  return (
    <header className="w-full bg-white shadow-sm border-b sticky top-0 z-50">
      {/* Replace the header row with a centered flex row and gap */}
      <div className="flex items-center justify-center gap-40 px-4 py-2 max-w-7xl mx-auto">
        {/* Left Logo */}
        <div className="flex-shrink-0">
          <Image src="https://res.cloudinary.com/dgxjdpnze/image/upload/v1752421789/static/college-logos/1752421783356-bhc-clg-logo.png.jpg" alt="College Logo" width={60} height={60} className="object-contain" />
        </div>
        {/* Center Text */}
        <div className="flex flex-col items-center text-center">
          <span className="text-lg font-bold tracking-wide text-gray-900">The Department of Master of Computer Applications (MCA)</span>
          <span className="text-sm text-gray-600">Students Management Portal</span>
        </div>
        {/* Right Logo */}
        <div className="flex-shrink-0">
          <Image src="https://res.cloudinary.com/dgxjdpnze/image/upload/v1752421797/static/department-logos/1752421790179-MCA_Dept_Logo.png.jpg" alt="Department Logo" width={60} height={60} className="object-contain" />
        </div>
      </div>
      {/* Navigation Bar */}
      <nav className="bg-gray-100 border-t">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between py-2">
          {/* Left side - Navigation Links */}
          <div className="flex space-x-6 mx-auto">
            <Link href="/admin/dashboard" className="text-gray-700 hover:text-blue-700 font-medium">Dashboard</Link>
            <Link href="/admin/students" className="text-gray-700 hover:text-blue-700 font-medium">Students</Link>
            <Link href="/admin/events" className="text-gray-700 hover:text-blue-700 font-medium">Events</Link>
            <Link href="/admin/analytics" className="text-gray-700 hover:text-blue-700 font-medium">Analytics</Link>
            <Link href="/admin/reports" className="text-gray-700 hover:text-blue-700 font-medium">Reports</Link>
          </div>
          {/* Right side - Logout Button */}
          <div className="flex items-center">
            <Button variant="outline" size="sm" className="flex items-center space-x-1" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
} 