import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkHttp, checkTcp, checkPing, checkDns, checkDocker, checkSsl } from '@/lib/checks'
import type { Service, CheckResult } from '@/lib/checks'
import {
  sendAlerts,
  createIncident,
  closeIncident,
  getLastStatus,
} from '@/lib/alerts'

/**
 * Health check worker endpoint
 * Called periodically to check services that are due
 *
 * GET /api/cron/check
 */
export async function GET(): Promise<NextResponse> {
  const startTime = Date.now()
  const supabase = createAdminClient()

  try {
    // Fetch services that are due for checking
    const { data: services, error: fetchError } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .eq('is_paused', false)
      .lte('next_check', new Date().toISOString())
      .order('next_check', { ascending: true })
      .limit(10) // Process max 10 services per run

    if (fetchError) {
      console.error('[cron/check] Fetch error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!services || services.length === 0) {
      return NextResponse.json({
        message: 'No services due for checking',
        checked: 0,
        duration: Date.now() - startTime,
      })
    }

    // Process each service
    const results: Array<{
      serviceId: string
      serviceName: string
      status: string
      responseTime: number
      statusChanged: boolean
      alertsSent: number
    }> = []

    for (const service of services) {
      try {
        const typedService = service as Service

        // Get the previous status before the new check
        const previousStatus = await getLastStatus(service.id)

        // Run the appropriate check based on service type
        const result = await runCheck(typedService)

        // Insert heartbeat record
        const { error: heartbeatError } = await supabase
          .from('heartbeats')
          .insert({
            service_id: service.id,
            status: result.status,
            response_time_ms: result.responseTimeMs,
            status_code: result.statusCode,
            message: result.message,
          })

        if (heartbeatError) {
          console.error(`[cron/check] Heartbeat insert error for ${service.name}:`, heartbeatError)
        }

        // Calculate next check time
        const intervalSeconds = service.interval_seconds || 60
        const nextCheck = new Date(Date.now() + intervalSeconds * 1000).toISOString()

        // Update service with next_check time
        const { error: updateError } = await supabase
          .from('services')
          .update({ next_check: nextCheck })
          .eq('id', service.id)

        if (updateError) {
          console.error(`[cron/check] Update error for ${service.name}:`, updateError)
        }

        // Check for status change and handle alerts
        let alertsSent = 0
        const statusChanged = previousStatus !== null && previousStatus !== result.status

        if (statusChanged) {
          const timestamp = new Date().toISOString()

          if (result.status === 'down') {
            // Service went down - create incident and send alerts
            const incident = await createIncident(typedService, result.message)
            const alertResult = await sendAlerts({
              service: typedService,
              status: 'down',
              message: result.message,
              responseTimeMs: result.responseTimeMs,
              timestamp,
              incident: incident || undefined,
            })
            alertsSent = alertResult.sent
            console.log(`[cron/check] ${service.name}: DOWN - ${alertResult.sent} alerts sent`)
          } else if (result.status === 'up') {
            // Service recovered - close incident and send recovery alerts
            const incident = await closeIncident(service.id)
            const alertResult = await sendAlerts({
              service: typedService,
              status: 'up',
              message: result.message,
              responseTimeMs: result.responseTimeMs,
              timestamp,
              incident: incident || undefined,
            })
            alertsSent = alertResult.sent
            console.log(`[cron/check] ${service.name}: RECOVERED - ${alertResult.sent} alerts sent`)
          }
        }

        results.push({
          serviceId: service.id,
          serviceName: service.name,
          status: result.status,
          responseTime: result.responseTimeMs,
          statusChanged,
          alertsSent,
        })

        console.log(`[cron/check] ${service.name}: ${result.status} (${result.responseTimeMs}ms)`)
      } catch (error) {
        console.error(`[cron/check] Error checking ${service.name}:`, error)
        results.push({
          serviceId: service.id,
          serviceName: service.name,
          status: 'error',
          responseTime: 0,
          statusChanged: false,
          alertsSent: 0,
        })
      }
    }

    return NextResponse.json({
      message: `Checked ${results.length} services`,
      checked: results.length,
      results,
      duration: Date.now() - startTime,
    })
  } catch (error) {
    console.error('[cron/check] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function runCheck(service: Service): Promise<CheckResult> {
  switch (service.type) {
    case 'http':
      return checkHttp(service)
    case 'tcp':
      return checkTcp(service)
    case 'ping':
      return checkPing(service)
    case 'dns':
      return checkDns(service)
    case 'docker':
      return checkDocker(service)
    case 'ssl':
      return checkSsl(service)
    case 'heartbeat':
      // Heartbeat services are passive - they wait for external pings
      return {
        status: 'up',
        responseTimeMs: 0,
        message: 'Heartbeat service (passive)',
      }
    default:
      return {
        status: 'down',
        responseTimeMs: 0,
        message: `Unknown service type: ${service.type}`,
      }
  }
}
