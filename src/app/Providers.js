"use client";

import SupabaseProvider from "@/providers/supabase-provider";
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { usePathname } from 'next/navigation';
import { Toaster } from "react-hot-toast";

const SIDEBAR_EXCLUDED_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password', '/change-password'];

export function Providers({ children }) {
  const pathname = usePathname();
  const showSidebar = !SIDEBAR_EXCLUDED_ROUTES.includes(pathname);

  return (
    <SupabaseProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Toaster position="top-right" reverseOrder={false} />
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          {showSidebar && (
            <>
              <Sidebar />
              <Topbar />
            </>
          )}
          <main className={`flex-1 overflow-auto ${showSidebar ? 'pt-16 md:pt-0 md:pl-64 md:p-6' : ''}`}>
            {children}
          </main>
        </div>
      </ThemeProvider>
    </SupabaseProvider>
  );
}