'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPrinter, FiArrowLeft, FiClock, FiCalendar, FiUser, FiCreditCard } from 'react-icons/fi';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { AdvancedImage } from '@cloudinary/react';
import { getCloudinaryImage } from '@/lib/cloudinary';

export default function OrderReceipt({ params }) {
  const { id } = params;
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const router = useRouter();

  let orderid = id;

  useEffect(() => {
    const fetchOrderData = async () => {
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

      // Fetch order items with product details
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className={`max-w-4xl mx-auto mb-6 ${isPrinting ? 'hidden' : 'block'}`}>
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <Button
            variant="outline"
            onClick={() => router.push('/pos')}
            className="flex items-center gap-2"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to POS
          </Button>
          <Button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FiPrinter className="h-4 w-4" />
            Print Receipt
          </Button>
        </div>
      </div>

      {/* Receipt */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">Order Receipt</h1>
              <p className="text-blue-100">Thank you for your purchase!</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100">Order #</p>
              <p className="font-mono text-xl font-bold">{order.id}</p>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="p-6 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <FiCalendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{formatDate(order.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <FiClock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">{formatTime(order.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <FiCreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment</p>
                <p className="font-medium capitalize">{order.payment_method || 'Cash'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        {customer && (
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <FiUser className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">
                  {customer.first_name} {customer.last_name}
                  {customer.email && (
                    <span className="block text-sm text-gray-500">{customer.email}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Order Items</h2>
          <div className="space-y-4">
            {items.map((item) => {
              const productImage = item.products?.image_public_id
                ? getCloudinaryImage(item.products.image_public_id, [
                    'c_fill', 'w_100', 'h_100', 'q_auto'
                  ])
                : null;

              return (
                <div key={item.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                  {productImage ? (
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                      <AdvancedImage 
                        cldImg={productImage}
                        className="object-cover w-full h-full"
                        alt={item.products.name}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{item.products?.name || 'Product'}</h3>
                    <p className="text-sm text-gray-500">${item.unit_price.toFixed(2)} × {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.total_price.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-6 bg-gray-50">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax ({order.tax_amount > 0 ? (order.tax_amount / order.subtotal * 100).toFixed(0) : 0}%):</span>
              <span className="font-medium">${order.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-lg">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-100">
          <div className="text-center text-sm text-gray-500">
            <p>Thank you for shopping with us!</p>
            <p className="mt-1">For any inquiries, please contact our support team.</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-receipt, .print-receipt * {
            visibility: visible;
          }
          .print-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            box-shadow: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}