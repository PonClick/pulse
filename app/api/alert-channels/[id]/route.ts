import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Delete an alert channel
 * DELETE /api/alert-channels/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // First remove any service links
    await supabase
      .from('service_alert_channels')
      .delete()
      .eq('alert_channel_id', id)

    // Then delete the channel
    const { error } = await supabase
      .from('alert_channels')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DELETE /api/alert-channels/[id]]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/alert-channels/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Update an alert channel
 * PATCH /api/alert-channels/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = createAdminClient()

    const { data: channel, error } = await supabase
      .from('alert_channels')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[PATCH /api/alert-channels/[id]]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(channel)
  } catch (error) {
    console.error('[PATCH /api/alert-channels/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
