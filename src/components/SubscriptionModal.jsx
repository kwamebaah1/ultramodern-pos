"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function SubscriptionModal({ storeId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('subscription_status, current_period_end, billing_enabled')
        .eq('id', storeId)
        .single();

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      if (data.billing_enabled && 
          (data.subscription_status !== 'active' || 
           new Date(data.current_period_end) < new Date())) {
        setIsOpen(true);
        setSubscriptionStatus(data.subscription_status);
      }
    };

    checkSubscription();
  }, [storeId]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Initialize Paystack payment
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId, email: user.email })
      });
      
      const { data } = await response.json();
      window.location.href = data.authorization_url;
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Subscription Required</h2>
        <p className="mb-6">
          {subscriptionStatus === 'trial' 
            ? "Your free trial has ended. Please subscribe to continue using the service."
            : "Your subscription has expired. Please renew to continue using the service."}
        </p>
        <div className="flex justify-end space-x-3">
          <button 
            onClick={() => window.location.href = '/logout'}
            className="px-4 py-2 border rounded-md"
          >
            Logout
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Subscribe Now'}
          </button>
        </div>
      </div>
    </div>
  );
}