import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Get all alert channels
 * GET /api/alert-channels
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createAdminClient()

    const { data: channels, error } = await supabase
      .from('alert_channels')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/alert-channels]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(channels)
  } catch (error) {
    console.error('[GET /api/alert-channels]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Create a new alert channel
 * POST /api/alert-channels
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { name, type, config } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data: channel, error } = await supabase
      .from('alert_channels')
      .insert({
        name,
        type,
        config: config || {},
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/alert-channels]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(channel, { status: 201 })
  } catch (error) {
    console.error('[POST /api/alert-channels]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
