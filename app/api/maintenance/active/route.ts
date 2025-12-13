import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/maintenance/active
 * Returns all currently active maintenance windows
 * Optionally filter by serviceId
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')

    const now = new Date().toISOString()

    let query = supabase
      .from('maintenance_windows')
      .select(`
        *,
        services (
          id,
          name
        )
      `)
      .lte('start_time', now)
      .gte('end_time', now)
      .order('end_time', { ascending: true })

    if (serviceId) {
      query = query.eq('service_id', serviceId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[GET /api/maintenance/active]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/maintenance/active]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
