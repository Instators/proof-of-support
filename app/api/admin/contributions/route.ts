import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyAdminRequest } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const auth = verifyAdminRequest(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending'
  const limit  = parseInt(searchParams.get('limit') || '50')

  const { data, error } = await supabaseAdmin
    .from('contributions')
    .select('*, users(wallet, username)')
    .eq('status', status)
    .order('created_at', { ascending: status === 'pending' })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
