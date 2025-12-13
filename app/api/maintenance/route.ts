import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const createMaintenanceSchema = z.object({
  serviceId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
})

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const activeOnly = searchParams.get('active') === 'true'

    let query = supabase
      .from('maintenance_windows')
      .select(`
        *,
        services (
          id,
          name
        )
      `)
      .order('start_time', { ascending: true })

    if (serviceId) {
      query = query.eq('service_id', serviceId)
    }

    if (activeOnly) {
      const now = new Date().toISOString()
      query = query.lte('start_time', now).gte('end_time', now)
    }

    const { data, error } = await query

    if (error) {
      console.error('[GET /api/maintenance]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/maintenance]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    const validationResult = createMaintenanceSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const supabase = createAdminClient()

    const { data: maintenance, error } = await supabase
      .from('maintenance_windows')
      .insert({
        service_id: data.serviceId,
        title: data.title,
        description: data.description || null,
        start_time: data.startTime,
        end_time: data.endTime,
      })
      .select(`
        *,
        services (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('[POST /api/maintenance]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(maintenance, { status: 201 })
  } catch (error) {
    console.error('[POST /api/maintenance]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
