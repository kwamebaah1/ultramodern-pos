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

    const { status, metadata, amount } = response.data.data;

    if (status === 'success') {
      // Extract POS order metadata
      const storeId = metadata.store_id;
      const originalAmount = metadata.original_amount;
      const paystackFee = metadata.paystack_fee;
      const platformFee = metadata.platform_fee;

      // The POS page will store cart data in sessionStorage before redirecting to Paystack
      // We just need to verify the payment succeeded and redirect back to complete the order
      // The order creation will happen on the client side after successful verification

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/pos?payment=success&reference=${reference}`
      );
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/pos?payment=failed&reference=${reference}`
    );
  } catch (error) {
    console.error('POS Payment verification error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/pos?payment=error`
    );
  }
}
