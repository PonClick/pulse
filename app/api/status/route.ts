import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ServiceStatus {
  id: string
  name: string
  type: string
  status: 'up' | 'down' | 'pending'
  uptime24h: number | null
}

interface StatusResponse {
  overallStatus: 'operational' | 'degraded' | 'outage'
  healthScore: number
  services: ServiceStatus[]
  lastUpdated: string
}

export async function GET(): Promise<NextResponse<StatusResponse | { error: string }>> {
  try {
    const supabase = createAdminClient()

    // Fetch all active services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, type')
      .eq('is_active', true)
      .order('name')

    if (servicesError) {
      console.error('[GET /api/status]', servicesError)
      return NextResponse.json({ error: servicesError.message }, { status: 500 })
    }

    // Fetch latest heartbeats for each service (last 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const serviceStatuses: ServiceStatus[] = await Promise.all(
      (services || []).map(async (service) => {
        const { data: heartbeats } = await supabase
          .from('heartbeats')
          .select('status')
          .eq('service_id', service.id)
          .gte('created_at', twentyFourHoursAgo)
          .order('created_at', { ascending: false })
          .limit(100)

        const hbs = heartbeats || []
        const latestStatus = hbs[0]?.status
        const upCount = hbs.filter((h) => h.status === 'up').length
        const uptime24h = hbs.length > 0 ? (upCount / hbs.length) * 100 : null

        let status: 'up' | 'down' | 'pending' = 'pending'
        if (latestStatus === 'up') status = 'up'
        else if (latestStatus === 'down') status = 'down'

        return {
          id: service.id,
          name: service.name,
          type: service.type,
          status,
          uptime24h,
        }
      })
    )

    // Calculate overall status
    const upCount = serviceStatuses.filter((s) => s.status === 'up').length
    const downCount = serviceStatuses.filter((s) => s.status === 'down').length
    const totalServices = serviceStatuses.length

    let overallStatus: 'operational' | 'degraded' | 'outage' = 'operational'
    if (downCount === totalServices && totalServices > 0) {
      overallStatus = 'outage'
    } else if (downCount > 0) {
      overallStatus = 'degraded'
    }

    const healthScore = totalServices > 0 ? (upCount / totalServices) * 100 : 100

    return NextResponse.json({
      overallStatus,
      healthScore,
      services: serviceStatuses,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[GET /api/status]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
