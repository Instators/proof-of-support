import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type Params = { params: { id: string } }

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = params
  if (!id) return NextResponse.json({ error: 'Missing contribution id' }, { status: 400 })

  const { data, error } = await supabaseAdmin.rpc('increment_contribution_upvotes', { p_id: id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ upvotes: data })
}
