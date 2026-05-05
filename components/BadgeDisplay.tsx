'use client'

import type { Badge, UserBadge } from '@/lib/types'
import { TIER_CONFIG } from '@/lib/utils'
import { useState } from 'react'

interface BadgeCardProps {
  badge: Badge
  earned?: boolean
  earnedAt?: string
  size?: 'sm' | 'md' | 'lg'
}

export function BadgeCard({ badge, earned = true, earnedAt, size = 'md' }: BadgeCardProps) {
  const [hovered, setHovered] = useState(false)
  const tier = TIER_CONFIG[badge.tier]

  const sizes = {
    sm: { outer: 52, icon: 20, nameSize: 10, descSize: 9 },
    md: { outer: 72, icon: 28, nameSize: 11, descSize: 10 },
    lg: { outer: 88, icon: 36, nameSize: 13, descSize: 11 },
  }
  const s = sizes[size]

  const glowColors = {
    cyan:   'rgba(0,245,212,0.4)',
    purple: 'rgba(168,85,247,0.4)',
    gold:   'rgba(251,191,36,0.4)',
    pink:   'rgba(255,45,120,0.4)',
    green:  'rgba(74,222,128,0.4)',
  }

  const fillColors = {
    cyan:   { bg: 'rgba(0,245,212,0.1)',   border: 'rgba(0,245,212,0.3)',   text: 'var(--neon-cyan)' },
    purple: { bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.3)',  text: 'var(--neon-purple)' },
    gold:   { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)',  text: 'var(--neon-gold)' },
    pink:   { bg: 'rgba(255,45,120,0.1)',  border: 'rgba(255,45,120,0.3)',  text: 'var(--neon-pink)' },
    green:  { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)',  text: 'var(--neon-green)' },
  }

  const colors = fillColors[badge.color]
  const glow   = glowColors[badge.color]

  return (
    <div
      className="tooltip"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        opacity: earned ? 1 : 0.3,
        filter: earned ? 'none' : 'grayscale(100%)',
        cursor: 'default',
        transition: 'transform 0.2s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
      }}
    >
      {/* Hexagon Badge */}
      <div style={{
        position: 'relative',
        width: s.outer,
        height: s.outer,
      }}>
        {/* Outer glow ring */}
        {earned && hovered && (
          <div style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: `1px solid ${colors.border}`,
            boxShadow: `0 0 15px ${glow}`,
            animation: 'neonPulse 2s infinite',
            zIndex: 0,
          }} />
        )}

        {/* Hexagon shape using CSS */}
        <div
          style={{
            width: s.outer,
            height: s.outer,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            background: colors.bg,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: s.icon,
            position: 'relative',
            zIndex: 1,
            transition: 'all 0.3s ease',
            boxShadow: earned && hovered ? `0 0 20px ${glow}` : 'none',
          }}
        >
          {badge.icon}
        </div>

        {/* Tier indicator dot */}
        {earned && (
          <div style={{
            position: 'absolute',
            bottom: 2, right: 8,
            width: 8, height: 8,
            borderRadius: '50%',
            background: colors.text,
            border: '1px solid var(--void)',
            boxShadow: `0 0 4px ${glow}`,
            zIndex: 2,
          }} />
        )}
      </div>

      {/* Badge Info */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: s.nameSize,
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: earned ? colors.text : 'var(--text-dim)',
          lineHeight: 1.2,
        }}>
          {badge.name}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: s.descSize - 1,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginTop: 2,
        }}>
          {tier.label}
        </div>
      </div>

      {/* Tooltip */}
      <div className="tooltip-text">
        {badge.description}
        {earnedAt && <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
          Earned {new Date(earnedAt).toLocaleDateString()}
        </div>}
      </div>
    </div>
  )
}

interface BadgeGridProps {
  earnedBadges: UserBadge[]
  allBadges: Badge[]
  showLocked?: boolean
}

export function BadgeGrid({ earnedBadges, allBadges, showLocked = true }: BadgeGridProps) {
  const earnedIds = new Set(earnedBadges.map(ub => ub.badge_id))

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
      gap: '20px 16px',
    }}>
      {allBadges.map(badge => {
        const userBadge = earnedBadges.find(ub => ub.badge_id === badge.id)
        const earned    = earnedIds.has(badge.id)

        if (!earned && !showLocked) return null

        return (
          <BadgeCard
            key={badge.id}
            badge={badge}
            earned={earned}
            earnedAt={userBadge?.earned_at}
            size="md"
          />
        )
      })}
    </div>
  )
}
