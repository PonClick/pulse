import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateServiceSchema } from '@/lib/validations/service'
import type { TablesUpdate } from '@/lib/supabase/database.types'

type ServiceUpdate = TablesUpdate<'services'>

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data: service, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 })
      }
      console.error('[GET /api/services/[id]]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('[GET /api/services/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate update fields
    const validationResult = updateServiceSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const supabase = createAdminClient()

    // Build update object
    const updateData: ServiceUpdate = {
      updated_at: new Date().toISOString(),
    }

    // Map camelCase to snake_case
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.intervalSeconds !== undefined) updateData.interval_seconds = data.intervalSeconds
    if (data.timeoutSeconds !== undefined) updateData.timeout_seconds = data.timeoutSeconds
    if (data.retries !== undefined) updateData.retries = data.retries

    // Type-specific fields
    if ('url' in data) updateData.url = data.url
    if ('method' in data) updateData.method = data.method
    if ('expectedStatus' in data) updateData.expected_status = data.expectedStatus
    if ('keyword' in data) updateData.keyword = data.keyword
    if ('verifySsl' in data) updateData.verify_ssl = data.verifySsl
    if ('hostname' in data) updateData.hostname = data.hostname
    if ('port' in data) updateData.port = data.port
    if ('dnsRecordType' in data) updateData.dns_record_type = data.dnsRecordType
    if ('dnsServer' in data) updateData.dns_server = data.dnsServer
    if ('expectedValue' in data) updateData.expected_value = data.expectedValue
    if ('dockerHost' in data) updateData.docker_host = data.dockerHost
    if ('containerName' in data) updateData.container_name = data.containerName

    const { data: service, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 })
      }
      console.error('[PATCH /api/services/[id]]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('[PATCH /api/services/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DELETE /api/services/[id]]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE /api/services/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
