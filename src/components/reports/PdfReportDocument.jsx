import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet,
  Font
} from '@react-pdf/renderer';
import { format } from 'date-fns';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/roboto-font@0.1.0/fonts/Roboto/roboto-regular-webfont.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/roboto-font@0.1.0/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  reportInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  reportPeriod: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 3,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    width: '48%',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  summaryCardTitle: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  summaryCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  table: {
    width: '100%',
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    borderBottomStyle: 'solid',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#334155',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: '#334155',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderTopStyle: 'solid',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 30,
    fontSize: 9,
    color: '#94a3b8',
  },
  noData: {
    fontSize: 10,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#cbd5e1',
    borderTopStyle: 'solid',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
  },
});

const PdfReportDocument = ({ reportData, currency, dateRange, reportType = 'sales' }) => {
  if (!reportData) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>No report data available</Text>
        </Page>
      </Document>
    );
  }

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount || 0);
    return `${currency?.symbol || '$'}${numAmount.toFixed(2)}`;
  };

  // Helper function to safely render data
  const SalesReport = () => {
    const sales = reportData.sales || [];
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales Transactions</Text>
        
        {sales.length === 0 ? (
          <Text style={styles.noData}>No sales data available for this period</Text>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.6 }]}>#</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Order ID</Text>
              <Text style={styles.tableHeaderCell}>Date</Text>
              <Text style={styles.tableHeaderCell}>Customer</Text>
              <Text style={styles.tableHeaderCell}>Payment</Text>
              <Text style={styles.tableHeaderCell}>Amount</Text>
            </View>

            {sales.slice(0, 50).map((sale, index) => (
              <View key={sale.id || index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>{index + 1}</Text>
                <Text style={[styles.tableCell, { flex: 1.5, fontWeight: 'bold' }]}>
                  {sale.order_number || `ORD-${(sale.id || '').slice(0, 8).toUpperCase() || 'N/A'}`}
                </Text>
                <Text style={styles.tableCell}>{formatDate(sale.created_at)}</Text>
                <Text style={styles.tableCell}>
                  {sale.customer?.name || sale.customer || 'Walk-in Customer'}
                </Text>
                <Text style={styles.tableCell}>{sale.payment_method || 'Cash'}</Text>
                <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>
                  {formatCurrency(sale.total)}
                </Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Sales ({sales.length} orders)</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(reportData.summary?.totalSales || 0)}
              </Text>
            </View>
          </>
        )}
      </View>
    );
  };

  const ProductsReport = () => {
    const items = reportData.orderItems || [];
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Sales Analysis</Text>
        
        {items.length === 0 ? (
          <Text style={styles.noData}>No product sales data available for this period</Text>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.6 }]}>#</Text>
              <Text style={styles.tableHeaderCell}>Product</Text>
              <Text style={styles.tableHeaderCell}>Category</Text>
              <Text style={styles.tableHeaderCell}>Qty</Text>
              <Text style={styles.tableHeaderCell}>Unit Price</Text>
              <Text style={styles.tableHeaderCell}>Total</Text>
            </View>

            {items.slice(0, 50).map((item, index) => {
              const productName = item.product?.name || 'Unknown Product';
              const category = item.product?.category || 'Uncategorized';
              const quantity = item.quantity || 0;
              const unitPrice = parseFloat(item.unit_price || 0);
              const totalPrice = parseFloat(item.total_price || 0);
              
              return (
                <View key={item.id || index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 0.6 }]}>{index + 1}</Text>
                  <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{productName}</Text>
                  <Text style={styles.tableCell}>{category}</Text>
                  <Text style={styles.tableCell}>{quantity}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(unitPrice)}</Text>
                  <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>
                    {formatCurrency(totalPrice)}
                  </Text>
                </View>
              );
            })}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Products Sold</Text>
              <Text style={styles.totalValue}>
                {reportData.summary?.totalProductsSold || 0}
              </Text>
            </View>
          </>
        )}
      </View>
    );
  };

  const InventoryReport = () => {
    const products = reportData.products || [];
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inventory Status</Text>
        
        {products.length === 0 ? (
          <Text style={styles.noData}>No inventory data available</Text>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.6 }]}>#</Text>
              <Text style={styles.tableHeaderCell}>Product</Text>
              <Text style={styles.tableHeaderCell}>SKU</Text>
              <Text style={styles.tableHeaderCell}>Stock</Text>
              <Text style={styles.tableHeaderCell}>Status</Text>
              <Text style={styles.tableHeaderCell}>Price</Text>
            </View>

            {products.slice(0, 50).map((product, index) => {
              const stockQty = product.stock_quantity || 0;
              const minStock = product.min_stock_level || 0;
              const isLowStock = stockQty <= minStock;
              
              return (
                <View key={product.id || index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 0.6 }]}>{index + 1}</Text>
                  <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{product.name}</Text>
                  <Text style={styles.tableCell}>{product.sku || 'N/A'}</Text>
                  <Text style={styles.tableCell}>{stockQty}</Text>
                  <Text style={[
                    styles.tableCell,
                    { color: isLowStock ? '#dc2626' : '#059669', fontWeight: 'bold' }
                  ]}>
                    {isLowStock ? 'LOW' : 'OK'}
                  </Text>
                  <Text style={styles.tableCell}>{formatCurrency(product.price)}</Text>
                </View>
              );
            })}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Products: {products.length}</Text>
              <Text style={[styles.totalValue, { color: '#059669' }]}>
                {products.filter(p => (p.stock_quantity || 0) > (p.min_stock_level || 0)).length} in stock
              </Text>
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{reportData.storeName || 'My Store'}</Text>
              <Text style={styles.reportPeriod}>
                Business Report • {formatDate(dateRange.start)} to {formatDate(dateRange.end)}
              </Text>
            </View>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>Sales Analysis Report</Text>
              <Text style={styles.reportPeriod}>
                Generated: {format(new Date(), 'MMM dd, yyyy hh:mm a')}
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Total Revenue</Text>
              <Text style={styles.summaryCardValue}>
                {formatCurrency(reportData.summary?.totalSales || 0)}
              </Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Total Orders</Text>
              <Text style={styles.summaryCardValue}>
                {reportData.summary?.totalOrders || 0}
              </Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Products Sold</Text>
              <Text style={styles.summaryCardValue}>
                {reportData.summary?.totalProductsSold || 0}
              </Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Avg Order Value</Text>
              <Text style={styles.summaryCardValue}>
                {formatCurrency(reportData.summary?.averageOrderValue || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Dynamic Report Section */}
        {reportType === 'sales' && <SalesReport />}
        {reportType === 'products' && <ProductsReport />}
        {reportType === 'inventory' && <InventoryReport />}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Confidential Business Document • Generated by POS System • Page 
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
              ` ${pageNumber} of ${totalPages}`
            )} fixed />
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default PdfReportDocument;