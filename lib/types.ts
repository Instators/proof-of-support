export type ContributionType = 'tweet' | 'thread' | 'referral' | 'feedback'
export type ContributionStatus = 'pending' | 'approved' | 'rejected'
export type Season = 'genesis' | 'season-1' | 'season-2'

export interface User {
  id: string
  wallet: string
  username: string | null
  avatar_url: string | null
  total_points: number
  current_season_points: number
  streak_days: number
  streak_last_date: string | null
  contributions_count: number
  rank: number | null
  created_at: string
}

export interface Contribution {
  id: string
  wallet: string
  link: string
  description: string
  type: ContributionType
  points: number
  status: ContributionStatus
  verified: boolean
  upvotes: number
  season: Season
  created_at: string
  users?: Pick<User, 'wallet' | 'username' | 'total_points' | 'streak_days'>
}

export interface Badge {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  color: 'cyan' | 'purple' | 'gold' | 'pink' | 'green'
  tier: 'common' | 'rare' | 'epic' | 'legendary'
  threshold: number
  type: 'contributions' | 'points' | 'streak' | 'special'
}

export interface UserBadge {
  id: string
  wallet: string
  badge_id: string
  earned_at: string
  badges?: Badge
}

export interface LeaderboardEntry {
  wallet: string
  username: string | null
  total_points: number
  contributions_count: number
  streak_days: number
  rank: number
  badges_count: number
  season_points: number
}

export interface AdminStats {
  total_users: number
  total_contributions: number
  pending_contributions: number
  total_points_distributed: number
  new_users_today: number
  contributions_today: number
}

export interface Season {
  id: string
  slug: string
  name: string
  starts_at: string
  ends_at: string
  is_active: boolean
}
