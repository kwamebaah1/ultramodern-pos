'use client';

import { cn } from '@/lib/utils';
import { Card } from '../ui/Card';

export function MetricCard({ title, value, change, icon: Icon, trend }) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {value}
          </h3>
          <div className="flex items-center">
            <span className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              trend === 'up' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            )}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              vs previous period
            </span>
          </div>
        </div>
        <div className={cn(
          'p-3 rounded-lg',
          title.includes('Revenue') ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300' :
          title.includes('Orders') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' :
          title.includes('Customers') ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300' :
          'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300'
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}