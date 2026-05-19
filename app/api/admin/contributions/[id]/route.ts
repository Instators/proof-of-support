import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyAdminRequest } from '@/lib/admin-auth'
import { incrementUserPoints, updateStreak, checkAndAwardBadges } from '@/lib/rewards'

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = verifyAdminRequest(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = params
  const body   = await req.json()
  const { status } = body

  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Status must be approved or rejected' }, { status: 400 })
  }

  const { data: contribution, error: fetchErr } = await supabaseAdmin
    .from('contributions')
    .select('wallet, points, status')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr || !contribution) {
    return NextResponse.json({ error: 'Contribution not found' }, { status: 404 })
  }

  const wasApproved = contribution.status === 'approved'
  const isApproving = status === 'approved' && !wasApproved
  const isRevoking  = status === 'rejected' && wasApproved

  // Update status first
  const { data, error } = await supabaseAdmin
    .from('contributions')
    .update({ status, verified: status === 'approved' })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Award or revoke points + streak + badges
  let newBadges: string[] = []
  if (isApproving) {
    await incrementUserPoints(contribution.wallet, contribution.points)
    await updateStreak(contribution.wallet)
    newBadges = await checkAndAwardBadges(contribution.wallet)
  } else if (isRevoking) {
    await incrementUserPoints(contribution.wallet, -contribution.points)
  }

  return NextResponse.json({ data, newBadges })
}
