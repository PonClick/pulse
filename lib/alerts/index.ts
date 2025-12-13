import { createAdminClient } from '@/lib/supabase/admin'
import { sendWebhook } from './webhook'
import { sendEmail } from './email'
import { sendSlack } from './slack'
import { sendDiscord } from './discord'
import type { AlertChannel, AlertPayload, AlertSender, Service, Incident } from './types'

export type { AlertPayload, Service, Incident }

const senders: Record<string, AlertSender> = {
  webhook: sendWebhook,
  email: sendEmail,
  slack: sendSlack,
  discord: sendDiscord,
}

/**
 * Check if a service is currently in a maintenance window
 */
export async function isInMaintenance(serviceId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('maintenance_windows')
    .select('id')
    .eq('service_id', serviceId)
    .lte('start_time', now)
    .gte('end_time', now)
    .limit(1)

  if (error) {
    console.error('[isInMaintenance]', error)
    return false
  }

  return (data?.length ?? 0) > 0
}

/**
 * Send alerts to all configured channels for a service
 * Alerts are skipped if the service is in a maintenance window
 */
export async function sendAlerts(payload: AlertPayload): Promise<{
  sent: number
  failed: number
  errors: string[]
  skippedForMaintenance: boolean
}> {
  const supabase = createAdminClient()

  // Check if service is in maintenance - skip alerts if so
  const inMaintenance = await isInMaintenance(payload.service.id)
  if (inMaintenance) {
    console.log(`[sendAlerts] Service ${payload.service.name} is in maintenance, skipping alerts`)
    return { sent: 0, failed: 0, errors: [], skippedForMaintenance: true }
  }

  // Get alert channels linked to this service
  const { data: links, error: linksError } = await supabase
    .from('service_alert_channels')
    .select('alert_channel_id')
    .eq('service_id', payload.service.id)

  if (linksError || !links?.length) {
    return { sent: 0, failed: 0, errors: [], skippedForMaintenance: false }
  }

  const channelIds = links.map(l => l.alert_channel_id)

  // Get the actual channel configs
  const { data: channels, error: channelsError } = await supabase
    .from('alert_channels')
    .select('*')
    .in('id', channelIds)
    .eq('is_active', true)

  if (channelsError || !channels?.length) {
    return { sent: 0, failed: 0, errors: [], skippedForMaintenance: false }
  }

  // Send to each channel
  const results = await Promise.all(
    channels.map(async (channel) => {
      const sender = senders[channel.type]
      if (!sender) {
        return { success: false, error: `Unknown channel type: ${channel.type}` }
      }

      try {
        return await sender(channel as AlertChannel, payload)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: errorMessage }
      }
    })
  )

  const sent = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const errors = results.filter(r => r.error).map(r => r.error!)

  return { sent, failed, errors, skippedForMaintenance: false }
}

/**
 * Create an incident when a service goes down
 */
export async function createIncident(service: Service, message: string): Promise<Incident | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('incidents')
    .insert({
      service_id: service.id,
      started_at: new Date().toISOString(),
      cause: message,
    })
    .select()
    .single()

  if (error) {
    console.error('[createIncident]', error)
    return null
  }

  return data as Incident
}

/**
 * Close an incident when a service recovers
 */
export async function closeIncident(serviceId: string): Promise<Incident | null> {
  const supabase = createAdminClient()

  // Find the open incident for this service
  const { data: openIncident, error: findError } = await supabase
    .from('incidents')
    .select('*')
    .eq('service_id', serviceId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (findError || !openIncident) {
    return null
  }

  const endedAt = new Date()
  const startedAt = new Date(openIncident.started_at)
  const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)

  const { data, error } = await supabase
    .from('incidents')
    .update({
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq('id', openIncident.id)
    .select()
    .single()

  if (error) {
    console.error('[closeIncident]', error)
    return null
  }

  return data as Incident
}

/**
 * Get the last heartbeat status for a service
 */
export async function getLastStatus(serviceId: string): Promise<'up' | 'down' | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('heartbeats')
    .select('status')
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return data.status as 'up' | 'down'
}
