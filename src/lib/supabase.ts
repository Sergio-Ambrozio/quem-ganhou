import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables are not configured. " +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Singleton for client-side usage
let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowser(): SupabaseClient {
  if (!browserClient) {
    browserClient = createSupabaseClient();
  }
  return browserClient;
}

// Server-side: always create a fresh client
export function getSupabaseServer(): SupabaseClient {
  return createSupabaseClient();
}
