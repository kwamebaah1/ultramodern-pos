"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function SubscriptionGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip check for auth and subscription pages
    if (pathname.startsWith('/login') || 
        pathname.startsWith('/signup') || 
        pathname.startsWith('/subscribe')) {
      return;
    }

    const checkSubscription = async () => {
      // Get the user's session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Get user's store
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('store_id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user data:', userError);
        router.push('/login');
        return;
      }

      // Get store subscription status
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('subscription_status, current_period_end, billing_enabled')
        .eq('id', userData.store_id)
        .single();

      if (storeError || !storeData) {
        console.error('Error fetching store data:', storeError);
        return;
      }

      // Redirect to subscription page if not active
      if (storeData.billing_enabled && 
          (storeData.subscription_status !== 'active' || 
           new Date(storeData.current_period_end) < new Date())) {
        router.push(`/subscribe?store_id=${userData.store_id}`);
      }
    };

    checkSubscription();
  }, [pathname, router]);

  return children;
}