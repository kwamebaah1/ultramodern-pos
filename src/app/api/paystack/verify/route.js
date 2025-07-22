import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
  const supabase = createClient();
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');

  try {
    // Verify transaction with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    const { status, metadata } = response.data.data;
    const storeId = metadata.store_id;
    const plan = metadata.plan || 'pro'; // Default to pro if not specified

    if (status === 'success') {
      // Calculate subscription end date based on plan
      const currentPeriodEnd = new Date();
      
      // For monthly plans (all our current plans are monthly)
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

      const { error } = await supabase
        .from('stores')
        .update({ 
          subscription_status: 'active',
          current_period_end: currentPeriodEnd.toISOString(),
          billing_enabled: true,
          plan: plan
        })
        .eq('id', storeId);

      if (error) throw error;

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`);
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/subscribe?payment=failed&store_id=${storeId}`);
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/subscribe?payment=error`);
  }
}