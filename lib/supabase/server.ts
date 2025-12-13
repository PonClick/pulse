import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

// Storage key must be consistent between browser and server
// to ensure cookies are found regardless of URL differences (e.g., Docker)
const STORAGE_KEY = 'sb-pulse-auth-token'

// Server-side URL can differ from browser URL (e.g., in Docker)
// - Browser needs localhost:54321 (accessible from host machine)
// - Server inside Docker needs host.docker.internal:54321
function getServerUrl(): string {
  return process.env.SUPABASE_SERVER_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    getServerUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: STORAGE_KEY,
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
