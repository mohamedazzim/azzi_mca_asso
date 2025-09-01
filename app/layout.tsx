import type { Metadata } from 'next'
import './globals.css'
import AppHeader from "@/components/app-header";

export const metadata: Metadata = {
  title: 'College Management System',
  description: 'MCA Department Association Activity Management System',
  generator: 'Next.js',
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <AppHeader />
        <main className="pt-2 min-h-screen bg-gray-50">{children}</main>
      </body>
    </html>
  );
}

