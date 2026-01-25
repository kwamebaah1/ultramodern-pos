'use client';

import { useState, useEffect } from 'react';
import { EnhancedReportGenerator } from '@/components/reports/EnhancedReportGenerator';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FiLock, FiStar, FiCheckCircle, FiAlertCircle, FiDollarSign, FiTrendingUp, FiFileText } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ReportsPage() {
  const [storePlan, setStorePlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [storeName, setStoreName] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkStorePlan();
  }, []);

  const checkStorePlan = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/login');
        return;
      }

      // Get user's store info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('store_id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData?.store_id) {
        console.error('Store information not found');
        setIsLoading(false);
        return;
      }

      // Get store details including plan
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('plan, name, currency')
        .eq('id', userData.store_id)
        .single();

      if (storeError) {
        console.error('Error fetching store data:', storeError);
        setIsLoading(false);
        return;
      }

      setStorePlan(storeData?.plan || 'basic');
      setStoreName(storeData?.name || 'Your Store');
      
      // Check if user has access to reports
      const hasReportAccess = storeData?.plan !== 'basic';
      setHasAccess(hasReportAccess);

    } catch (error) {
      console.error('Error checking store plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    router.push('/dashboard/billing');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-full mb-6">
              <FiLock className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Advanced Reports Locked
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Unlock comprehensive business analytics and reporting features by upgrading your plan
            </p>
          </div>

          {/* Current Plan Info */}
          <Card className="mb-8 border-2 border-yellow-200 dark:border-yellow-800/30 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10">
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <FiAlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Current Plan: Basic
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Limited access to reporting features
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    Your current <span className="font-semibold">Basic Plan</span> for{' '}
                    <span className="font-semibold">{storeName}</span> includes essential POS features 
                    but doesn't include advanced reporting capabilities.
                  </p>
                </div>
                <Button 
                  onClick={handleUpgradeClick}
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white px-6 py-3"
                >
                  <FiStar className="mr-2" />
                  Upgrade Now
                </Button>
              </div>
            </div>
          </Card>

          {/* Features Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Basic Plan Features */}
            <Card className="border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">Basic</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Your Current Plan
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Essential features included</p>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <FiCheckCircle className="h-5 w-5 text-green-500" />
                    <span>Basic POS functionality</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <FiCheckCircle className="h-5 w-5 text-green-500" />
                    <span>Customer management</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <FiCheckCircle className="h-5 w-5 text-green-500" />
                    <span>Product catalog</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-400 dark:text-gray-500 line-through">
                    <FiLock className="h-5 w-5" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-400 dark:text-gray-500 line-through">
                    <FiLock className="h-5 w-5" />
                    <span>Detailed reports</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-400 dark:text-gray-500 line-through">
                    <FiLock className="h-5 w-5" />
                    <span>Business insights</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-400 dark:text-gray-500 line-through">
                    <FiLock className="h-5 w-5" />
                    <span>Export capabilities</span>
                  </li>
                </ul>
              </div>
            </Card>

            {/* Premium Plan Features */}
            <Card className="border-2 border-blue-200 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-4">
                    <FiStar className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Premium Plan
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Unlock all features</p>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <FiCheckCircle className="h-5 w-5 text-green-500" />
                    <span>Everything in Basic</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <FiCheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Advanced analytics dashboard</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <FiCheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Comprehensive sales reports</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <FiCheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Product performance insights</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <FiCheckCircle className="h-5 w-5 text-green-500" />
                    <span>Inventory analytics</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <FiCheckCircle className="h-5 w-5 text-green-500" />
                    <span>Customer behavior insights</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <FiCheckCircle className="h-5 w-5 text-green-500" />
                    <span>Export reports as PDF/Excel</span>
                  </li>
                </ul>

                <div className="mt-8 pt-6 border-t border-blue-200 dark:border-blue-700">
                  <Button 
                    onClick={handleUpgradeClick}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3"
                  >
                    <FiStar className="mr-2" />
                    Upgrade to Premium
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* What You're Missing */}
          <Card className="mb-8">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Unlock Powerful Business Insights
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/10 dark:to-blue-800/10 rounded-xl">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                    <FiDollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Sales Analytics
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Track revenue trends, identify best-selling products, and optimize pricing strategies with detailed sales reports.
                  </p>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-800/10 rounded-xl">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                    <FiTrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Performance Metrics
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Monitor key performance indicators, track growth metrics, and make data-driven business decisions.
                  </p>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/10 dark:to-purple-800/10 rounded-xl">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-4">
                    <FiFileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Professional Reports
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Generate professional PDF reports for stakeholders, investors, and business planning purposes.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Call to Action */}
          <div className="text-center">
            <Button 
              onClick={handleUpgradeClick}
              size="lg"
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white px-8 py-4 text-lg"
            >
              <FiStar className="mr-3 h-5 w-5" />
              Unlock Advanced Reports Now
            </Button>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
              Start making smarter business decisions with premium analytics
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Business Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate detailed business reports and analytics for {storeName}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Premium Plan • Full Access
          </span>
        </div>
      </div>
      
      <EnhancedReportGenerator />
    </div>
  );
}