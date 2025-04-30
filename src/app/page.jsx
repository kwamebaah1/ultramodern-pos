'use client';

import { FiTrendingUp, FiDollarSign, FiShoppingBag, FiUsers } from 'react-icons/fi';
import { Card } from '@/components/ui/Card';
import { SalesChart } from '@/components/charts/SalesChart';
import { InventoryStatus } from '@/components/charts/InventoryStatus';
import { RecentTransactions } from '@/components/RecentTransactions';

export default function Dashboard() {
  const metrics = [
    { title: 'Total Revenue', value: '$12,345', change: '+12%', icon: FiDollarSign },
    { title: 'Total Sales', value: '1,234', change: '+8%', icon: FiShoppingBag },
    { title: 'New Customers', value: '56', change: '+5%', icon: FiUsers },
    { title: 'Avg. Order Value', value: '$45.67', change: '+3%', icon: FiTrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {metric.title}
                </p>
                <h3 className="text-2xl font-bold mt-1">{metric.value}</h3>
                <p className="text-sm mt-1 flex items-center">
                  <span className="text-green-500 flex items-center">
                    <metric.icon className="h-4 w-4 mr-1" />
                    {metric.change}
                  </span>
                  <span className="text-gray-500 ml-1">vs last month</span>
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
            <SalesChart />
          </Card>
        </div>
        <div>
          <Card>
            <h3 className="text-lg font-semibold mb-4">Inventory Status</h3>
            <InventoryStatus />
          </Card>
        </div>
      </div>

      <div>
        <Card>
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <RecentTransactions />
        </Card>
      </div>
    </div>
  );
}