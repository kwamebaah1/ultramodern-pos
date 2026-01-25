'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
];

export default function StoreSettings({ storeData }) {
  const [formData, setFormData] = useState({
    name: storeData?.name || '',
    currency: storeData?.currency || 'GHS',
    tax_rate: storeData?.tax_rate || 0.00,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: formData.name,
          currency: formData.currency,
          tax_rate: formData.tax_rate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storeData.id);
        
      if (error) throw error;
      
      toast.success('Store settings updated successfully');
    } catch (error) {
      console.error('Error updating store settings:', error);
      toast.error('Failed to update store settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-4">General Settings</h2>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Store Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  This will affect all prices and monetary values in your store.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tax Percentage
                </label>
                <Input
                  label="Tax Rate (%)"
                  name="tax_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={handleChange}
                  helperText="Enter 0 to disable tax, or any percentage value (e.g., 10 for 10%)"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}