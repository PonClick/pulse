import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Server-side URL can differ from browser URL (e.g., in Docker)
// - Browser needs localhost:54321 (accessible from host machine)
// - Server inside Docker needs host.docker.internal:54321
function getServerUrl(): string {
  return process.env.SUPABASE_SERVER_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
}

// Admin client that bypasses RLS using service role key
// Use this ONLY for server-side operations that need to bypass RLS
export function createAdminClient() {
  const supabaseUrl = getServerUrl()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
