import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const revalidate = 60 // Cache for 60 seconds

export async function GET() {
  const [usersRes, contribRes, pointsRes] = await Promise.all([
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('contributions').select('id', { count: 'exact', head: true }).neq('status', 'rejected'),
    supabaseAdmin.from('users').select('total_points'),
  ])

  const totalPoints = (pointsRes.data || []).reduce((sum, u) => sum + (u.total_points || 0), 0)

  return NextResponse.json({
    users:         usersRes.count || 0,
    contributions: contribRes.count || 0,
    points:        totalPoints,
  })
}
