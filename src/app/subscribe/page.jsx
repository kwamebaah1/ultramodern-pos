"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { FiLoader, FiCheckCircle, FiXCircle, FiArrowRight } from 'react-icons/fi';

function SubscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get('store_id');
  const paymentStatus = searchParams.get('payment');
  
  const [loading, setLoading] = useState(false);
  const [store, setStore] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [plans, setPlans] = useState([
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 10000, // 100 GHS in kobo
      description: 'Essential features for small businesses',
      features: ['Up to 3 registers', 'Basic reporting', 'Email support']
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 25000, // 250 GHS in kobo
      description: 'Advanced features for growing businesses',
      features: ['Unlimited registers', 'Advanced analytics', 'Priority support'],
      recommended: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 50000, // 500 GHS in kobo
      description: 'Custom solutions for large businesses',
      features: ['Dedicated account manager', 'Custom integrations', '24/7 support']
    }
  ]);
  const [selectedPlan, setSelectedPlan] = useState('pro');

  useEffect(() => {
    const fetchStoreData = async () => {
      if (!storeId) {
        router.push('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('stores')
          .select('name, subscription_status, trial_ends_at, owner_id')
          .eq('id', storeId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Store not found');

        setStore(data);

        // Get owner email
        const { data: ownerData } = await supabase
          .from('users')
          .select('email')
          .eq('auth_user_id', data.owner_id)
          .single();

        setUserEmail(ownerData?.email || '');
      } catch (error) {
        toast.error(error.message);
        router.push('/');
      }
    };

    fetchStoreData();
  }, [storeId, router]);

  useEffect(() => {
    if (paymentStatus === 'success') {
      toast.success('Payment successful! Your subscription is now active.');
    } else if (paymentStatus === 'failed') {
      toast.error('Payment failed. Please try again.');
    } else if (paymentStatus === 'error') {
      toast.error('An error occurred during payment processing.');
    }
  }, [paymentStatus]);

  const handleSubscribe = async () => {
    if (!storeId || !userEmail) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          store_id: storeId, 
          email: userEmail,
          plan: selectedPlan,
          amount: plans.find(p => p.id === selectedPlan).price
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initialize payment');
      }

      window.location.href = data.data.authorization_url;
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {store.subscription_status === 'trial' 
              ? 'Your trial has ended' 
              : 'Upgrade Your Subscription'}
          </h1>
          <p className="text-lg text-gray-600">
            Choose a plan to continue using UltraPOS
          </p>
        </div>

        {paymentStatus === 'success' ? (
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <FiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your subscription is now active. You can start using all features immediately.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Go to Dashboard <FiArrowRight className="ml-2" />
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`rounded-lg shadow-md overflow-hidden ${plan.recommended ? 'ring-2 ring-indigo-600' : ''}`}
              >
                {plan.recommended && (
                  <div className="bg-indigo-600 text-white text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div className="p-6 bg-white">
                  <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                  <p className="mt-4 text-sm text-gray-500">{plan.description}</p>
                  <div className="mt-6">
                    <span className="text-4xl font-bold text-gray-900">
                      GH₵{(plan.price / 100).toFixed(2)}
                    </span>
                    <span className="text-base font-medium text-gray-500">/month</span>
                  </div>
                  <button
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`mt-6 w-full px-4 py-2 rounded-md ${selectedPlan === plan.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                  </button>
                </div>
                <div className="px-6 pt-4 pb-6 bg-gray-50">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features
                  </h4>
                  <ul className="mt-4 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <FiCheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                        <span className="ml-3 text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {paymentStatus !== 'success' && (
          <div className="mt-12 text-center">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin inline mr-2" />
                  Processing...
                </>
              ) : (
                'Subscribe Now'
              )}
            </button>
            <p className="mt-3 text-sm text-gray-500">
              Secure payment processed by Paystack
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <SubscribeContent />
    </Suspense>
  );
}