"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, FiShoppingCart, FiPieChart, 
  FiUsers, FiSettings, FiSun, FiMoon, 
  FiShoppingBag, FiMenu, FiX
} from 'react-icons/fi';
import { HiOutlineClipboardList } from 'react-icons/hi';
import { useTheme } from 'next-themes';
import { Button } from './ui/Button';

const navItems = [
  { name: 'Dashboard', href: '/', icon: FiHome },
  { name: 'POS', href: '/pos', icon: FiShoppingCart },
  { name: 'Analytics', href: '/analytics', icon: FiPieChart },
  { name: 'Customers', href: '/customers', icon: FiUsers },
  { name: 'Inventory', href: '/products', icon: FiPieChart },
  { name: 'Orders', href: '/orders', icon: HiOutlineClipboardList },
  { name: 'Settings', href: '/settings', icon: FiSettings },
];

export default function Topbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        <div className="px-2 pt-2 pb-4 space-y-1 bg-white dark:bg-gray-800">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}