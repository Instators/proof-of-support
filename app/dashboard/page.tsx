'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Navbar } from '@/components/Navbar'
import { ContributionCard } from '@/components/ContributionCard'
import { BadgeGrid } from '@/components/BadgeDisplay'
import {
  getLevelFromPoints, formatPoints, shortenWallet,
  timeAgo, BADGES, avatarColor, avatarInitials
} from '@/lib/utils'
import type { Contribution, UserBadge } from '@/lib/types'
import Link from 'next/link'

type Tab = 'contributions' | 'badges' | 'stats'

function StreakCalendar({ days }: { days: number }) {
  const cells = Array.from({ length: 30 }, (_, i) => i < days)
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {cells.map((active, i) => (
        <div
          key={i}
          style={{
            width: 10, height: 10,
            borderRadius: 2,
            background: active ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.05)',
            boxShadow: active ? '0 0 4px rgba(0,245,212,0.4)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { publicKey, connected } = useWallet()
  const [data, setData] = useState<{
    user: any
    contributions: Contribution[]
    badges: UserBadge[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab]         = useState<Tab>('contributions')
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [savingUsername, setSavingUsername] = useState(false)

  useEffect(() => {
    if (!publicKey) return
    setLoading(true)
    fetch(`/api/user/${publicKey.toString()}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setUsername(d.user?.username || '')
      })
      .finally(() => setLoading(false))
  }, [publicKey])

  async function saveUsername() {
    if (!publicKey || !username.trim()) return
    setSavingUsername(true)
    const res = await fetch(`/api/user/${publicKey.toString()}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim() }),
    })
    if (res.ok) {
      const d = await res.json()
      setData(prev => prev ? { ...prev, user: d.data } : prev)
      setEditing(false)
    }
    setSavingUsername(false)
  }

  if (!connected) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--void)' }}>
        <Navbar />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)', padding: 24, textAlign: 'center',
        }}>
          <div style={{ maxWidth: 380 }}>
            <div style={{ fontSize: 48, marginBottom: 20, animation: 'float 4s ease-in-out infinite' }}>🛸</div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
              letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 10,
            }}>
              Connect to access dashboard
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24, lineHeight: 1.65 }}>
              Your wallet is your identity. Connect to see your contributions, points, and badges.
            </p>
            <WalletMultiButton style={{ height: 46, fontSize: 11 }} />
          </div>
        </div>
      </main>
    )
  }

  const wallet  = publicKey!.toString()
  const user    = data?.user
  const contribs = data?.contributions || []
  const userBadges = data?.badges || []
  const level   = getLevelFromPoints(user?.total_points || 0)
  const gradient = avatarColor(wallet)
  const initials = avatarInitials(wallet, user?.username)

  return (
    <main style={{ minHeight: '100vh', background: 'var(--void)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 80 }}>

        {loading && !data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 10 }} />)}
            </div>
          </div>
        ) : (
          <>
            {/* Profile Banner */}
            <div className="cyber-card" style={{
              padding: '32px',
              marginBottom: 24,
              background: `linear-gradient(135deg, rgba(0,245,212,0.05) 0%, rgba(168,85,247,0.03) 100%)`,
            }}>
              <div className="cyber-card-corner-br" />
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 20,
                flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Avatar */}
                  <div style={{
                    position: 'relative',
                    flexShrink: 0,
                  }}>
                    <div style={{
                      width: 72, height: 72,
                      borderRadius: '50%',
                      background: gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      fontWeight: 800,
                      color: '#000',
                      border: '2px solid rgba(0,245,212,0.3)',
                      boxShadow: '0 0 20px rgba(0,245,212,0.15)',
                    }}>
                      {initials}
                    </div>
                    {/* Level badge */}
                    <div style={{
                      position: 'absolute',
                      bottom: -4, right: -4,
                      width: 24, height: 24,
                      borderRadius: '50%',
                      background: 'var(--neon-cyan)',
                      border: '2px solid var(--void)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#000',
                    }}>
                      {level.level}
                    </div>
                  </div>

                  <div>
                    {/* Username */}
                    {editing ? (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <input
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          maxLength={24}
                          className="cyber-input"
                          style={{ padding: '6px 12px', fontSize: 14, width: 180 }}
                          placeholder="Enter username"
                          autoFocus
                        />
                        <button
                          onClick={saveUsername}
                          disabled={savingUsername}
                          className="btn-neon-solid"
                          style={{ padding: '6px 14px', fontSize: 10 }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditing(false)}
                          className="btn-neon"
                          style={{ padding: '6px 12px', fontSize: 10 }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h1 style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 22,
                          fontWeight: 700,
                          letterSpacing: '0.03em',
                          color: 'var(--text-primary)',
                          lineHeight: 1,
                        }}>
                          {user?.username || shortenWallet(wallet)}
                        </h1>
                        <button
                          onClick={() => setEditing(true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            fontSize: 12,
                            transition: 'color 0.2s',
                            padding: '2px',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--neon-cyan)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                          title="Edit username"
                        >
                          ✏
                        </button>
                      </div>
                    )}

                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.1em',
                      marginBottom: 8,
                    }}>
                      {shortenWallet(wallet, 6)}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        padding: '3px 10px',
                        borderRadius: 4,
                        background: 'rgba(0,245,212,0.1)',
                        border: '1px solid rgba(0,245,212,0.25)',
                        color: 'var(--neon-cyan)',
                      }}>
                        LVL {level.level} · {level.name}
                      </span>
                      {user?.streak_days > 0 && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          padding: '3px 10px',
                          borderRadius: 4,
                          background: 'rgba(255,45,120,0.1)',
                          border: '1px solid rgba(255,45,120,0.25)',
                          color: 'var(--neon-pink)',
                        }}>
                          🔥 {user.streak_days}-day streak
                        </span>
                      )}
                      {userBadges.length > 0 && (
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          padding: '3px 10px',
                          borderRadius: 4,
                          background: 'rgba(168,85,247,0.1)',
                          border: '1px solid rgba(168,85,247,0.25)',
                          color: 'var(--neon-purple)',
                        }}>
                          {userBadges.length} badges
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Points display */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 48,
                    fontWeight: 900,
                    lineHeight: 1,
                    color: 'var(--neon-cyan)',
                    textShadow: '0 0 30px rgba(0,245,212,0.4)',
                    letterSpacing: '-0.02em',
                  }}>
                    {formatPoints(user?.total_points || 0)}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginTop: 4,
                  }}>
                    Total Points
                  </div>
                </div>
              </div>

              {/* Level Progress */}
              <div style={{ marginTop: 24 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                    LVL {level.level}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--neon-cyan)' }}>
                    {level.progress}% → LVL {level.level + 1}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${level.progress}%` }} />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 12,
              marginBottom: 28,
            }}>
              {[
                { label: 'Contributions', value: contribs.length, icon: '📝' },
                { label: 'Points Earned',  value: user?.total_points || 0, icon: '⚡' },
                { label: 'Badges',         value: userBadges.length, icon: '🏆' },
                { label: 'Day Streak',     value: user?.streak_days || 0, icon: '🔥' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                  <div className="stat-value">{s.value.toLocaleString()}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Streak calendar */}
            {user?.streak_days > 0 && (
              <div className="cyber-card" style={{ padding: '18px 20px', marginBottom: 24 }}>
                <div className="cyber-card-corner-br" />
                <div style={{ marginBottom: 10 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                  }}>
                    // 30-Day Streak Activity
                  </span>
                </div>
                <StreakCalendar days={user.streak_days} />
              </div>
            )}

            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: 4,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 24,
            }}>
              {([
                { id: 'contributions', label: 'Contributions', count: contribs.length },
                { id: 'badges', label: 'Badges', count: userBadges.length },
                { id: 'stats', label: 'Stats', count: null },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: `2px solid ${tab === t.id ? 'var(--neon-cyan)' : 'transparent'}`,
                    color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: -1,
                  }}
                >
                  {t.label}
                  {t.count !== null && (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      padding: '1px 6px',
                      borderRadius: 3,
                      background: tab === t.id ? 'rgba(0,245,212,0.15)' : 'rgba(255,255,255,0.06)',
                      color: tab === t.id ? 'var(--neon-cyan)' : 'var(--text-muted)',
                    }}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'contributions' && (
              <div>
                {contribs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div style={{ fontSize: 36, marginBottom: 16 }}>🚀</div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.06em' }}>
                      No contributions yet
                    </p>
                    <Link href="/submit">
                      <button className="btn-neon-solid" style={{ padding: '11px 28px' }}>
                        Submit Your First
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {contribs.map((c, i) => (
                      <ContributionCard key={c.id} contribution={c} animate delay={i * 60} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'badges' && (
              <div>
                {userBadges.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
                    Earn badges by hitting contribution and points milestones. Locked badges shown below.
                  </p>
                )}
                <BadgeGrid
                  earnedBadges={userBadges}
                  allBadges={BADGES}
                  showLocked
                />
              </div>
            )}

            {tab === 'stats' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Type breakdown */}
                <div className="cyber-card" style={{ padding: 24 }}>
                  <div className="cyber-card-corner-br" />
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: 16,
                  }}>
                    // Contribution Breakdown
                  </div>
                  {(['tweet', 'thread', 'referral', 'feedback'] as const).map(type => {
                    const count = contribs.filter(c => c.type === type).length
                    const pct   = contribs.length > 0 ? Math.round((count / contribs.length) * 100) : 0
                    const colors = {
                      tweet:    '#38bdf8',
                      thread:   'var(--neon-purple)',
                      referral: 'var(--neon-gold)',
                      feedback: 'var(--neon-green)',
                    }
                    return (
                      <div key={type} style={{ marginBottom: 14 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 6,
                        }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: colors[type], textTransform: 'capitalize' }}>
                            {type}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                            {count} · {pct}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${colors[type]}90, ${colors[type]})`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Member since */}
                {user?.created_at && (
                  <div className="stat-card">
                    <div className="stat-label" style={{ marginBottom: 4 }}>Member Since</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-primary)', fontWeight: 600 }}>
                      {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
