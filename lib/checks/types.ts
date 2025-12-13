import type { Tables } from '@/lib/supabase/database.types'

export type Service = Tables<'services'>

export interface CheckResult {
  status: 'up' | 'down'
  responseTimeMs: number
  statusCode?: number
  message: string
}

export type CheckFunction = (service: Service) => Promise<CheckResult>
