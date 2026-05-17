import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let publicClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export function isAdminSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

export function getPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase public environment variables are not configured.");
  }
  publicClient ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return publicClient;
}

export function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Supabase admin environment variables are not configured.");
  }
  adminClient ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}
