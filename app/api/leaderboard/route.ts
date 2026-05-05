import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const season = searchParams.get('season') || 'all-time'
  const limit  = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  let query

  if (season === 'season') {
    // Season points from contributions in genesis season
    const { data: seasonData, error } = await supabaseAdmin
      .from('contributions')
      .select('wallet, points')
      .eq('season', 'genesis')
      .neq('status', 'rejected')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Aggregate by wallet
    const totals: Record<string, number> = {}
    for (const row of seasonData || []) {
      totals[row.wallet] = (totals[row.wallet] || 0) + row.points
    }

    const wallets = Object.keys(totals)
    if (wallets.length === 0) return NextResponse.json({ leaderboard: [] })

    const { data: users } = await supabaseAdmin
      .from('users')
      .select('wallet, username, total_points, streak_days')
      .in('wallet', wallets)

    const { data: badgeCounts } = await supabaseAdmin
      .from('user_badges')
      .select('wallet')
      .in('wallet', wallets)

    const badgeMap: Record<string, number> = {}
    for (const b of badgeCounts || []) {
      badgeMap[b.wallet] = (badgeMap[b.wallet] || 0) + 1
    }

    const { data: contribCounts } = await supabaseAdmin
      .from('contributions')
      .select('wallet')
      .in('wallet', wallets)
      .neq('status', 'rejected')

    const contribMap: Record<string, number> = {}
    for (const c of contribCounts || []) {
      contribMap[c.wallet] = (contribMap[c.wallet] || 0) + 1
    }

    const leaderboard = (users || [])
      .map(u => ({
        wallet:              u.wallet,
        username:            u.username,
        total_points:        u.total_points,
        season_points:       totals[u.wallet] || 0,
        streak_days:         u.streak_days || 0,
        badges_count:        badgeMap[u.wallet] || 0,
        contributions_count: contribMap[u.wallet] || 0,
        rank:                0,
      }))
      .sort((a, b) => b.season_points - a.season_points)
      .slice(0, limit)
      .map((entry, i) => ({ ...entry, rank: i + 1 }))

    return NextResponse.json({ leaderboard })
  }

  // All-time leaderboard
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('wallet, username, total_points, streak_days, contributions_count')
    .order('total_points', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch badge counts
  const wallets = (users || []).map(u => u.wallet)
  const { data: badges } = await supabaseAdmin
    .from('user_badges')
    .select('wallet')
    .in('wallet', wallets)

  const badgeMap: Record<string, number> = {}
  for (const b of badges || []) {
    badgeMap[b.wallet] = (badgeMap[b.wallet] || 0) + 1
  }

  // Fetch contribution counts
  const { data: contribs } = await supabaseAdmin
    .from('contributions')
    .select('wallet')
    .in('wallet', wallets)
    .neq('status', 'rejected')

  const contribMap: Record<string, number> = {}
  for (const c of contribs || []) {
    contribMap[c.wallet] = (contribMap[c.wallet] || 0) + 1
  }

  const leaderboard = (users || []).map((u, i) => ({
    wallet:              u.wallet,
    username:            u.username,
    total_points:        u.total_points,
    season_points:       u.total_points,
    streak_days:         u.streak_days || 0,
    badges_count:        badgeMap[u.wallet] || 0,
    contributions_count: contribMap[u.wallet] || 0,
    rank:                i + 1,
  }))

  return NextResponse.json({ leaderboard })
}
