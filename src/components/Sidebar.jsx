'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, FiShoppingCart, FiPieChart, 
  FiUsers, FiSettings, FiSun, FiMoon 
} from 'react-icons/fi';
import { useTheme } from 'next-themes';
import { Button } from './ui/Button';

const navItems = [
  { name: 'Dashboard', href: '/', icon: FiHome },
  { name: 'POS', href: '/pos', icon: FiShoppingCart },
  { name: 'Analytics', href: '/analytics', icon: FiPieChart },
  { name: 'Customers', href: '/customers', icon: FiUsers },
  { name: 'Inventory', href: '/products', icon: FiPieChart },
  { name: 'Settings', href: '/settings', icon: FiSettings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex flex-col h-full pt-5 pb-4">
        <div className="flex items-center justify-center mb-8 px-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            <span className="text-blue-600">Ultra</span>POS
          </h1>
        </div>
        <div className="flex-1 space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
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
        <div className="px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full justify-start"
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
        </div>
      </div>
    </div>
  );
}