import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { BADGES } from '@/lib/utils'

type Params = { params: { wallet: string } }

// ─── POST /api/user/[wallet] — register or fetch ─────────────────────────────
export async function POST(req: NextRequest, { params }: Params) {
  const { wallet } = params

  if (!wallet || wallet.length < 32) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
  }

  // Upsert user
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .upsert({ wallet }, { onConflict: 'wallet', ignoreDuplicates: false })
    .select()
    .single()

  if (error) {
    // If upsert fails because user exists, just fetch
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('wallet', wallet)
      .single()
    return NextResponse.json({ user: existing })
  }

  return NextResponse.json({ user })
}

// ─── GET /api/user/[wallet] — full profile ──────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  const { wallet } = params

  // Fetch user first so the rank query has the real total_points value.
  // (Putting it inside Promise.all alongside the rank query caused rank to
  // always compare against 0 because userRes was an unresolved promise.)
  const userRes = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('wallet', wallet)
    .maybeSingle()

  if (!userRes.data) {
    return NextResponse.json({ user: null, contributions: [], badges: [] })
  }

  const [contribRes, badgesRes, rankRes] = await Promise.all([
    supabaseAdmin
      .from('contributions')
      .select('*')
      .eq('wallet', wallet)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('user_badges')
      .select('*, badges(*)')
      .eq('wallet', wallet),
    supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gt('total_points', userRes.data.total_points || 0),
  ])

  const rank = (rankRes.count || 0) + 1

  return NextResponse.json({
    user: { ...userRes.data, rank },
    contributions: contribRes.data || [],
    badges: badgesRes.data || [],
  })
}

// ─── PATCH /api/user/[wallet] — update username ──────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const { wallet } = params
  const body = await req.json()
  const { username } = body

  if (!username || username.trim().length < 2) {
    return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 })
  }
  if (username.length > 24) {
    return NextResponse.json({ error: 'Username max 24 characters' }, { status: 400 })
  }

  // Check uniqueness
  const { data: conflict } = await supabaseAdmin
    .from('users')
    .select('wallet')
    .eq('username', username.trim())
    .neq('wallet', wallet)
    .maybeSingle()

  if (conflict) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ username: username.trim() })
    .eq('wallet', wallet)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
