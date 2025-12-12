import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)

    // Default to last 24 hours, max 50 heartbeats for sparkline
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const range = searchParams.get('range') || '24h'

    // Calculate the start time based on range
    const now = new Date()
    let startTime: Date

    switch (range) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    const supabase = createAdminClient()

    const { data: heartbeats, error } = await supabase
      .from('heartbeats')
      .select('id, status, response_time_ms, status_code, message, created_at')
      .eq('service_id', id)
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[GET /api/services/[id]/heartbeats]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Reverse to get chronological order for charts
    return NextResponse.json(heartbeats?.reverse() || [])
  } catch (error) {
    console.error('[GET /api/services/[id]/heartbeats]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
