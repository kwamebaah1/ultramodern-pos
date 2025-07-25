'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiCalendar, FiClock, FiDollarSign, FiUser, FiEye } from 'react-icons/fi';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate, formatTime } from '@/lib/utils/date';
import { CURRENCIES } from '@/components/currencies/Currency';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState({ symbol: 'GH₵' });
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('store_id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (userError || !userProfile?.store_id) {
        console.error('Store ID not found');
        return;
      }

      const storeId = userProfile.store_id;
      
      const { data: storeData } = await supabase
        .from('stores')
        .select('currency')
        .eq('id', storeId)
        .single();
                  
      const currentCurrency = CURRENCIES.find(c => c.code === (storeData?.currency || 'GHS'));
      setCurrency(currentCurrency || CURRENCIES.find(c => c.code === 'GHS'));
      
      try {
        let query = supabase
          .from('orders')
          .select(`
            *,
            customers:customer_id (first_name, last_name)
          `)
          .eq('store_id', userProfile.store_id)
          .order('created_at', { ascending: false });

        // Apply date range filter if specified
        if (dateRange.start && dateRange.end) {
          query = query
            .gte('created_at', `${dateRange.start}T00:00:00`)
            .lte('created_at', `${dateRange.end}T23:59:59`);
        }

        const { data, error } = await query;

        if (!error) {
          setOrders(data);
          setFilteredOrders(data);
        } else {
          console.error('Error fetching orders:', error);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [dateRange]);

  // Filter orders based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => {
        const searchLower = searchTerm.toLowerCase();
        return (
          order.id.toString().includes(searchLower) ||
          (order.customers?.first_name?.toLowerCase().includes(searchLower)) ||
          (order.customers?.last_name?.toLowerCase().includes(searchLower)) ||
          order.total.toString().includes(searchTerm)
        );
      });
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  const handleViewOrder = (orderId) => {
    router.push(`/orders/${orderId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Order History</h1>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search orders by ID, customer, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<FiSearch className="text-gray-400" />}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700">
              <FiCalendar className="text-gray-500" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-transparent outline-none text-sm"
              />
            </div>
            <span className="flex items-center">to</span>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700">
              <FiCalendar className="text-gray-500" />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-transparent outline-none text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No orders found</p>
          {searchTerm && (
            <Button
              variant="outline"
              onClick={() => setSearchTerm('')}
              className="mt-4"
            >
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        #{order.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {order.customers ? (
                          <>
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <FiUser className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {order.customers.first_name} {order.customers.last_name}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">Guest</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FiCalendar className="h-4 w-4" />
                          {formatDate(order.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <FiClock className="h-4 w-4" />
                          {formatTime(order.created_at)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          <span className="text-green-500">{currency.symbol}</span>{order.total.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        onClick={() => handleViewOrder(order.id)}
                        className="flex items-center gap-1"
                      >
                        <FiEye className="h-4 w-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}