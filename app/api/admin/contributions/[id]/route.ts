import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id }   = params
  const body     = await req.json()
  const { status } = body

  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Status must be approved or rejected' }, { status: 400 })
  }

  const { data: contribution, error: fetchErr } = await supabaseAdmin
    .from('contributions')
    .select('wallet, points, status')
    .eq('id', id)
    .single()

  if (fetchErr || !contribution) {
    return NextResponse.json({ error: 'Contribution not found' }, { status: 404 })
  }

  // If rejecting an already-approved contribution, deduct points
  if (status === 'rejected' && contribution.status === 'approved') {
    await supabaseAdmin.rpc('increment_user_points', {
      p_wallet: contribution.wallet,
      p_points: -contribution.points,
    })
  }

  const { data, error } = await supabaseAdmin
    .from('contributions')
    .update({ status, verified: status === 'approved' })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
