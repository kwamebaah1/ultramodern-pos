'use client';

import { useState, useEffect } from 'react';
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
} from 'react-icons/fi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Skeleton } from '@/components/ui/Skeleton';
import { supabase } from '@/lib/supabase/client';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { CURRENCIES } from '@/components/currencies/Currency';
import PdfDownloadButton from './PdfDownloadButton';

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

  const handleQuickDateSelect = (months) => {
    const today = new Date();
    setDateRange({
      start: startOfMonth(subMonths(today, months)),
      end: endOfMonth(today)
    });
  };

  const formatCurrency = (amount) => {
    return `${currency.symbol}${parseFloat(amount || 0).toFixed(2)}`;
  };

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

          {/* Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Date Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiCalendar className="inline mr-2" />
                  Report Period
                </label>
                <DateRangePicker
                  value={dateRange}
                  onChange={handleDateChange}
                  className="w-full"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleQuickDateSelect(0)}>
                  This Month
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleQuickDateSelect(1)}>
                  Last Month
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleQuickDateSelect(3)}>
                  Last 3 Months
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleQuickDateSelect(6)}>
                  Last 6 Months
                </Button>
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
            </div>

            {/* Quick Stats */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Quick Stats
              </h3>
              {reportData ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Store:</span>
                    <span className="text-sm font-medium truncate ml-2">{storeName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Orders:</span>
                    <span className="text-sm font-medium">{reportData.summary.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Revenue:</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(reportData.summary.totalSales)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
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
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <FiDollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</span>
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
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                  <FiTrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Profit</span>
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
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                  <FiShoppingBag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</span>
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
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                  <FiPackage className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Products Sold</span>
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {reportType === 'sales' && 'Sales Transactions'}
                {reportType === 'products' && 'Product Sales'}
                {reportType === 'inventory' && 'Inventory Status'}
                {reportType === 'summary' && 'Business Summary'}
              </h3>
              
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
                  <span className="px-3 py-1 text-sm font-medium">
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
                      No sales data available
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
                      No product sales data available
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