'use client';

import { useState, useEffect } from 'react';
import { FiTrendingUp, FiDollarSign, FiShoppingBag, FiUsers, FiArrowUpRight, FiArrowDownRight, FiRefreshCw } from 'react-icons/fi';
import { Card } from '@/components/ui/Card';
import { SalesChart } from '@/components/charts/SalesChart';
import { InventoryStatus } from '@/components/charts/InventoryStatus';
import { RecentTransactions } from '@/components/RecentTransactions';
import { supabase } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/Skeleton';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: userData } = await supabase
        .from('users')
        .select('store_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!userData?.store_id) throw new Error('No store associated with user');

      const storeId = userData.store_id;

      const [
        { data: revenueData },
        { data: salesCount },
        { data: customersCount },
        { data: avgOrderData },
        { data: monthlySales },
        { data: inventoryStats },
        { data: recentOrders }
      ] = await Promise.all([
        supabase.rpc('calculate_total_revenue', { p_store_id: storeId }),
        supabase.rpc('count_total_sales', { p_store_id: storeId }),
        supabase.rpc('count_new_customers', { p_store_id: storeId }),
        supabase.rpc('calculate_avg_order_value', { p_store_id: storeId }),
        supabase.rpc('get_monthly_sales', { p_store_id: storeId }),
        supabase.rpc('get_inventory_status', { p_store_id: storeId }),
        supabase
          .from('orders')
          .select(`
            id,
            total,
            status,
            created_at,
            customer_id (first_name, last_name)
          `)
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);
      //console.log("revenueData", revenueData)
      //console.log("salesCount", salesCount)
      //console.log("customersCount", customersCount)
      //console.log("avgOrderData", avgOrderData)
      //console.log("monthlySales", monthlySales)
      //console.log("inventoryStats", inventoryStats)
      //console.log("recentOrders", recentOrders)

      setMetrics([
        { 
          title: 'Total Revenue', 
          value: `GH₵${revenueData[0]?.total_revenue?.toFixed(2) || '0.00'}`, 
          change: `${revenueData[0]?.change_percentage >= 0 ? '+' : ''}${revenueData[0]?.change_percentage || 0}%`, 
          icon: FiDollarSign 
        },
        { 
          title: 'Total Sales', 
          value: salesCount[0]?.total_sales || 0, 
          change: `${salesCount[0]?.change_percentage >= 0 ? '+' : ''}${salesCount[0]?.change_percentage || 0}%`, 
          icon: FiShoppingBag 
        },
        { 
          title: 'New Customers', 
          value: customersCount[0]?.new_customers || 0, 
          change: `${customersCount[0]?.change_percentage >= 0 ? '+' : ''}${customersCount[0]?.change_percentage || 0}%`, 
          icon: FiUsers 
        },
        { 
          title: 'Avg. Order Value', 
          value: `GH₵${avgOrderData[0]?.avg_order_value?.toFixed(2) || '0.00'}`, 
          change: `${avgOrderData[0]?.change_percentage >= 0 ? '+' : ''}${avgOrderData[0]?.change_percentage || 0}%`, 
          icon: FiTrendingUp 
        },
      ]);

      setSalesData(monthlySales?.length > 0 ? {
        labels: monthlySales.map(item => new Date(item.month).toLocaleString('default', { month: 'short' })),
        datasets: [{
          label: 'Sales',
          data: monthlySales.map(item => item.total_sales),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      } : null);

      setInventoryData(inventoryStats?.length > 0 ? {
        labels: ['In Stock', 'Low Stock', 'Out of Stock'],
        datasets: [{
          data: [
            inventoryStats[0]?.in_stock_count || 0,
            inventoryStats[0]?.low_stock_count || 0,
            inventoryStats[0]?.out_of_stock_count || 0
          ],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: [
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 1,
          cutout: '75%',
        }]
      } : null);

      setTransactions(recentOrders?.map(order => ({
        id: order.id,
        customer: order.customer_id ? 
          `${order.customer_id.first_name} ${order.customer_id.last_name}` : 
          'Guest',
        amount: order.total,
        status: order.status,
        date: order.created_at
      })) || []);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button 
            onClick={fetchDashboardData}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            disabled={isLoading}
          >
            <FiRefreshCw className={`h-5 w-5 text-gray-600 dark:text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-6 w-1/2" />
            </Card>
          ))
        ) : metrics?.map((metric, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {metric.title}
                </p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {metric.value}
                </h3>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    metric.change.startsWith('+') ? 
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    <metric.icon className="h-3 w-3 mr-1" />
                    {metric.change}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    vs last month
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${
                index === 0 ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300' :
                index === 1 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' :
                index === 2 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300' :
                'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300'
              }`}>
                <metric.icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Overview</h3>
                <div className="flex space-x-2">
                  <button className="text-xs px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
                    Monthly
                  </button>
                </div>
              </div>
              <div className="h-80">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : salesData ? (
                  <SalesChart data={salesData} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <FiShoppingBag className="h-12 w-12 mb-2" />
                    <p>No sales data available</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inventory Status</h3>
              <div className="h-80">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : inventoryData ? (
                  <InventoryStatus data={inventoryData} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <FiShoppingBag className="h-12 w-12 mb-2" />
                    <p>No inventory data available</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div>
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
            {isLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <RecentTransactions transactions={transactions} />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}