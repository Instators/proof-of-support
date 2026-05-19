import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { POINTS_MAP } from '@/lib/utils'

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

  // Duplicate link check (same wallet). maybeSingle returns null when no row matches
  // (single() raises an error for 0 rows, which then has to be ignored — noisier).
  const { data: existing } = await supabaseAdmin
    .from('contributions')
    .select('id')
    .eq('wallet', wallet)
    .eq('link', link)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'You have already submitted this link' }, { status: 409 })
  }

  const points = POINTS_MAP[type as keyof typeof POINTS_MAP] || 10

  // Insert contribution as pending. Points and badges are NOT awarded here —
  // they are awarded by the admin PATCH route when the contribution is approved.
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

  return NextResponse.json({ data: contribution }, { status: 201 })
}
