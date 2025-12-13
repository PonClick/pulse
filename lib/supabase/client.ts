import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

// Storage key must be consistent between browser and server
// to ensure cookies are found regardless of URL differences (e.g., Docker)
const STORAGE_KEY = 'sb-pulse-auth-token'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: STORAGE_KEY,
      },
    }
  )
}
