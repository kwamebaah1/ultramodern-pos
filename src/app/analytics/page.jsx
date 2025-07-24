'use client';

import { useState, useEffect } from 'react';
import { 
  FiTrendingUp, 
  FiDollarSign, 
  FiShoppingBag, 
  FiUsers,
  FiRefreshCw,
  FiCalendar,
  FiPieChart,
  FiBarChart2,
  FiShoppingCart
} from 'react-icons/fi';
import { Card } from '@/components/ui/Card';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { MetricCard } from '@/components/analytics/MetricCard';
import { SalesTrendChart } from '@/components/analytics/SalesTrendChart';
import { RevenueBreakdownChart } from '@/components/analytics/RevenueBreakdownChart';
import { TopProductsChart } from '@/components/analytics/TopProductsChart';
import { CustomerActivityTable } from '@/components/analytics/CustomerActivityTable';
import { supabase } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({
    metrics: null,
    salesTrend: null,
    revenueBreakdown: null,
    topProducts: null,
    customerActivity: null
  });

  const fetchAnalyticsData = async () => {
    setIsLoading(true);

    try {
      const {
      data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('User not found:', userError);
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('store_id')
        .eq('auth_user_id', user.id)
        .single();

      const storeId = profile.store_id;
    
      const [
        { data: metrics },
        { data: salesTrend },
        { data: revenueBreakdown },
        { data: topProducts },
        { data: customerActivity }
      ] = await Promise.all([
        supabase.rpc('get_analytics_metrics', {
          start_date: dateRange.start.toISOString(),
          end_date: dateRange.end.toISOString(),
          p_store_id: storeId
        }),
        supabase.rpc('get_sales_trend', {
          start_date: dateRange.start.toISOString(),
          end_date: dateRange.end.toISOString(),
          p_store_id: storeId
        }),
        supabase.rpc('get_revenue_breakdown', {
          start_date: dateRange.start.toISOString(),
          end_date: dateRange.end.toISOString(),
          p_store_id: storeId
        }),
        supabase.rpc('get_top_products', {
          start_date: dateRange.start.toISOString(),
          end_date: dateRange.end.toISOString(),
          limit_num: 5,
          p_store_id: storeId
        }),
        supabase.rpc('get_customer_activity', {
          start_date: dateRange.start.toISOString(),
          end_date: dateRange.end.toISOString(),
          limit_num: 5,
          p_store_id: storeId
        })
      ]);

      console.log("revenueBreakdown", revenueBreakdown)
      console.log("customerActivity", customerActivity)

      setData({
        metrics,
        salesTrend,
        revenueBreakdown,
        topProducts,
        customerActivity
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Business Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Insights and performance metrics for your business
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangePicker 
            value={dateRange}
            onChange={setDateRange}
          />
          <button
            onClick={fetchAnalyticsData}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            disabled={isLoading}
          >
            <FiRefreshCw className={`h-5 w-5 text-gray-600 dark:text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))
        ) : data.metrics ? (
          <>
            <MetricCard
              title="Total Revenue"
              value={`$${data.metrics[0].total_revenue.toFixed(2)}`}
              change={data.metrics[0].revenue_change}
              icon={FiDollarSign}
              trend="up"
            />
            <MetricCard
              title="Total Orders"
              value={data.metrics[0].total_orders}
              change={data.metrics[0].orders_change}
              icon={FiShoppingBag}
              trend="up"
            />
            <MetricCard
              title="New Customers"
              value={data.metrics[0].new_customers}
              change={data.metrics[0].customers_change}
              icon={FiUsers}
              trend="up"
            />
            <MetricCard
              title="Avg. Order Value"
              value={`$${data.metrics[0].avg_order_value.toFixed(2)}`}
              change={data.metrics[0].aov_change}
              icon={FiTrendingUp}
              trend="up"
            />
          </>
        ) : (
          <div className="col-span-4 py-12 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <FiBarChart2 className="h-12 w-12 mb-4" />
            <p>No metrics data available</p>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Sales Trend
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <FiCalendar className="h-4 w-4" />
                  <span>
                    {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="h-80">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : data.salesTrend ? (
                  <SalesTrendChart data={data.salesTrend} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <FiBarChart2 className="h-12 w-12 mb-4" />
                    <p>No sales trend data available</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <div>
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Revenue Breakdown
              </h2>
              <div className="h-80">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : data.revenueBreakdown ? (
                  <RevenueBreakdownChart data={data.revenueBreakdown} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <FiPieChart className="h-12 w-12 mb-4" />
                    <p>No revenue data available</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Top Products
              </h2>
              <div className="h-80">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : data.topProducts ? (
                  <TopProductsChart data={data.topProducts} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <FiShoppingCart className="h-12 w-12 mb-4" />
                    <p>No product data available</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Customer Activity */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Customer Activity
              </h2>
              <div className="h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : data.customerActivity ? (
                  <CustomerActivityTable data={data.customerActivity} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <FiUsers className="h-12 w-12 mb-4" />
                    <p>No customer activity data available</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}