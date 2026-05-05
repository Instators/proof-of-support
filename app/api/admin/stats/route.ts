import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]

  const [
    usersRes,
    contribRes,
    pendingRes,
    pointsRes,
    newUsersRes,
    todayContribRes,
  ] = await Promise.all([
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('contributions').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('contributions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('users').select('total_points'),
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).gte('created_at', today),
    supabaseAdmin.from('contributions').select('id', { count: 'exact', head: true }).gte('created_at', today),
  ])

  const totalPoints = (pointsRes.data || []).reduce((sum, u) => sum + (u.total_points || 0), 0)

  return NextResponse.json({
    total_users:              usersRes.count || 0,
    total_contributions:      contribRes.count || 0,
    pending_contributions:    pendingRes.count || 0,
    total_points_distributed: totalPoints,
    new_users_today:          newUsersRes.count || 0,
    contributions_today:      todayContribRes.count || 0,
  })
}
