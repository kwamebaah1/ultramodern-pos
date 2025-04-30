import { supabase } from './client';

// Sign in with email and password
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Get current user session
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
};