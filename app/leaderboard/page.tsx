'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { formatPoints, shortenWallet, avatarColor, avatarInitials, BADGES, TIER_CONFIG } from '@/lib/utils'
import type { LeaderboardEntry } from '@/lib/types'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'

type SeasonFilter = 'all-time' | 'season'

function RankBadge({ rank }: { rank: number }) {
  const configs: Record<number, { bg: string; color: string; icon: string; glow: string }> = {
    1: { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24', icon: '👑', glow: '0 0 20px rgba(251,191,36,0.4)' },
    2: { bg: 'rgba(203,213,225,0.12)', color: '#cbd5e1', icon: '⚔', glow: '0 0 15px rgba(203,213,225,0.3)' },
    3: { bg: 'rgba(180,83,9,0.15)',    color: '#b45309', icon: '🛡', glow: '0 0 15px rgba(180,83,9,0.3)'   },
  }
  const c = configs[rank]

  if (c) {
    return (
      <div style={{
        width: 36, height: 36,
        borderRadius: 8,
        background: c.bg,
        border: `1px solid ${c.color}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        boxShadow: c.glow,
        flexShrink: 0,
      }}>
        {c.icon}
      </div>
    )
  }

  return (
    <div style={{
      width: 36, height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--text-muted)',
      letterSpacing: '0.05em',
      flexShrink: 0,
    }}>
      #{rank}
    </div>
  )
}

function LeaderboardRow({
  entry, index, isCurrentUser,
}: {
  entry: LeaderboardEntry
  index: number
  isCurrentUser: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const gradient = avatarColor(entry.wallet)
  const initials = avatarInitials(entry.wallet, entry.username)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="animate-fade-in-up opacity-0-init"
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: 'forwards',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 20px',
        background: isCurrentUser
          ? 'rgba(0,245,212,0.06)'
          : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        border: '1px solid',
        borderColor: isCurrentUser
          ? 'rgba(0,245,212,0.25)'
          : hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
        borderRadius: 10,
        transition: 'all 0.2s ease',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Rank glow for top 3 */}
      {entry.rank <= 3 && (
        <div style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 3,
          background: entry.rank === 1 ? '#fbbf24' : entry.rank === 2 ? '#cbd5e1' : '#b45309',
          boxShadow: entry.rank === 1 ? '0 0 8px #fbbf24' : 'none',
          borderRadius: '10px 0 0 10px',
        }} />
      )}

      {/* Current user indicator */}
      {isCurrentUser && (
        <div style={{
          position: 'absolute',
          right: 12, top: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--neon-cyan)',
          background: 'rgba(0,245,212,0.1)',
          padding: '2px 6px',
          borderRadius: 3,
        }}>
          You
        </div>
      )}

      {/* Rank */}
      <RankBadge rank={entry.rank} />

      {/* Avatar */}
      <div style={{
        width: 40, height: 40,
        borderRadius: '50%',
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 13,
        fontWeight: 800,
        color: '#000',
        flexShrink: 0,
        border: isCurrentUser ? '2px solid rgba(0,245,212,0.5)' : '1px solid rgba(255,255,255,0.1)',
      }}>
        {initials}
      </div>

      {/* Name & wallet */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--text-primary)',
          fontWeight: 500,
          letterSpacing: '0.03em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {entry.username || shortenWallet(entry.wallet)}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
          marginTop: 2,
          letterSpacing: '0.06em',
        }}>
          {entry.contributions_count} contributions
        </div>
      </div>

      {/* Streak */}
      {entry.streak_days > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          background: 'rgba(255,45,120,0.08)',
          border: '1px solid rgba(255,45,120,0.2)',
          borderRadius: 5,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11 }}>🔥</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--neon-pink)' }}>
            {entry.streak_days}d
          </span>
        </div>
      )}

      {/* Badges count */}
      {entry.badges_count > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          background: 'rgba(168,85,247,0.08)',
          border: '1px solid rgba(168,85,247,0.2)',
          borderRadius: 5,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11 }}>🏆</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--neon-purple)' }}>
            {entry.badges_count}
          </span>
        </div>
      )}

      {/* Points */}
      <div style={{
        textAlign: 'right',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 800,
          color: entry.rank <= 3 ? (entry.rank === 1 ? '#fbbf24' : entry.rank === 2 ? '#cbd5e1' : '#b45309') : 'var(--neon-cyan)',
          letterSpacing: '-0.01em',
          lineHeight: 1,
          textShadow: entry.rank === 1 ? '0 0 15px rgba(251,191,36,0.5)' : 'none',
        }}>
          {formatPoints(entry.total_points)}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginTop: 2,
        }}>
          pts
        </div>
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 20px',
      border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: 10,
    }}>
      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: 12, width: '35%', marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 10, width: '20%' }} />
      </div>
      <div className="skeleton" style={{ width: 50, height: 24 }} />
    </div>
  )
}

export default function LeaderboardPage() {
  const { publicKey } = useWallet()
  const [entries, setEntries]   = useState<LeaderboardEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [season, setSeason]     = useState<SeasonFilter>('all-time')
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leaderboard?season=${season}&limit=50`)
      .then(r => r.json())
      .then(data => {
        setEntries(data.leaderboard || [])
        if (publicKey) {
          const found = (data.leaderboard || []).find(
            (e: LeaderboardEntry) => e.wallet === publicKey.toString()
          )
          setUserRank(found || null)
        }
      })
      .finally(() => setLoading(false))
  }, [season, publicKey])

  const top3 = entries.slice(0, 3)
  const rest  = entries.slice(3)

  return (
    <main style={{ minHeight: '100vh', background: 'var(--void)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="section-tag" style={{ justifyContent: 'center' }}>Rankings</div>
          <h1 className="section-title" style={{ fontSize: 'clamp(28px, 5vw, 52px)' }}>
            Community{' '}
            <span style={{ color: 'var(--neon-gold)' }}>Leaderboard</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 10 }}>
            Top contributors. Ranked by proof of work.
          </p>
        </div>

        {/* Season toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
          {[
            { value: 'all-time', label: '◈ All Time' },
            { value: 'season', label: '◉ Season Genesis' },
          ].map(s => (
            <button
              key={s.value}
              onClick={() => setSeason(s.value as SeasonFilter)}
              style={{
                padding: '8px 20px',
                borderRadius: 6,
                border: '1px solid',
                borderColor: season === s.value ? 'var(--neon-gold)' : 'rgba(255,255,255,0.08)',
                background: season === s.value ? 'rgba(251,191,36,0.08)' : 'transparent',
                color: season === s.value ? 'var(--neon-gold)' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* TOP 3 PODIUM */}
        {!loading && top3.length >= 3 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
            marginBottom: 32,
            maxWidth: 700,
            margin: '0 auto 40px',
          }}>
            {/* 2nd place */}
            <div style={{ alignSelf: 'flex-end' }}>
              <PodiumCard entry={top3[1]} height={120} />
            </div>
            {/* 1st place */}
            <div>
              <PodiumCard entry={top3[0]} height={160} highlight />
            </div>
            {/* 3rd place */}
            <div style={{ alignSelf: 'flex-end' }}>
              <PodiumCard entry={top3[2]} height={90} />
            </div>
          </div>
        )}

        {/* Current user rank (if not in top 50) */}
        {publicKey && userRank && userRank.rank > 50 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}>
              // Your rank
            </div>
            <LeaderboardRow entry={userRank} index={0} isCurrentUser />
          </div>
        )}

        {/* Full list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            [...Array(10)].map((_, i) => <SkeletonRow key={i} />)
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>🏁</div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.08em' }}>
                No contributors yet. Be the first!
              </p>
              <Link href="/submit" style={{ textDecoration: 'none' }}>
                <button className="btn-neon-solid" style={{ padding: '10px 24px', marginTop: 16 }}>
                  Submit Now
                </button>
              </Link>
            </div>
          ) : (
            entries.map((e, i) => (
              <LeaderboardRow
                key={e.wallet}
                entry={e}
                index={i}
                isCurrentUser={publicKey?.toString() === e.wallet}
              />
            ))
          )}
        </div>
      </div>
    </main>
  )
}

function PodiumCard({ entry, height, highlight }: {
  entry: LeaderboardEntry
  height: number
  highlight?: boolean
}) {
  const gradient = avatarColor(entry.wallet)
  const initials = avatarInitials(entry.wallet, entry.username)
  const rankColors = { 1: '#fbbf24', 2: '#cbd5e1', 3: '#b45309' }
  const color = rankColors[entry.rank as 1 | 2 | 3] || 'var(--neon-cyan)'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
    }}>
      {/* Avatar */}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: highlight ? 60 : 48,
          height: highlight ? 60 : 48,
          borderRadius: '50%',
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: highlight ? 18 : 14,
          fontWeight: 800,
          color: '#000',
          border: `2px solid ${color}`,
          boxShadow: `0 0 20px ${color}50`,
        }}>
          {initials}
        </div>
        {highlight && (
          <div style={{
            position: 'absolute',
            top: -12, left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 20,
          }}>
            👑
          </div>
        )}
      </div>

      {/* Name */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-primary)',
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
      }}>
        {entry.username || shortenWallet(entry.wallet, 3)}
      </div>

      {/* Points */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: highlight ? 20 : 15,
        fontWeight: 800,
        color,
        textShadow: `0 0 15px ${color}60`,
        letterSpacing: '-0.01em',
      }}>
        {formatPoints(entry.total_points)}
      </div>

      {/* Podium bar */}
      <div style={{
        width: '100%',
        height,
        background: `linear-gradient(to top, ${color}30, ${color}08)`,
        border: `1px solid ${color}30`,
        borderBottom: 'none',
        borderRadius: '6px 6px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 900,
          color: `${color}40`,
          letterSpacing: '-0.02em',
        }}>
          {entry.rank}
        </span>
      </div>
    </div>
  )
}
