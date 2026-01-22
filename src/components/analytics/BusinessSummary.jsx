'use client';

import { useState, useEffect } from 'react';
import { 
  FiCalendar, 
  FiDollarSign, 
  FiShoppingBag, 
  FiTrendingUp,
  FiPackage,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { supabase } from '@/lib/supabase/client';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { CURRENCIES } from '@/components/currencies/Currency';

export function BusinessSummary() {
  const [timeframe, setTimeframe] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [currency, setCurrency] = useState({ symbol: 'GH₵' });
  const [error, setError] = useState(null);

  // Calculate date ranges based on timeframe
  const getDateRange = () => {
    const today = new Date();
    
    switch(timeframe) {
      case 'today':
        return {
          start: new Date(today.setHours(0, 0, 0, 0)),
          end: new Date(today.setHours(23, 59, 59, 999))
        };
      case 'yesterday':
        const yesterday = subDays(new Date(), 1);
        return {
          start: new Date(yesterday.setHours(0, 0, 0, 0)),
          end: new Date(yesterday.setHours(23, 59, 59, 999))
        };
      case 'week':
        return {
          start: startOfWeek(new Date(), { weekStartsOn: 1 }),
          end: endOfWeek(new Date(), { weekStartsOn: 1 })
        };
      case 'month':
        return {
          start: startOfMonth(new Date()),
          end: endOfMonth(new Date())
        };
      case 'custom':
        return {
          start: new Date(selectedDate.setHours(0, 0, 0, 0)),
          end: new Date(selectedDate.setHours(23, 59, 59, 999))
        };
      default:
        return {
          start: new Date(today.setHours(0, 0, 0, 0)),
          end: new Date(today.setHours(23, 59, 59, 999))
        };
    }
  };

  const fetchSummaryData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError('Authentication required. Please log in.');
        setIsLoading(false);
        return;
      }

      // Get store info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('store_id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        setError('Store information not found.');
        setIsLoading(false);
        return;
      }

      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('currency')
        .eq('id', userData.store_id)
        .single();

      if (storeError) {
        console.error('Store fetch error:', storeError);
      }

      const currentCurrency = CURRENCIES.find(c => c.code === (storeData?.currency || 'GHS')) || CURRENCIES.find(c => c.code === 'GHS');
      setCurrency(currentCurrency);

      const dateRange = getDateRange();
      const storeId = userData.store_id;

      // Fetch completed orders within date range
      const { data: salesData, error: salesError } = await supabase
        .from('orders')
        .select('id, total, created_at')
        .eq('store_id', storeId)
        .eq('status', 'completed')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (salesError) {
        console.error('Sales data fetch error:', salesError);
      }

      const orderIds = salesData?.map(order => order.id) || [];

      // Fetch order items for profit calculation
      let orderItems = [];
      if (orderIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            quantity,
            unit_price,
            product_id,
            products (
              cost,
              price,
              name
            )
          `)
          .in('order_id', orderIds);

        if (itemsError) {
          console.error('Order items fetch error:', itemsError);
        }
        orderItems = itemsData || [];
      }

      // Calculate metrics
      const totalSales = salesData?.reduce((sum, order) => {
        return sum + (parseFloat(order.total) || 0);
      }, 0) || 0;

      const totalProfit = orderItems?.reduce((sum, item) => {
        const price = parseFloat(item.products?.price || item.unit_price || 0);
        const cost = parseFloat(item.products?.cost || 0);
        const quantity = item.quantity || 0;
        return sum + ((price - cost) * quantity);
      }, 0) || 0;

      const totalOrders = salesData?.length || 0;
      const totalProductsSold = orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

      // Count unique products
      const uniqueProductIds = [...new Set(orderItems?.map(item => item.product_id).filter(Boolean) || [])];
      const uniqueProductsCount = uniqueProductIds.length;

      // Calculate average order value
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Find top product
      let topProduct = 'N/A';
      let topProductQuantity = 0;
      
      if (orderItems.length > 0) {
        const productQuantities = {};
        orderItems.forEach(item => {
          const productName = item.products?.name || 'Unknown Product';
          productQuantities[productName] = (productQuantities[productName] || 0) + (item.quantity || 0);
        });

        const sortedProducts = Object.entries(productQuantities).sort((a, b) => b[1] - a[1]);
        if (sortedProducts.length > 0) {
          topProduct = sortedProducts[0][0];
          topProductQuantity = sortedProducts[0][1];
        }
      }

      setSummaryData({
        totalSales,
        totalProfit,
        totalOrders,
        totalProductsSold,
        uniqueProductsCount,
        averageOrderValue,
        topProduct,
        topProductQuantity,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end
        }
      });

    } catch (error) {
      console.error('Error fetching summary data:', error);
      setError('Failed to load business summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, [timeframe, selectedDate]);

  const handleDateChange = (direction) => {
    const newDate = new Date(selectedDate);
    
    if (timeframe === 'today' || timeframe === 'yesterday' || timeframe === 'custom') {
      newDate.setDate(newDate.getDate() + direction);
      setSelectedDate(newDate);
      if (timeframe !== 'custom') {
        setTimeframe('custom');
      }
    } else if (timeframe === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
      setSelectedDate(newDate);
      setTimeframe('custom');
    } else if (timeframe === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
      setSelectedDate(newDate);
      setTimeframe('custom');
    }
  };

  const formatDateDisplay = () => {
    if (timeframe === 'today') {
      return 'Today';
    } else if (timeframe === 'yesterday') {
      return 'Yesterday';
    } else if (timeframe === 'week') {
      const dateRange = getDateRange();
      return `This Week (${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d')})`;
    } else if (timeframe === 'month') {
      return format(selectedDate, 'MMMM yyyy');
    } else {
      return format(selectedDate, 'EEEE, MMMM d, yyyy');
    }
  };

  // Safe accessor function
  const getSafeValue = (value, defaultValue = 0) => {
    return value ?? defaultValue;
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <Skeleton className="h-8 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiAlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Error Loading Data</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <Button onClick={fetchSummaryData} variant="outline">
            <FiRefreshCw className="mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!summaryData) {
    return (
      <Card className="mb-6">
        <div className="p-6">
          <div className="text-center py-8">
            <FiCalendar className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Data Available</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No sales data found for the selected period.
            </p>
            <Button onClick={fetchSummaryData}>
              <FiRefreshCw className="mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Business Summary
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <FiCalendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                {formatDateDisplay()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Date Navigation */}
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleDateChange(-1)}
                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-l-lg"
              >
                <FiChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              
              <div className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
                {timeframe === 'custom' ? format(selectedDate, 'MMM d') : ''}
              </div>
              
              <button
                onClick={() => handleDateChange(1)}
                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-r-lg"
              >
                <FiChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Timeframe Selector */}
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Date</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchSummaryData}
              disabled={isLoading}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className={`h-5 w-5 text-gray-600 dark:text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Sales */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</h3>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FiDollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {currency.symbol}{getSafeValue(summaryData.totalSales).toFixed(2)}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <FiTrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getSafeValue(summaryData.totalOrders)} orders
              </span>
            </div>
          </div>

          {/* Total Profit */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Profit</h3>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FiTrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {currency.symbol}{getSafeValue(summaryData.totalProfit).toFixed(2)}
            </p>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {getSafeValue(summaryData.totalSales) > 0 
                ? `${((getSafeValue(summaryData.totalProfit) / getSafeValue(summaryData.totalSales)) * 100).toFixed(1)}% margin`
                : '0% margin'
              }
            </div>
          </div>

          {/* Products Sold */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Products Sold</h3>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FiPackage className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {getSafeValue(summaryData.totalProductsSold)}
            </p>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {getSafeValue(summaryData.uniqueProductsCount)} unique products
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Order Value</h3>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <FiShoppingBag className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {currency.symbol}{getSafeValue(summaryData.averageOrderValue).toFixed(2)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <FiClock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate" title={`Top: ${summaryData.topProduct} (${summaryData.topProductQuantity})`}>
                Top: {summaryData.topProduct} ({summaryData.topProductQuantity})
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Orders Completed</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {getSafeValue(summaryData.totalOrders)}
            </p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {getSafeValue(summaryData.totalProductsSold)}
            </p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Unique Products</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {getSafeValue(summaryData.uniqueProductsCount)}
            </p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Profit Margin</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {getSafeValue(summaryData.totalSales) > 0 
                ? `${((getSafeValue(summaryData.totalProfit) / getSafeValue(summaryData.totalSales)) * 100).toFixed(1)}%`
                : '0%'
              }
            </p>
          </div>
        </div>

        {/* Mobile Optimized Actions */}
        <div className="mt-6 flex flex-wrap gap-2 sm:hidden">
          <Button
            size="sm"
            variant={timeframe === 'today' ? 'primary' : 'outline'}
            onClick={() => setTimeframe('today')}
            className="flex-1 min-w-[80px]"
          >
            Today
          </Button>
          <Button
            size="sm"
            variant={timeframe === 'week' ? 'primary' : 'outline'}
            onClick={() => setTimeframe('week')}
            className="flex-1 min-w-[80px]"
          >
            Week
          </Button>
          <Button
            size="sm"
            variant={timeframe === 'month' ? 'primary' : 'outline'}
            onClick={() => setTimeframe('month')}
            className="flex-1 min-w-[80px]"
          >
            Month
          </Button>
        </div>
      </div>
    </Card>
  );
}