'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { FiPrinter, FiArrowLeft, FiClock, FiCalendar, FiUser, FiCreditCard } from 'react-icons/fi';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { AdvancedImage } from '@cloudinary/react';
import { getCloudinaryImage } from '@/lib/cloudinary';
import { CURRENCIES } from '@/components/currencies/Currency';

export default function OrderReceipt({ params }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [currency, setCurrency] = useState({ symbol: 'GH₵' });
  const router = useRouter();

  const orderid = id;

  useEffect(() => {
    const fetchOrderData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not found:', userError);
        return;
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('store_id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (profileError || !profile?.store_id) {
        console.error('Failed to fetch store_id:', profileError);
        return;
      }
      
      const storeId = profile.store_id;
      
      const { data: storeData } = await supabase
        .from('stores')
        .select('currency')
        .eq('id', storeId)
        .single();
      
      const currentCurrency = CURRENCIES.find(c => c.code === (storeData?.currency || 'GHS'));
      setCurrency(currentCurrency || CURRENCIES.find(c => c.code === 'GHS'));

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderid)
        .single();

      if (orderError) {
        console.error('Error fetching order:', orderError);
        return;
      }

      setOrder(orderData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products:product_id (name, price, image_public_id)
        `)
        .eq('order_id', orderid);

      if (!itemsError) {
        setItems(itemsData);
      }

      if (orderData.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', orderData.customer_id)
          .single();

        if (!customerError) {
          setCustomer(customerData);
        }
      }
    };

    fetchOrderData();
  }, [orderid]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 200);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p>Loading receipt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 print:p-0">
      {/* Print Controls (hidden when printing) */}
      <div className={`max-w-4xl mx-auto mb-6 print:hidden ${isPrinting ? 'hidden' : 'block'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
          <Button
            //variant="outline"
            onClick={() => router.push('/pos')}
            className="flex items-center gap-2 w-full sm:w-auto justify-center text-white"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to POS
          </Button>
          <Button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto justify-center"
          >
            <FiPrinter className="h-4 w-4" />
            Print Receipt
          </Button>
        </div>
      </div>

      {/* Receipt Container */}
      <div id="receipt" className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden print:shadow-none print:rounded-none print:max-w-full">
        {/* Receipt Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 md:p-6 text-white print:p-4">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0">
            <div>
              <h1 className="text-xl md:text-2xl font-bold print:text-xl">Order Receipt</h1>
              <p className="text-blue-100 text-sm md:text-base print:text-blue-200">Thank you for your purchase!</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-blue-100 text-sm md:text-base print:text-blue-200">Order #</p>
              <p className="font-mono text-lg md:text-xl font-bold print:text-lg">{order.id}</p>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="p-4 md:p-6 border-b border-gray-100 print:p-4 print:border-b-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 print:grid-cols-3 print:gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600 print:p-1">
                <FiCalendar className="h-4 w-4 md:h-5 md:w-5 print:h-4 print:w-4" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500 print:text-xs">Date</p>
                <p className="font-medium text-sm md:text-base print:text-sm text-gray-500">{formatDate(order.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600 print:p-1">
                <FiClock className="h-4 w-4 md:h-5 md:w-5 print:h-4 print:w-4" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500 print:text-xs">Time</p>
                <p className="font-medium text-sm md:text-base print:text-sm text-gray-500">{formatTime(order.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600 print:p-1">
                <FiCreditCard className="h-4 w-4 md:h-5 md:w-5 print:h-4 print:w-4" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500 print:text-xs">Payment</p>
                <p className="font-medium text-sm md:text-base capitalize print:text-sm text-gray-500">{order.payment_method || 'Cash'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        {customer && (
          <div className="p-4 md:p-6 border-b border-gray-100 print:p-4 print:border-b-2">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600 print:p-1">
                <FiUser className="h-4 w-4 md:h-5 md:w-5 print:h-4 print:w-4" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500 print:text-xs">Customer</p>
                <p className="font-medium text-sm md:text-base print:text-sm">
                  {customer.first_name} {customer.last_name}
                  {customer.email && (
                    <span className="block text-xs md:text-sm text-gray-500 print:text-xs">{customer.email}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="p-4 md:p-6 print:p-4">
          <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 print:text-base print:mb-2">Order Items</h2>
          <div className="space-y-3 md:space-y-4 print:space-y-2">
            {items.map((item) => {
              const productImage = item.products?.image_public_id
                ? getCloudinaryImage(item.products.image_public_id, [
                    'c_fill', 'w_100', 'h_100', 'q_auto'
                  ])
                : null;

              return (
                <div key={item.id} className="flex items-start gap-3 md:gap-4 pb-3 md:pb-4 border-b border-gray-100 last:border-0 print:pb-2 print:border-b-2 print:gap-2">
                  {productImage ? (
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-md overflow-hidden bg-gray-100 print:hidden">
                      <AdvancedImage 
                        cldImg={productImage}
                        className="object-cover w-full h-full"
                        alt={item.products.name}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400 text-xs print:hidden">
                      No Image
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm md:text-base truncate print:text-sm">{item.products?.name || 'Product'}</h3>
                    <p className="text-xs md:text-sm text-gray-500 print:text-xs">{currency.symbol}{item.unit_price.toFixed(2)} × {item.quantity}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium text-sm md:text-base print:text-sm">{currency.symbol}{item.total_price.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-4 md:p-6 bg-gray-50 print:p-4">
          <div className="space-y-2 print:space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm md:text-base print:text-sm">Subtotal:</span>
              <span className="font-medium text-sm md:text-base print:text-sm text-gray-500">{currency.symbol}{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm md:text-base print:text-sm">Tax ({order.tax_amount > 0 ? (order.tax_amount / order.subtotal * 100).toFixed(0) : 0}%):</span>
              <span className="font-medium text-sm md:text-base print:text-sm text-gray-500">{currency.symbol}{order.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 print:pt-1 print:border-t-2">
              <span className="font-semibold text-base md:text-lg print:text-sm text-gray-500">Total:</span>
              <span className="font-bold text-base md:text-lg print:text-base text-gray-500">{currency.symbol}{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 bg-white border-t border-gray-100 print:p-4 print:border-t-2">
          <div className="text-center text-xs md:text-sm text-gray-500 print:text-xs">
            <p>Thank you for shopping with us!</p>
            <p className="mt-1 print:mt-0">For any inquiries, please contact our support team.</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
            font-size: 12px;
          }
          #receipt {
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
            border-radius: 0;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          @page {
            size: auto;
            margin: 5mm;
          }
        }
        
        /* Mobile-specific improvements */
        @media (max-width: 768px) {
          #receipt {
            font-size: 14px;
          }
          
          .print-controls {
            flex-direction: column;
            gap: 12px;
          }
          
          .order-info-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}