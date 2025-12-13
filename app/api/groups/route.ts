import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const createGroupSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('[GET /api/groups]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/groups]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const validation = createGroupSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description, color, sortOrder } = validation.data
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('groups')
      .insert({
        name,
        description: description || null,
        color: color || '#3b82f6',
        sort_order: sortOrder ?? 0,
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/groups]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[POST /api/groups]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
