'use client';

import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';

const transactions = [
  { id: 1, customer: 'John Doe', amount: 125.99, status: 'completed', date: '2023-05-01' },
  { id: 2, customer: 'Jane Smith', amount: 89.50, status: 'completed', date: '2023-05-01' },
  { id: 3, customer: 'Robert Johnson', amount: 215.75, status: 'pending', date: '2023-04-30' },
  { id: 4, customer: 'Emily Davis', amount: 42.99, status: 'completed', date: '2023-04-30' },
  { id: 5, customer: 'Michael Wilson', amount: 175.25, status: 'failed', date: '2023-04-29' },
];

export function RecentTransactions() {
  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              transaction.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {transaction.status === 'completed' ? (
                <FiArrowUpRight className="h-5 w-5" />
              ) : (
                <FiArrowDownRight className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="font-medium">{transaction.customer}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(transaction.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">${transaction.amount.toFixed(2)}</p>
            <p className={`text-xs ${
              transaction.status === 'completed' ? 'text-green-600 dark:text-green-400' :
              transaction.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}