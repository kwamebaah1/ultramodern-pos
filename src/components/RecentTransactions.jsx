'use client';

import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';

export function RecentTransactions({ transactions }) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-gray-500">
        <FiArrowUpRight className="h-10 w-10 mb-2 opacity-50" />
        <p>No recent transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div 
          key={transaction.id} 
          className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${
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
              <p className="font-medium text-gray-900 dark:text-white">{transaction.customer}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(transaction.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-900 dark:text-white">
              ${transaction.amount.toFixed(2)}
            </p>
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