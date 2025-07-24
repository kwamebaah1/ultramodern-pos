'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiUser, FiPlus, FiEdit2, FiTrash2, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import CustomerFormModal from '@/components/customers/CustomerFormModal.';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const router = useRouter();

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
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

      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('store_id', userProfile.store_id)
          .order('created_at', { ascending: false });

        if (!error) {
          setCustomers(data);
          setFilteredCustomers(data);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Filter customers based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer => {
        const searchLower = searchTerm.toLowerCase();
        return (
          customer.first_name.toLowerCase().includes(searchLower) ||
          customer.last_name.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.phone.toLowerCase().includes(searchLower)
        );
      });
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  const handleCreateCustomer = async (customerData) => {
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (!error) {
      setCustomers([data, ...customers]);
      setShowCreateModal(false);
    }
  };

  const handleUpdateCustomer = async (customerData) => {
    const { data, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', editingCustomer.id)
      .select()
      .single();

    if (!error) {
      setCustomers(customers.map(c => c.id === data.id ? data : c));
      setEditingCustomer(null);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (!error) {
      setCustomers(customers.filter(c => c.id !== customerId));
    }
  };

  const handleViewOrders = (customerId) => {
    router.push(`/orders?customerId=${customerId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customer Management</h1>
          <p className="text-gray-500">Manage your customer records and loyalty programs</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<FiSearch className="text-gray-400" />}
            className="flex-1"
          />
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <FiPlus /> New Customer
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <FiUser className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">No customers found</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm ? 'Try a different search term' : 'Get started by creating a new customer'}
          </p>
          <div className="mt-6">
            <Button onClick={() => setShowCreateModal(true)}>
              <FiPlus className="mr-2" /> Add Customer
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Loyalty Points
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <FiUser className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.first_name} {customer.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Joined {new Date(customer.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <FiMail className="h-4 w-4 text-gray-400" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2">
                            <FiPhone className="h-4 w-4 text-gray-400" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center gap-2">
                            <FiMapPin className="h-4 w-4 text-gray-400" />
                            <span className="truncate max-w-xs">{customer.address}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.loyalty_points > 0
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {customer.loyalty_points} points
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrders(customer.id)}
                        >
                          Orders
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCustomer(customer)}
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteCustomer(customer.id)}
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CustomerFormModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateCustomer}
        />
      )}

      {editingCustomer && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSave={handleUpdateCustomer}
        />
      )}
    </div>
  );
}