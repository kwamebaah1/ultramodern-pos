import { Geist, Geist_Mono } from "next/font/google";
import SupabaseProvider from "@/providers/supabase-provider";
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Ultramodern POS",
  description: "A next-generation point of sale system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SupabaseProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
              <Sidebar />
              <main className="flex-1 overflow-auto p-6">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
