'use client';

import { FiShoppingBag, FiDollarSign, FiCalendar } from 'react-icons/fi';

export function CustomerActivityTable({ data }) {
  return (
    <div className="space-y-4">
      {data.map((customer, index) => (
        <div 
          key={customer.id} 
          className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full text-indigo-600 dark:text-indigo-300">
              <FiUsers className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {customer.first_name} {customer.last_name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {customer.email}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
            <FiShoppingBag className="h-4 w-4" />
            <span>{customer.order_count} orders</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
            <FiDollarSign className="h-4 w-4" />
            <span>${customer.total_spent.toFixed(2)}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
            <FiCalendar className="h-4 w-4" />
            <span>
              {new Date(customer.last_order_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}