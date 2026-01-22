'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  FiFileText, 
  FiDownload, 
  FiPrinter, 
  FiCalendar,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiShoppingBag,
  FiUser,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Skeleton } from '@/components/ui/Skeleton';
import { supabase } from '@/lib/supabase/client';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { CURRENCIES } from '@/components/currencies/Currency';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function PDFReportGenerator() {
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [currency, setCurrency] = useState({ symbol: 'GH₵' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [reportType, setReportType] = useState('sales'); // 'sales', 'products', 'inventory'
  
  const reportRef = useRef(null);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get store info
      const { data: userData } = await supabase
        .from('users')
        .select('store_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!userData) return;

      const { data: storeData } = await supabase
        .from('stores')
        .select('currency, name')
        .eq('id', userData.store_id)
        .single();

      const currentCurrency = CURRENCIES.find(c => c.code === (storeData?.currency || 'GHS')) || CURRENCIES.find(c => c.code === 'GHS');
      setCurrency(currentCurrency);

      const storeId = userData.store_id;
      const storeName = storeData?.name || 'My Store';

      // Fetch sales data
      const { data: salesData } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total,
          status,
          payment_method,
          created_at,
          customer:customers (
            name,
            email
          )
        `)
        .eq('store_id', storeId)
        .eq('status', 'completed')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: false });

      // Fetch order items for detailed product sales
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          quantity,
          unit_price,
          total_price,
          product:products (
            id,
            name,
            sku,
            category,
            cost,
            price,
            stock_quantity
          )
        `)
        .in('order_id', salesData?.map(order => order.id) || [])
        .order('created_at', { ascending: false });

      // Fetch all products for inventory report
      const { data: allProducts } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name');

      // Calculate summary metrics
      const totalSales = salesData?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0;
      const totalOrders = salesData?.length || 0;
      
      const totalProfit = orderItems?.reduce((sum, item) => {
        const price = parseFloat(item.product?.price || item.unit_price || 0);
        const cost = parseFloat(item.product?.cost || 0);
        return sum + ((price - cost) * (item.quantity || 0));
      }, 0) || 0;

      const totalProductsSold = orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

      // Group products by category for sales
      const productsByCategory = {};
      orderItems?.forEach(item => {
        const category = item.product?.category || 'Uncategorized';
        productsByCategory[category] = (productsByCategory[category] || 0) + (item.quantity || 0);
      });

      // Calculate inventory status
      const lowStockProducts = allProducts?.filter(product => 
        product.stock_quantity <= product.min_stock_level
      ) || [];

      setReportData({
        storeName,
        summary: {
          totalSales,
          totalProfit,
          totalOrders,
          totalProductsSold,
          profitMargin: totalSales > 0 ? (totalProfit / totalSales * 100) : 0,
          averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0
        },
        sales: salesData || [],
        orderItems: orderItems || [],
        products: allProducts || [],
        categories: Object.entries(productsByCategory).map(([name, quantity]) => ({ name, quantity })),
        lowStockProducts,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end
        }
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
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
     reportType === 'products' ? reportData?.products?.length || 0 :
     reportData?.orderItems?.length || 0) / itemsPerPage
  );

  const generatePDF = async () => {
    if (!reportData || isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add watermark/background
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 0, 210, 297, 'F');

      // Report Header
      doc.setFontSize(24);
      doc.setTextColor(41, 128, 185);
      doc.setFont('helvetica', 'bold');
      doc.text('SALES REPORT', 105, 20, null, null, 'center');

      // Store Info
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
      doc.setFont('helvetica', 'normal');
      doc.text(`Store: ${reportData.storeName}`, 20, 35);
      doc.text(`Period: ${format(reportData.dateRange.start, 'MMM dd, yyyy')} - ${format(reportData.dateRange.end, 'MMM dd, yyyy')}`, 20, 42);
      doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy hh:mm a')}`, 20, 49);

      // Summary Section
      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY', 20, 65);

      // Summary Table
      const summaryData = [
        ['Total Sales', `${currency.symbol}${reportData.summary.totalSales.toFixed(2)}`],
        ['Total Profit', `${currency.symbol}${reportData.summary.totalProfit.toFixed(2)}`],
        ['Profit Margin', `${reportData.summary.profitMargin.toFixed(1)}%`],
        ['Total Orders', reportData.summary.totalOrders.toString()],
        ['Products Sold', reportData.summary.totalProductsSold.toString()],
        ['Avg Order Value', `${currency.symbol}${reportData.summary.averageOrderValue.toFixed(2)}`]
      ];

      doc.autoTable({
        startY: 70,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 5 },
        margin: { left: 20, right: 20 }
      });

      // Sales Details Section
      let finalY = (doc).lastAutoTable.finalY + 15;
      
      if (finalY > 250) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      doc.text('SALES DETAILS', 20, finalY);

      const salesTableData = reportData.sales.map((sale, index) => [
        index + 1,
        sale.order_number || `ORDER-${sale.id.slice(0, 8)}`,
        format(new Date(sale.created_at), 'MMM dd, yyyy'),
        sale.customer?.name || 'Walk-in Customer',
        sale.payment_method || 'Cash',
        `${currency.symbol}${parseFloat(sale.total || 0).toFixed(2)}`
      ]);

      doc.autoTable({
        startY: finalY + 5,
        head: [['#', 'Order ID', 'Date', 'Customer', 'Payment', 'Amount']],
        body: salesTableData,
        theme: 'grid',
        headStyles: { fillColor: [52, 152, 219], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 4 },
        margin: { left: 20, right: 20 },
        pageBreak: 'auto'
      });

      // Product Sales Section
      finalY = (doc).lastAutoTable.finalY + 15;
      
      if (finalY > 250) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      doc.text('PRODUCT SALES', 20, finalY);

      const productSalesData = reportData.orderItems.map((item, index) => [
        index + 1,
        item.product?.name || 'Unknown Product',
        item.product?.sku || 'N/A',
        item.product?.category || 'Uncategorized',
        item.quantity.toString(),
        `${currency.symbol}${parseFloat(item.unit_price || 0).toFixed(2)}`,
        `${currency.symbol}${parseFloat(item.total_price || 0).toFixed(2)}`
      ]);

      doc.autoTable({
        startY: finalY + 5,
        head: [['#', 'Product', 'SKU', 'Category', 'Qty', 'Unit Price', 'Total']],
        body: productSalesData,
        theme: 'grid',
        headStyles: { fillColor: [46, 204, 113], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { left: 20, right: 20 },
        pageBreak: 'auto'
      });

      // Inventory Status Section
      finalY = (doc).lastAutoTable.finalY + 15;
      
      if (finalY > 250) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      doc.text('INVENTORY STATUS', 20, finalY);

      const inventoryData = reportData.products.map((product, index) => [
        index + 1,
        product.name,
        product.sku || 'N/A',
        product.category || 'Uncategorized',
        product.stock_quantity.toString(),
        product.min_stock_level.toString(),
        product.stock_quantity <= product.min_stock_level ? 'LOW STOCK' : 'OK',
        `${currency.symbol}${parseFloat(product.cost || 0).toFixed(2)}`,
        `${currency.symbol}${parseFloat(product.price || 0).toFixed(2)}`
      ]);

      doc.autoTable({
        startY: finalY + 5,
        head: [['#', 'Product', 'SKU', 'Category', 'Current Stock', 'Min Stock', 'Status', 'Cost', 'Price']],
        body: inventoryData,
        theme: 'grid',
        headStyles: { fillColor: [155, 89, 182], textColor: 255 },
        styles: { fontSize: 7, cellPadding: 3 },
        margin: { left: 20, right: 20 },
        pageBreak: 'auto'
      });

      // Footer on each page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount} • Confidential Business Report`,
          105,
          287,
          null,
          null,
          'center'
        );
        doc.text(
          `Generated by POS System • ${reportData.storeName}`,
          105,
          292,
          null,
          null,
          'center'
        );
      }

      // Save the PDF
      const fileName = `Sales_Report_${reportData.storeName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy_MM_dd')}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handleQuickDateSelect = (months) => {
    const today = new Date();
    setDateRange({
      start: startOfMonth(subMonths(today, months)),
      end: endOfMonth(today)
    });
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

  return (
    <Card className="mb-6 border-2 border-dashed border-blue-100 dark:border-blue-900/30">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FiFileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              Detailed Business Report
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Generate comprehensive PDF reports with sales, products, and inventory details
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Button
              onClick={generatePDF}
              disabled={!reportData || isGeneratingPDF}
              className="w-full sm:w-auto"
              variant="primary"
            >
              <FiDownload className="mr-2" />
              {isGeneratingPDF ? 'Generating PDF...' : 'Download Full Report'}
            </Button>
            
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <FiPrinter className="mr-2" />
              Print Preview
            </Button>
          </div>
        </div>

        {/* Report Controls */}
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiCalendar className="inline mr-2" />
                Report Period
              </label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                className="w-full"
              />
              
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickDateSelect(0)}
                >
                  This Month
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickDateSelect(1)}
                >
                  Last Month
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickDateSelect(3)}
                >
                  Last 3 Months
                </Button>
              </div>
            </div>

            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiFilter className="inline mr-2" />
                Report View
              </label>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant={reportType === 'sales' ? 'primary' : 'outline'}
                  onClick={() => setReportType('sales')}
                  className="justify-start"
                >
                  <FiDollarSign className="mr-2" />
                  Sales Overview
                </Button>
                <Button
                  size="sm"
                  variant={reportType === 'products' ? 'primary' : 'outline'}
                  onClick={() => setReportType('products')}
                  className="justify-start"
                >
                  <FiPackage className="mr-2" />
                  Product Sales
                </Button>
                <Button
                  size="sm"
                  variant={reportType === 'inventory' ? 'primary' : 'outline'}
                  onClick={() => setReportType('inventory')}
                  className="justify-start"
                >
                  <FiTrendingUp className="mr-2" />
                  Inventory Status
                </Button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Report Summary
              </h3>
              {reportData ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Period:</span>
                    <span className="text-sm font-medium">
                      {format(reportData.dateRange.start, 'MMM d')} - {format(reportData.dateRange.end, 'MMM d')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Sales:</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {currency.symbol}{reportData.summary.totalSales.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Profit:</span>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {currency.symbol}{reportData.summary.totalProfit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Orders:</span>
                    <span className="text-sm font-medium">
                      {reportData.summary.totalOrders}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Report Preview */}
        <div ref={reportRef} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Report Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 p-4 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{reportData?.storeName || 'My Store'}</h3>
                <p className="text-blue-100 dark:text-blue-200">
                  {format(dateRange.start, 'MMMM d, yyyy')} - {format(dateRange.end, 'MMMM d, yyyy')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100 dark:text-blue-200">Sales Report</p>
                <p className="text-lg font-bold">{currency.symbol}{reportData?.summary.totalSales.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="p-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FiDollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Sales</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {currency.symbol}{reportData?.summary.totalSales.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FiTrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Profit</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {currency.symbol}{reportData?.summary.totalProfit.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FiShoppingBag className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Orders</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {reportData?.summary.totalOrders || 0}
                </p>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FiPackage className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Products Sold</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {reportData?.summary.totalProductsSold || 0}
                </p>
              </div>
            </div>

            {/* Data Table based on report type */}
            <div className="overflow-x-auto">
              {reportType === 'sales' && (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="p-3 text-left font-medium">Order #</th>
                      <th className="p-3 text-left font-medium">Date</th>
                      <th className="p-3 text-left font-medium">Customer</th>
                      <th className="p-3 text-left font-medium">Payment</th>
                      <th className="p-3 text-left font-medium">Amount</th>
                      <th className="p-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedSales.length > 0 ? (
                      paginatedSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-3 font-mono text-xs">{sale.order_number || 'N/A'}</td>
                          <td className="p-3">{format(new Date(sale.created_at), 'MMM d, yyyy')}</td>
                          <td className="p-3">{sale.customer?.name || 'Walk-in'}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              {sale.payment_method || 'Cash'}
                            </span>
                          </td>
                          <td className="p-3 font-medium">
                            {currency.symbol}{parseFloat(sale.total || 0).toFixed(2)}
                          </td>
                          <td className="p-3">
                            <span className="flex items-center gap-1">
                              {sale.status === 'completed' ? (
                                <>
                                  <FiCheckCircle className="h-3 w-3 text-green-500" />
                                  <span className="text-green-600 dark:text-green-400">Completed</span>
                                </>
                              ) : (
                                <>
                                  <FiXCircle className="h-3 w-3 text-red-500" />
                                  <span className="text-red-600 dark:text-red-400">Cancelled</span>
                                </>
                              )}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">
                          No sales data available for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {reportType === 'products' && (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="p-3 text-left font-medium">Product</th>
                      <th className="p-3 text-left font-medium">Category</th>
                      <th className="p-3 text-left font-medium">Quantity Sold</th>
                      <th className="p-3 text-left font-medium">Unit Price</th>
                      <th className="p-3 text-left font-medium">Total Sales</th>
                      <th className="p-3 text-left font-medium">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedOrderItems.length > 0 ? (
                      paginatedOrderItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-3 font-medium">{item.product?.name || 'Unknown'}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                              {item.product?.category || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3">{currency.symbol}{parseFloat(item.unit_price || 0).toFixed(2)}</td>
                          <td className="p-3 font-medium">
                            {currency.symbol}{parseFloat(item.total_price || 0).toFixed(2)}
                          </td>
                          <td className="p-3">
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {currency.symbol}
                              {((parseFloat(item.product?.price || item.unit_price || 0) - parseFloat(item.product?.cost || 0)) * item.quantity).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">
                          No product sales data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {reportType === 'inventory' && (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="p-3 text-left font-medium">Product</th>
                      <th className="p-3 text-left font-medium">SKU</th>
                      <th className="p-3 text-left font-medium">Current Stock</th>
                      <th className="p-3 text-left font-medium">Min Stock</th>
                      <th className="p-3 text-left font-medium">Status</th>
                      <th className="p-3 text-left font-medium">Cost</th>
                      <th className="p-3 text-left font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedProducts.length > 0 ? (
                      paginatedProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-3 font-medium">{product.name}</td>
                          <td className="p-3 font-mono text-xs">{product.sku || 'N/A'}</td>
                          <td className="p-3">{product.stock_quantity}</td>
                          <td className="p-3">{product.min_stock_level}</td>
                          <td className="p-3">
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              product.stock_quantity <= product.min_stock_level
                                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            }`}>
                              {product.stock_quantity <= product.min_stock_level ? (
                                <>
                                  <FiXCircle className="h-3 w-3" />
                                  Low Stock
                                </>
                              ) : (
                                <>
                                  <FiCheckCircle className="h-3 w-3" />
                                  In Stock
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-3">{currency.symbol}{parseFloat(product.cost || 0).toFixed(2)}</td>
                          <td className="p-3 font-medium">
                            {currency.symbol}{parseFloat(product.price || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                          No inventory data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {indexOfFirstItem + 1} to {Math.min(
                    reportType === 'sales' ? reportData.sales.length :
                    reportType === 'products' ? reportData.products.length :
                    reportData.orderItems.length,
                    indexOfLastItem
                  )} of {
                    reportType === 'sales' ? reportData.sales.length :
                    reportType === 'products' ? reportData.products.length :
                    reportData.orderItems.length
                  } entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <FiChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <FiChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <FiFileText className="h-4 w-4" />
              What's included in the PDF:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Complete sales summary with totals and profit margins</li>
              <li>• Detailed sales transactions with customer information</li>
              <li>• Product-wise sales breakdown</li>
              <li>• Current inventory status with stock levels</li>
              <li>• Low stock alerts and recommendations</li>
              <li>• Professional formatting with your store branding</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <FiUser className="h-4 w-4" />
              Perfect for:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Monthly business reviews with stakeholders</li>
              <li>• Tax documentation and accounting</li>
              <li>• Inventory planning and reordering</li>
              <li>• Performance analysis and strategy meetings</li>
              <li>• Bank loan applications and financial reporting</li>
              <li>• Year-end financial summaries</li>
            </ul>
          </div>
        </div>

        {/* Download Note */}
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> The downloaded PDF will contain the complete dataset, not just the preview shown above. 
            All sales, product, and inventory data for the selected period will be included in the final report.
          </p>
        </div>
      </div>
    </Card>
  );
}