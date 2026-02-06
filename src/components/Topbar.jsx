"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FiHome, FiShoppingCart, FiPieChart, 
  FiUsers, FiSettings, FiSun, FiMoon, 
  FiShoppingBag, FiMenu, FiX, FiLock, FiBarChart2, FiLogOut
} from 'react-icons/fi';
import { HiOutlineClipboardList } from 'react-icons/hi';
import { useTheme } from 'next-themes';
import { Button } from './ui/Button';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const navItems = [
  { name: 'Dashboard', href: '/', icon: FiHome },
  { name: 'POS', href: '/pos', icon: FiShoppingCart },
  { name: 'Analytics', href: '/analytics', icon: FiPieChart, premium: true },
  { name: 'Reports', href: '/report', icon: FiBarChart2, premium: true },
  { name: 'Customers', href: '/customers', icon: FiUsers },
  { name: 'Inventory', href: '/products', icon: FiPieChart },
  { name: 'Orders', href: '/orders', icon: HiOutlineClipboardList },
  { name: 'Settings', href: '/settings', icon: FiSettings },
];

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [storePlan, setStorePlan] = useState(null);

  useEffect(() => {
    const fetchStorePlan = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('store_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!userData) return;

      const { data: storeData } = await supabase
        .from('stores')
        .select('plan')
        .eq('id', userData.store_id)
        .single();

      setStorePlan(storeData?.plan || null);
    };

    fetchStorePlan();
  }, []);

  const handleUpgradeClick = (e) => {
    e.preventDefault();
    toast('Upgrade to Pro plan to access Analytics', {
      icon: '🔒',
      position: 'top-right',
    });
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logged out successfully', {
        position: 'top-right',
      });
      setIsMenuOpen(false);
      router.push('/login');
    } catch (error) {
      toast.error('Failed to logout', {
        position: 'top-right',
      });
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <FiShoppingBag className="h-6 w-6 text-blue-600 mr-2" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            <span className="text-blue-600">Ultra</span>POS
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <FiSun className="h-5 w-5" />
            ) : (
              <FiMoon className="h-5 w-5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <FiX className="h-5 w-5" />
            ) : (
              <FiMenu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="px-2 pt-2 pb-4 space-y-1 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {navItems.map((item) => {
            const isPremiumLocked = item.premium && storePlan === 'basic';
            const isActive = pathname === item.href;
            
            return (
              <div key={item.name} className="relative">
                {isPremiumLocked ? (
                  <div
                    onClick={handleUpgradeClick}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                    <FiLock className="ml-2 h-4 w-4" />
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )}
              </div>
            );
          })}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
                setIsMenuOpen(false);
              }}
              className="w-full justify-start text-gray-700 dark:text-gray-300"
            >
              {theme === 'dark' ? (
                <>
                  <FiSun className="mr-3 h-5 w-5" />
                  Light Mode
                </>
              ) : (
                <>
                  <FiMoon className="mr-3 h-5 w-5" />
                  Dark Mode
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <FiLogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}