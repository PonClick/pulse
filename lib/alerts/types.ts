import type { Tables } from '@/lib/supabase/database.types'

export type Service = Tables<'services'>
export type AlertChannel = Tables<'alert_channels'>
export type Incident = Tables<'incidents'>

export interface AlertPayload {
  service: Service
  status: 'up' | 'down'
  message: string
  responseTimeMs: number
  timestamp: string
  incident?: Incident
}

export type AlertSender = (
  channel: AlertChannel,
  payload: AlertPayload
) => Promise<{ success: boolean; error?: string }>
