import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  const supabase = createClient();
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  
  try {
    const { store_id, email, plan, amount } = await request.json();

    // Create Paystack customer if not exists
    const { data: store, error } = await supabase
      .from('stores')
      .select('paystack_customer_code')
      .eq('id', store_id)
      .single();

    if (error) throw error;

    let customerCode = store.paystack_customer_code;
    
    if (!customerCode) {
      const customerResponse = await axios.post(
        'https://api.paystack.co/customer',
        { email, metadata: { store_id } },
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
      );
      
      customerCode = customerResponse.data.data.customer_code;
      
      const { error: updateError } = await supabase
        .from('stores')
        .update({ paystack_customer_code: customerCode })
        .eq('id', store_id);

      if (updateError) throw updateError;
    }

    // Initialize transaction
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount,
        customer: customerCode,
        metadata: { store_id, plan },
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/paystack/verify`
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Paystack initialization error:', error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || 'Payment initialization failed' },
      { status: 500 }
    );
  }
}