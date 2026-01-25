'use client';

import { EnhancedReportGenerator } from '@/components/reports/EnhancedReportGenerator';

export default function ReportsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Business Reports
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Generate detailed business reports and analytics for your store
      </p>
      
      <EnhancedReportGenerator />
    </div>
  );
}