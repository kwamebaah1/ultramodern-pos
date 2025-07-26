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
        .select('subscription_status, trial_ends_at, billing_enabled, current_period_end')
        .eq('id', userData.store_id)
        .single();

      if (storeError || !storeData) {
        console.error('Error fetching store data:', storeError);
        return;
      }

      const now = new Date();
      const trialEndsAt = new Date(storeData.trial_ends_at);
      const periodEnd = storeData.current_period_end ? new Date(storeData.current_period_end) : null;

      // Redirect to subscription page only if:
      // 1. Billing is enabled AND
      // 2. Trial has ended (trial_ends_at is in the past) AND
      // 3. Subscription is not active OR period has ended
      if (storeData.billing_enabled && 
          trialEndsAt < now && 
          (storeData.subscription_status !== 'active' || 
           (periodEnd && periodEnd < now))) {
        router.push(`/subscribe?store_id=${userData.store_id}`);
      }
    };

    checkSubscription();
  }, [pathname, router]);

  return children;
}