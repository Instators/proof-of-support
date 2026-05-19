import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { BADGES } from '@/lib/utils'

/**
 * Server-side helpers shared by API routes that need to mutate user state
 * when a contribution is approved (or de-approved).
 */

export async function incrementUserPoints(wallet: string, points: number) {
  const { error } = await supabaseAdmin.rpc('increment_user_points', {
    p_wallet: wallet,
    p_points: points,
  })
  if (error) console.error('increment_user_points failed:', error)
}

export async function updateStreak(wallet: string) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('streak_days, streak_last_date')
    .eq('wallet', wallet)
    .maybeSingle()

  if (!user) return

  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const lastDate  = user.streak_last_date

  if (lastDate === today) return // Already counted today

  let newStreak = user.streak_days || 0
  if (lastDate === yesterday) newStreak += 1
  else newStreak = 1

  await supabaseAdmin
    .from('users')
    .update({ streak_days: newStreak, streak_last_date: today })
    .eq('wallet', wallet)
}

export async function checkAndAwardBadges(wallet: string): Promise<string[]> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('total_points, streak_days')
    .eq('wallet', wallet)
    .maybeSingle()

  if (!user) return []

  // Count only APPROVED contributions toward the contributions badge.
  const { count: contribCount } = await supabaseAdmin
    .from('contributions')
    .select('id', { count: 'exact', head: true })
    .eq('wallet', wallet)
    .eq('status', 'approved')

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
      const { error } = await supabaseAdmin
        .from('user_badges')
        .upsert({ wallet, badge_id: badge.id }, { onConflict: 'wallet,badge_id' })
      if (!error) newBadgeNames.push(badge.name)
    }
  }

  return newBadgeNames
}
