'use client';

import { useState, useEffect } from 'react';
import { FiUser, FiSearch, FiPlus } from 'react-icons/fi';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function CustomerSelect({ selectedCustomer, onSelect, onCreateNew }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (searchTerm.trim() === '') {
        setCustomers([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
          .limit(10);

        if (!error) {
          setCustomers(data);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return (
    <div className="space-y-2">
      {selectedCustomer ? (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
              <FiUser className="text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="font-medium">
                {selectedCustomer.first_name} {selectedCustomer.last_name}
              </p>
              <p className="text-sm text-gray-500">
                {selectedCustomer.phone || selectedCustomer.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelect(null)}
            className="text-red-500 hover:text-red-700"
          >
            Clear
          </button>
        </div>
      ) : (
        <>
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<FiSearch className="text-gray-400" />}
          />
          {isLoading && <p className="text-sm text-gray-500">Searching...</p>}
          {customers.length > 0 && (
            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    onSelect(customer);
                    setSearchTerm('');
                    setCustomers([]);
                  }}
                >
                  <p className="font-medium">
                    {customer.first_name} {customer.last_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {customer.phone && <span>{customer.phone} • </span>}
                    {customer.email}
                  </p>
                </div>
              ))}
            </div>
          )}
          {searchTerm && customers.length === 0 && !isLoading && (
            <Button
              variant="outline"
              onClick={() => onCreateNew(searchTerm)}
              className="w-full flex items-center gap-2"
            >
              <FiPlus />
              Create new customer: "{searchTerm}"
            </Button>
          )}
        </>
      )}
    </div>
  );
}