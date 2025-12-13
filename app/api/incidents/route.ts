import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Get all incidents with service info
 * GET /api/incidents
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createAdminClient()

    const { data: incidents, error } = await supabase
      .from('incidents')
      .select(`
        *,
        services (
          id,
          name,
          type
        )
      `)
      .order('started_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[GET /api/incidents]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(incidents)
  } catch (error) {
    console.error('[GET /api/incidents]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
