'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  FiFileText, 
  FiPrinter, 
  FiCalendar,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiShoppingBag,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiBarChart2,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiSun,
  FiMoon
} from 'react-icons/fi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Skeleton } from '@/components/ui/Skeleton';
import { supabase } from '@/lib/supabase/client';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  startOfDay, 
  endOfDay,
  startOfWeek,
  endOfWeek,
  subDays,
  startOfYear,
  endOfYear,
  subYears,
  isSameDay,
  differenceInDays
} from 'date-fns';
import { CURRENCIES } from '@/components/currencies/Currency';
import PdfDownloadButton from './PdfDownloadButton';

// Date preset configurations
const DATE_PRESETS = [
  {
    id: 'today',
    label: 'Today',
    getRange: () => {
      const today = new Date();
      return { start: startOfDay(today), end: endOfDay(today) };
    },
    icon: FiSun,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    badge: 'Today'
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    },
    icon: FiMoon,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    badge: 'Yesterday'
  },
  {
    id: 'thisWeek',
    label: 'This Week',
    getRange: () => {
      const today = new Date();
      return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) };
    },
    icon: FiClock,
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    badge: 'This Week'
  },
  {
    id: 'lastWeek',
    label: 'Last Week',
    getRange: () => {
      const today = new Date();
      const lastWeek = subDays(today, 7);
      return { 
        start: startOfWeek(lastWeek, { weekStartsOn: 1 }), 
        end: endOfWeek(lastWeek, { weekStartsOn: 1 }) 
      };
    },
    icon: FiClock,
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    badge: 'Last Week'
  },
  {
    id: 'thisMonth',
    label: 'This Month',
    getRange: () => {
      const today = new Date();
      return { start: startOfMonth(today), end: endOfMonth(today) };
    },
    icon: FiCalendar,
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
    badge: 'This Month'
  },
  {
    id: 'lastMonth',
    label: 'Last Month',
    getRange: () => {
      const today = new Date();
      const lastMonth = subMonths(today, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    },
    icon: FiCalendar,
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
    badge: 'Last Month'
  },
  {
    id: 'last3Months',
    label: 'Last 3 Months',
    getRange: () => {
      const today = new Date();
      return { start: startOfMonth(subMonths(today, 3)), end: endOfMonth(today) };
    },
    icon: FiTrendingUp,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    badge: '3 Months'
  },
  {
    id: 'last6Months',
    label: 'Last 6 Months',
    getRange: () => {
      const today = new Date();
      return { start: startOfMonth(subMonths(today, 6)), end: endOfMonth(today) };
    },
    icon: FiBarChart2,
    color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    badge: '6 Months'
  },
  {
    id: 'thisYear',
    label: 'This Year',
    getRange: () => {
      const today = new Date();
      return { start: startOfYear(today), end: endOfYear(today) };
    },
    icon: FiCalendar,
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
    badge: 'This Year'
  },
  {
    id: 'lastYear',
    label: 'Last Year',
    getRange: () => {
      const today = new Date();
      const lastYear = subYears(today, 1);
      return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
    },
    icon: FiCalendar,
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    badge: 'Last Year'
  }
];

export function EnhancedReportGenerator() {
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [currency, setCurrency] = useState({ symbol: 'GH₵' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [reportType, setReportType] = useState('sales');
  const [error, setError] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [showDatePresets, setShowDatePresets] = useState(false);
  const [activePreset, setActivePreset] = useState('thisMonth');
  const [customRangeLabel, setCustomRangeLabel] = useState('Custom Range');
  const datePickerRef = useRef(null);

  // Update custom range label whenever date range changes
  useEffect(() => {
    const daysDiff = differenceInDays(dateRange.end, dateRange.start);
    let label = 'Custom Range';
    
    if (daysDiff === 0) {
      label = format(dateRange.start, 'MMMM d, yyyy');
    } else if (daysDiff === 6 && isSameDay(dateRange.start, startOfWeek(dateRange.start, { weekStartsOn: 1 }))) {
      label = `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
    } else if (daysDiff <= 30) {
      label = `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d')}`;
    } else {
      label = `${format(dateRange.start, 'MMM yyyy')} - ${format(dateRange.end, 'MMM yyyy')}`;
    }
    
    setCustomRangeLabel(label);
    
    // Check if current range matches any preset
    const matchingPreset = DATE_PRESETS.find(preset => {
      const presetRange = preset.getRange();
      return isSameDay(presetRange.start, dateRange.start) && isSameDay(presetRange.end, dateRange.end);
    });
    
    if (matchingPreset) {
      setActivePreset(matchingPreset.id);
    } else {
      setActivePreset('custom');
    }
  }, [dateRange]);

  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError('Please log in to view reports');
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
        setError('Store information not found');
        setIsLoading(false);
        return;
      }

      const currentStoreId = userData.store_id;
      setStoreId(currentStoreId);

      const { data: storeData } = await supabase
        .from('stores')
        .select('currency, name, tax_rate')
        .eq('id', currentStoreId)
        .single();

      const currentCurrency = CURRENCIES.find(c => c.code === (storeData?.currency || 'GHS')) || CURRENCIES.find(c => c.code === 'GHS');
      setCurrency(currentCurrency);
      setStoreName(storeData?.name || 'My Store');

      // Adjust date range to include full days
      const startDate = startOfDay(dateRange.start);
      const endDate = endOfDay(dateRange.end);

      // Fetch sales data
      const { data: salesData, error: salesError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total,
          subtotal,
          tax_amount,
          payment_method,
          created_at,
          customer_id
        `)
        .eq('store_id', currentStoreId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (salesError) {
        console.error('Sales data fetch error:', salesError);
      }

      // Fetch order items
      const orderIds = salesData?.map(order => order.id) || [];
      let orderItems = [];
      
      if (orderIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            id,
            order_id,
            quantity,
            unit_price,
            total_price,
            product_id
          `)
          .in('order_id', orderIds);

        if (!itemsError) {
          orderItems = itemsData || [];
          
          // Fetch product details
          const productIds = [...new Set(orderItems.map(item => item.product_id).filter(Boolean))];
          
          if (productIds.length > 0) {
            const { data: productsData } = await supabase
              .from('products')
              .select('id, name, sku, category, cost, price, stock_quantity, min_stock_level')
              .in('id', productIds)
              .eq('store_id', currentStoreId);

            if (productsData) {
              const productsMap = {};
              productsData.forEach(product => {
                productsMap[product.id] = product;
              });

              orderItems = orderItems.map(item => ({
                ...item,
                product: productsMap[item.product_id] || null
              }));
            }
          }
        }
      }

      // Fetch all products
      const { data: allProducts } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', currentStoreId)
        .eq('is_active', true)
        .order('name');

      // Fetch customer details
      const customerIds = [...new Set(salesData?.map(order => order.customer_id).filter(Boolean) || [])];
      let customersMap = {};
      
      if (customerIds.length > 0) {
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, first_name, last_name, email')
          .in('id', customerIds);
        
        customersData?.forEach(customer => {
          customersMap[customer.id] = {
            name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer',
            email: customer.email
          };
        });
      }

      // Calculate metrics
      const totalSales = salesData?.reduce((sum, order) => sum + (parseFloat(order.total || 0) || 0), 0) || 0;
      const totalOrders = salesData?.length || 0;
      
      const totalProfit = orderItems?.reduce((sum, item) => {
        const price = parseFloat(item.product?.price || item.unit_price || 0);
        const cost = parseFloat(item.product?.cost || 0);
        const quantity = item.quantity || 0;
        return sum + ((price - cost) * quantity);
      }, 0) || 0;

      const totalProductsSold = orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      const profitMargin = totalSales > 0 ? (totalProfit / totalSales * 100) : 0;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Calculate category sales
      const categorySales = {};
      orderItems?.forEach(item => {
        const category = item.product?.category || 'Uncategorized';
        const amount = parseFloat(item.total_price || 0);
        categorySales[category] = (categorySales[category] || 0) + amount;
      });

      // Prepare sales data with customers
      const salesWithCustomers = salesData?.map(sale => ({
        ...sale,
        customer: customersMap[sale.customer_id] || { name: 'Walk-in Customer' }
      })) || [];

      setReportData({
        storeName: storeData?.name || 'My Store',
        summary: {
          totalSales,
          totalProfit,
          totalOrders,
          totalProductsSold,
          profitMargin,
          averageOrderValue,
          taxRate: storeData?.tax_rate || 0
        },
        sales: salesWithCustomers,
        orderItems: orderItems || [],
        products: allProducts || [],
        categories: Object.entries(categorySales).map(([name, amount]) => ({ 
          name, 
          amount,
          percentage: totalSales > 0 ? (amount / totalSales * 100).toFixed(1) : '0.0'
        })),
        dateRange: {
          start: dateRange.start,
          end: dateRange.end
        }
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('Failed to load report data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange, reportType]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  const paginatedSales = reportData?.sales?.slice(indexOfFirstItem, indexOfLastItem) || [];
  const paginatedProducts = reportData?.products?.slice(indexOfFirstItem, indexOfLastItem) || [];
  const paginatedOrderItems = reportData?.orderItems?.slice(indexOfFirstItem, indexOfLastItem) || [];
  
  const totalPages = Math.ceil(
    (reportType === 'sales' ? reportData?.sales?.length || 0 :
     reportType === 'products' ? reportData?.orderItems?.length || 0 :
     reportType === 'inventory' ? reportData?.products?.length || 0 : 0) / itemsPerPage
  );

  const handleDateChange = (newDateRange) => {
    setDateRange(newDateRange);
    setCurrentPage(1);
  };

  const handlePresetSelect = (presetId) => {
    const preset = DATE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setDateRange(preset.getRange());
      setActivePreset(presetId);
      setShowDatePresets(false);
    }
  };

  const formatCurrency = (amount) => {
    return `${currency.symbol}${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Calculate date range statistics
  const getDateRangeStats = () => {
    const days = differenceInDays(dateRange.end, dateRange.start) + 1;
    const isSingleDay = days === 1;
    const isWeek = days === 7;
    const isMonth = days >= 28 && days <= 31;
    
    return { days, isSingleDay, isWeek, isMonth };
  };

  const dateStats = getDateRangeStats();

  if (isLoading) {
    return (
      <Card className="mb-6">
        <div className="p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiAlertCircle className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Error Loading Data</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={fetchReportData} variant="outline">
            <FiRefreshCw className="mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-dashed border-blue-100 dark:border-blue-900/30">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FiFileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                Business Intelligence Report
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Generate comprehensive business reports with detailed analytics
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <PdfDownloadButton
                reportData={reportData}
                currency={currency}
                dateRange={dateRange}
                reportType={reportType}
                disabled={!reportData || (reportData?.sales?.length === 0 && reportType === 'sales')}
              />
              
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="w-full sm:w-auto"
                disabled={!reportData}
              >
                <FiPrinter className="mr-2" />
                Print Preview
              </Button>
            </div>
          </div>

          {/* Enhanced Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Enhanced Date Selection */}
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <FiCalendar className="inline mr-2" />
                    Report Period
                  </label>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {dateStats.days} {dateStats.days === 1 ? 'day' : 'days'}
                  </div>
                </div>
                
                {/* Date Presets Dropdown */}
                <div className="relative" ref={datePickerRef}>
                  <Button
                    onClick={() => setShowDatePresets(!showDatePresets)}
                    variant="outline"
                    className="w-full justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {activePreset === 'custom' ? (
                        <span className="font-medium">{customRangeLabel}</span>
                      ) : (
                        <>
                          <span className={`px-2 py-1 text-xs rounded-full ${DATE_PRESETS.find(p => p.id === activePreset)?.color || 'bg-gray-100 text-gray-700'}`}>
                            {DATE_PRESETS.find(p => p.id === activePreset)?.badge}
                          </span>
                          <span>{DATE_PRESETS.find(p => p.id === activePreset)?.label}</span>
                        </>
                      )}
                    </div>
                    {showDatePresets ? <FiChevronUp /> : <FiChevronDown />}
                  </Button>
                  
                  {showDatePresets && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto">
                      <div className="p-2">
                        <div className="mb-2 px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Quick Select
                        </div>
                        {DATE_PRESETS.map((preset) => {
                          const Icon = preset.icon;
                          return (
                            <button
                              key={preset.id}
                              onClick={() => handlePresetSelect(preset.id)}
                              className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 mb-1 ${
                                activePreset === preset.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{preset.label}</span>
                              </div>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${preset.color}`}>
                                {preset.badge}
                              </span>
                            </button>
                          );
                        })}
                        
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="mb-2 px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Custom Range
                          </div>
                          <DateRangePicker
                            value={dateRange}
                            onChange={(newRange) => {
                              handleDateChange(newRange);
                              setShowDatePresets(false);
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Selected Date Range Display */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Selected Period
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="text-gray-600 dark:text-gray-400">
                      Start: {format(dateRange.start, 'EEE, MMM d, yyyy')}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      End: {format(dateRange.end, 'EEE, MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                
                {/* Quick Action Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {DATE_PRESETS.slice(0, 4).map((preset) => (
                    <Button
                      key={preset.id}
                      size="sm"
                      variant={activePreset === preset.id ? 'primary' : 'outline'}
                      onClick={() => handlePresetSelect(preset.id)}
                      className="text-xs"
                    >
                      {preset.badge}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiFilter className="inline mr-2" />
                Report Focus
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={reportType === 'sales' ? 'primary' : 'outline'}
                  onClick={() => setReportType('sales')}
                  className="flex items-center gap-2"
                >
                  <FiDollarSign />
                  Sales
                </Button>
                <Button
                  size="sm"
                  variant={reportType === 'products' ? 'primary' : 'outline'}
                  onClick={() => setReportType('products')}
                  className="flex items-center gap-2"
                >
                  <FiPackage />
                  Products
                </Button>
                <Button
                  size="sm"
                  variant={reportType === 'inventory' ? 'primary' : 'outline'}
                  onClick={() => setReportType('inventory')}
                  className="flex items-center gap-2"
                >
                  <FiTrendingUp />
                  Inventory
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReportType('summary')}
                  className="flex items-center gap-2"
                >
                  <FiBarChart2 />
                  Summary
                </Button>
              </div>
              
              {/* Date Stats */}
              {reportData && (
                <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Period Performance
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {reportData.summary.totalOrders} orders
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {dateStats.isSingleDay ? 'Today' : `Over ${dateStats.days} days`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(reportData.summary.totalSales)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Total revenue
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/10 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <FiCalendar className="h-4 w-4" />
                Report Summary
              </h3>
              {reportData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-700/50 rounded">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Store</div>
                      <div className="text-sm font-medium truncate">{storeName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Currency</div>
                      <div className="text-sm font-medium">{currency.symbol}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/50 dark:bg-gray-700/50 rounded p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Orders</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {reportData.summary.totalOrders}
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-700/50 rounded p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Revenue</div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(reportData.summary.totalSales)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Data for {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d')}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-gray-400 dark:text-gray-500 mb-2">No data available</div>
                  <Button size="xs" variant="outline" onClick={fetchReportData}>
                    <FiRefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                    <FiDollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {dateStats.isSingleDay ? 'Today' : `${dateStats.days} days`}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(reportData.summary.totalSales)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <FiTrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-xs text-gray-500">Total sales for period</span>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                    <FiTrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Profit</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Margin
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(reportData.summary.totalProfit)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  {reportData.summary.profitMargin.toFixed(1)}% margin
                </span>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                    <FiShoppingBag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {dateStats.days} days
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {reportData.summary.totalOrders}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Avg: {formatCurrency(reportData.summary.averageOrderValue)} per order
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                    <FiPackage className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Products Sold</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Units
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {reportData.summary.totalProductsSold}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Across all orders in period
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Data Table */}
      {reportData && (
        <Card>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {reportType === 'sales' && 'Sales Transactions'}
                  {reportType === 'products' && 'Product Sales'}
                  {reportType === 'inventory' && 'Inventory Status'}
                  {reportType === 'summary' && 'Business Summary'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
                  {reportData && reportType === 'sales' && ` • ${reportData.summary.totalOrders} orders`}
                  {reportData && reportType === 'products' && ` • ${reportData.summary.totalProductsSold} units sold`}
                  {reportData && reportType === 'inventory' && ` • ${reportData.products.length} products`}
                </p>
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <FiChevronLeft />
                  </Button>
                  <span className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-800 rounded">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <FiChevronRight />
                  </Button>
                </div>
              )}
            </div>

            {/* Data Tables based on report type */}
            {renderDataTable()}
          </div>
        </Card>
      )}
    </div>
  );

  function renderDataTable() {
    switch (reportType) {
      case 'sales':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left font-medium">Order #</th>
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Customer</th>
                  <th className="p-3 text-left font-medium">Payment</th>
                  <th className="p-3 text-left font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedSales.length > 0 ? (
                  paginatedSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3 font-mono text-xs">{sale.order_number || `ORDER-${sale.id?.slice(0, 8)}`}</td>
                      <td className="p-3">{format(new Date(sale.created_at), 'MMM d, yyyy')}</td>
                      <td className="p-3">{sale.customer?.name || 'Walk-in'}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {sale.payment_method || 'Cash'}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{formatCurrency(sale.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No sales data available for this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );

      case 'products':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left font-medium">Product</th>
                  <th className="p-3 text-left font-medium">Category</th>
                  <th className="p-3 text-left font-medium">Quantity</th>
                  <th className="p-3 text-left font-medium">Unit Price</th>
                  <th className="p-3 text-left font-medium">Total</th>
                  <th className="p-3 text-left font-medium">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedOrderItems.length > 0 ? (
                  paginatedOrderItems.map((item) => {
                    const profit = (parseFloat(item.product?.price || item.unit_price || 0) - 
                                  parseFloat(item.product?.cost || 0)) * (item.quantity || 0);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3 font-medium">{item.product?.name || 'Unknown'}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                            {item.product?.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="p-3">{item.quantity || 0}</td>
                        <td className="p-3">{formatCurrency(item.unit_price)}</td>
                        <td className="p-3 font-medium">{formatCurrency(item.total_price)}</td>
                        <td className="p-3">
                          <span className={`font-medium ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(profit)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No product sales data available for this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );

      case 'inventory':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left font-medium">Product</th>
                  <th className="p-3 text-left font-medium">SKU</th>
                  <th className="p-3 text-left font-medium">Stock</th>
                  <th className="p-3 text-left font-medium">Min Stock</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Cost</th>
                  <th className="p-3 text-left font-medium">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((product) => {
                    const isLowStock = (product.stock_quantity || 0) <= (product.min_stock_level || 0);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3 font-medium">{product.name}</td>
                        <td className="p-3 font-mono text-xs">{product.sku || 'N/A'}</td>
                        <td className="p-3">{product.stock_quantity || 0}</td>
                        <td className="p-3">{product.min_stock_level || 0}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            isLowStock 
                              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          }`}>
                            {isLowStock ? <FiXCircle className="h-3 w-3" /> : <FiCheckCircle className="h-3 w-3" />}
                            {isLowStock ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="p-3">{formatCurrency(product.cost)}</td>
                        <td className="p-3 font-medium">{formatCurrency(product.price)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No inventory data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <FiBarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Select a report type to view data</p>
          </div>
        );
    }
  }
}

export default EnhancedReportGenerator;