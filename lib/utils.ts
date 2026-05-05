import type { Badge, ContributionType } from './types'

// ---- POINTS CONFIG ----
export const POINTS_MAP: Record<ContributionType, number> = {
  tweet:    10,
  thread:   25,
  referral: 40,
  feedback: 15,
}

// ---- BADGE DEFINITIONS ----
export const BADGES: Badge[] = [
  {
    id: 'genesis',
    slug: 'genesis',
    name: 'Genesis',
    description: 'First contribution ever submitted',
    icon: '🌱',
    color: 'green',
    tier: 'common',
    threshold: 1,
    type: 'contributions',
  },
  {
    id: 'signal-5',
    slug: 'signal-5',
    name: 'Signal Boost',
    description: '5 contributions submitted',
    icon: '📡',
    color: 'cyan',
    tier: 'common',
    threshold: 5,
    type: 'contributions',
  },
  {
    id: 'advocate-10',
    slug: 'advocate-10',
    name: 'Advocate',
    description: '10 contributions submitted',
    icon: '📢',
    color: 'cyan',
    tier: 'rare',
    threshold: 10,
    type: 'contributions',
  },
  {
    id: 'champion-25',
    slug: 'champion-25',
    name: 'Champion',
    description: '25 contributions submitted',
    icon: '🏆',
    color: 'gold',
    tier: 'epic',
    threshold: 25,
    type: 'contributions',
  },
  {
    id: 'legend-50',
    slug: 'legend-50',
    name: 'Legend',
    description: '50 contributions submitted',
    icon: '⚡',
    color: 'purple',
    tier: 'legendary',
    threshold: 50,
    type: 'contributions',
  },
  {
    id: 'streak-7',
    slug: 'streak-7',
    name: 'Consistent',
    description: '7-day contribution streak',
    icon: '🔥',
    color: 'pink',
    tier: 'rare',
    threshold: 7,
    type: 'streak',
  },
  {
    id: 'streak-30',
    slug: 'streak-30',
    name: 'Relentless',
    description: '30-day contribution streak',
    icon: '💎',
    color: 'purple',
    tier: 'legendary',
    threshold: 30,
    type: 'streak',
  },
  {
    id: 'points-100',
    slug: 'points-100',
    name: 'Centurion',
    description: '100 points earned',
    icon: '💯',
    color: 'gold',
    tier: 'common',
    threshold: 100,
    type: 'points',
  },
  {
    id: 'points-500',
    slug: 'points-500',
    name: 'Power Node',
    description: '500 points earned',
    icon: '⚙️',
    color: 'cyan',
    tier: 'epic',
    threshold: 500,
    type: 'points',
  },
  {
    id: 'points-1000',
    slug: 'points-1000',
    name: 'Genesis Core',
    description: '1,000 points earned — founding tier',
    icon: '🔮',
    color: 'purple',
    tier: 'legendary',
    threshold: 1000,
    type: 'points',
  },
]

// ---- BADGE TIER COLORS ----
export const TIER_CONFIG = {
  common:    { label: 'Common',    color: 'badge-green',  glow: 'rgba(74,222,128,0.3)' },
  rare:      { label: 'Rare',      color: 'badge-cyan',   glow: 'rgba(0,245,212,0.3)' },
  epic:      { label: 'Epic',      color: 'badge-purple', glow: 'rgba(168,85,247,0.3)' },
  legendary: { label: 'Legendary', color: 'badge-gold',   glow: 'rgba(251,191,36,0.3)' },
} as const

// ---- FORMAT UTILITIES ----
export function shortenWallet(wallet: string, chars = 4): string {
  return `${wallet.slice(0, chars)}...${wallet.slice(-chars)}`
}

export function formatPoints(points: number): string {
  if (points >= 1000) return `${(points / 1000).toFixed(1)}k`
  return points.toString()
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export function getDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return hostname.replace('www.', '')
  } catch {
    return 'link'
  }
}

export function getLevelFromPoints(points: number): { level: number; name: string; progress: number; nextLevelPoints: number } {
  const thresholds = [0, 50, 150, 350, 750, 1500, 3000, 6000, 12000, 25000]
  const names = ['Newcomer', 'Contributor', 'Advocate', 'Champion', 'Hero', 'Legend', 'Mythic', 'Apex', 'Genesis', 'Transcendent']
  
  let level = 0
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (points >= thresholds[i]) { level = i; break }
  }

  const current = thresholds[level]
  const next    = thresholds[level + 1] || thresholds[level] * 2
  const progress = level >= thresholds.length - 1 ? 100 : Math.round(((points - current) / (next - current)) * 100)

  return { level: level + 1, name: names[level], progress, nextLevelPoints: next }
}

export function getTypeConfig(type: string) {
  const configs = {
    tweet:    { label: 'Tweet',    class: 'type-tweet',    points: 10 },
    thread:   { label: 'Thread',   class: 'type-thread',   points: 25 },
    referral: { label: 'Referral', class: 'type-referral', points: 40 },
    feedback: { label: 'Feedback', class: 'type-feedback', points: 15 },
  }
  return configs[type as ContributionType] || configs.tweet
}

export function avatarInitials(wallet: string, username?: string | null): string {
  if (username) return username.slice(0, 2).toUpperCase()
  return wallet.slice(0, 2).toUpperCase()
}

export function avatarColor(wallet: string): string {
  const colors = [
    'linear-gradient(135deg, #00f5d4, #0ea5e9)',
    'linear-gradient(135deg, #a855f7, #ec4899)',
    'linear-gradient(135deg, #fbbf24, #f97316)',
    'linear-gradient(135deg, #4ade80, #22d3ee)',
    'linear-gradient(135deg, #ff2d78, #a855f7)',
    'linear-gradient(135deg, #38bdf8, #818cf8)',
  ]
  const idx = wallet.charCodeAt(0) % colors.length
  return colors[idx]
}
