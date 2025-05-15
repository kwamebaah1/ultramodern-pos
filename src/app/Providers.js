"use client"

import SupabaseProvider from "@/providers/supabase-provider";
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { usePathname } from 'next/navigation';

const SIDEBAR_EXCLUDED_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

export function Providers({ children }) {
  const pathname = usePathname();
  const showSidebar = !SIDEBAR_EXCLUDED_ROUTES.includes(pathname);

  return (
    <SupabaseProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          {showSidebar && <Sidebar />}
          <main className={`flex-1 overflow-auto ${showSidebar ? 'p-6' : ''}`}>
            {children}
          </main>
        </div>
      </ThemeProvider>
    </SupabaseProvider>
  );
}