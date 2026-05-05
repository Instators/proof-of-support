import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { POINTS_MAP, BADGES } from '@/lib/utils'

// ─── GET /api/contributions ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type   = searchParams.get('type')
  const sort   = searchParams.get('sort') || 'latest'
  const limit  = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')
  const wallet = searchParams.get('wallet')

  let query = supabaseAdmin
    .from('contributions')
    .select('*, users(wallet, username, total_points, streak_days)', { count: 'exact' })

  if (wallet) query = query.eq('wallet', wallet)
  if (type && type !== 'all') query = query.eq('type', type)

  // Public feed only shows approved + pending
  if (!wallet) query = query.neq('status', 'rejected')

  switch (sort) {
    case 'points':  query = query.order('points', { ascending: false }); break
    case 'upvotes': query = query.order('upvotes', { ascending: false }); break
    default:        query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count })
}

// ─── POST /api/contributions ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { wallet, link, description, type = 'tweet', signature } = body

  // Validation
  if (!wallet || !link || !description) {
    return NextResponse.json({ error: 'Missing required fields: wallet, link, description' }, { status: 400 })
  }
  if (description.length < 10) {
    return NextResponse.json({ error: 'Description must be at least 10 characters' }, { status: 400 })
  }
  try { new URL(link) } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
  }
  if (!['tweet', 'thread', 'referral', 'feedback'].includes(type)) {
    return NextResponse.json({ error: 'Invalid contribution type' }, { status: 400 })
  }

  // Ensure user exists
  const { error: upsertErr } = await supabaseAdmin
    .from('users')
    .upsert({ wallet }, { onConflict: 'wallet', ignoreDuplicates: true })
  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

  // Duplicate link check (same wallet)
  const { data: existing } = await supabaseAdmin
    .from('contributions')
    .select('id')
    .eq('wallet', wallet)
    .eq('link', link)
    .single()
  if (existing) {
    return NextResponse.json({ error: 'You have already submitted this link' }, { status: 409 })
  }

  const points = POINTS_MAP[type as keyof typeof POINTS_MAP] || 10

  // Insert contribution
  const { data: contribution, error: insertErr } = await supabaseAdmin
    .from('contributions')
    .insert({
      wallet,
      link:        link.trim(),
      description: description.trim(),
      type,
      points,
      status:     'pending',
      season:     'genesis',
      signature:  signature || null,
    })
    .select()
    .single()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  // Update points + streak atomically
  await updateUserPoints(wallet, points)
  await updateStreak(wallet)

  // Award badges
  const newBadges = await checkAndAwardBadges(wallet)

  return NextResponse.json({ data: contribution, newBadges }, { status: 201 })
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

async function updateUserPoints(wallet: string, points: number) {
  await supabaseAdmin.rpc('increment_user_points', {
    p_wallet: wallet,
    p_points: points,
  })
}

async function updateStreak(wallet: string) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('streak_days, streak_last_date')
    .eq('wallet', wallet)
    .single()

  if (!user) return

  const today     = new Date().toISOString().split('T')[0]
  const lastDate  = user.streak_last_date
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let newStreak = user.streak_days || 0

  if (lastDate === today) return // Already counted today
  if (lastDate === yesterday) newStreak += 1  // Continuing streak
  else newStreak = 1 // Streak broken, restart

  await supabaseAdmin
    .from('users')
    .update({
      streak_days:     newStreak,
      streak_last_date: today,
    })
    .eq('wallet', wallet)
}

async function checkAndAwardBadges(wallet: string): Promise<string[]> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('total_points, streak_days')
    .eq('wallet', wallet)
    .single()

  if (!user) return []

  const { count: contribCount } = await supabaseAdmin
    .from('contributions')
    .select('id', { count: 'exact', head: true })
    .eq('wallet', wallet)

  const { data: existingBadges } = await supabaseAdmin
    .from('user_badges')
    .select('badge_id')
    .eq('wallet', wallet)

  const alreadyEarned = new Set((existingBadges || []).map(b => b.badge_id))
  const newBadgeNames: string[] = []

  for (const badge of BADGES) {
    if (alreadyEarned.has(badge.id)) continue

    let earned = false
    if (badge.type === 'contributions' && (contribCount || 0) >= badge.threshold) earned = true
    if (badge.type === 'points'        && user.total_points >= badge.threshold)    earned = true
    if (badge.type === 'streak'        && user.streak_days >= badge.threshold)     earned = true

    if (earned) {
      await supabaseAdmin
        .from('user_badges')
        .upsert({ wallet, badge_id: badge.id }, { onConflict: 'wallet,badge_id' })
      newBadgeNames.push(badge.name)
    }
  }

  return newBadgeNames
}
