import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function DELETE(request) {
  try {
    const { userId, authUserId } = await request.json();

    if (!userId || !authUserId) {
      return NextResponse.json({ error: 'userId and authUserId are required' }, { status: 400 });
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
}
