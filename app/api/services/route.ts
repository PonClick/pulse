import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServiceSchema } from '@/lib/validations/service'
import type { Tables, TablesInsert } from '@/lib/supabase/database.types'

type Service = Tables<'services'>
type ServiceInsert = TablesInsert<'services'>

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createAdminClient()

    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/services]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(services)
  } catch (error) {
    console.error('[GET /api/services]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = createServiceSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const supabase = createAdminClient()

    // Build the insert object based on service type
    const serviceData: ServiceInsert = {
      name: data.name,
      description: data.description,
      type: data.type,
      group_id: data.groupId || null,
      interval_seconds: data.intervalSeconds,
      timeout_seconds: data.timeoutSeconds,
      retries: data.retries,
      next_check: new Date().toISOString(),
    }

    // Add type-specific fields
    switch (data.type) {
      case 'http':
        serviceData.url = data.url
        serviceData.method = data.method
        serviceData.expected_status = data.expectedStatus
        serviceData.keyword = data.keyword
        serviceData.verify_ssl = data.verifySsl
        serviceData.headers = data.headers
        serviceData.body = data.body
        break
      case 'tcp':
        serviceData.hostname = data.hostname
        serviceData.port = data.port
        break
      case 'ping':
        serviceData.hostname = data.hostname
        break
      case 'dns':
        serviceData.hostname = data.hostname
        serviceData.dns_record_type = data.dnsRecordType
        serviceData.dns_server = data.dnsServer
        serviceData.expected_value = data.expectedValue
        break
      case 'docker':
        serviceData.docker_host = data.dockerHost
        serviceData.container_name = data.containerName
        break
      case 'heartbeat':
        // Heartbeat services have minimal config
        break
      case 'ssl':
        serviceData.hostname = data.hostname
        serviceData.port = data.port
        serviceData.ssl_expiry_warning_days = data.sslExpiryWarningDays
        break
    }

    const { data: service, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single()

    if (error) {
      console.error('[POST /api/services]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('[POST /api/services]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
