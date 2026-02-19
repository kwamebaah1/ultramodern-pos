import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { email, password, first_name, last_name, role, store_id } = await request.json();

    if (!email || !password || !first_name || !last_name || !role || !store_id) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Create auth user with email auto-confirmed and first-login flag
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { must_change_password: true },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Insert user profile into users table
    const { data, error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        store_id,
        email,
        first_name,
        last_name,
        role,
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete the auth user if DB insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    return NextResponse.json({ user: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
}
