'use client'

import { useEffect, useState, useCallback } from 'react'
import { Navbar } from '@/components/Navbar'
import { ContributionCard } from '@/components/ContributionCard'
import type { Contribution } from '@/lib/types'
import Link from 'next/link'

type Filter = 'all' | 'tweet' | 'thread' | 'referral' | 'feedback'
type Sort   = 'latest' | 'points' | 'upvotes'

const FILTERS: { value: Filter; label: string; icon: string }[] = [
  { value: 'all',      label: 'All',      icon: '◈' },
  { value: 'tweet',    label: 'Tweets',   icon: '◉' },
  { value: 'thread',   label: 'Threads',  icon: '◎' },
  { value: 'referral', label: 'Referrals',icon: '◆' },
  { value: 'feedback', label: 'Feedback', icon: '◇' },
]

const SORTS: { value: Sort; label: string }[] = [
  { value: 'latest',  label: 'Latest' },
  { value: 'points',  label: 'Points' },
  { value: 'upvotes', label: 'Upvotes' },
]

function SkeletonCard() {
  return (
    <div style={{
      padding: 20,
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 12,
      background: 'rgba(20,20,30,0.4)',
    }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 10, width: '20%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 11, width: '100%', marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 11, width: '80%', marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 11, width: '60%', marginBottom: 16 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ height: 10, width: '20%' }} />
        <div className="skeleton" style={{ height: 10, width: '15%' }} />
      </div>
    </div>
  )
}

export default function FeedPage() {
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading]             = useState(true)
  const [filter, setFilter]               = useState<Filter>('all')
  const [sort, setSort]                   = useState<Sort>('latest')
  const [page, setPage]                   = useState(1)
  const [hasMore, setHasMore]             = useState(true)
  const [total, setTotal]                 = useState(0)
  const [newCount, setNewCount]           = useState(0)
  const PER_PAGE = 20

  const load = useCallback(async (reset = false) => {
    if (reset) setLoading(true)
    try {
      const p   = reset ? 1 : page
      const url = `/api/contributions?limit=${PER_PAGE}&offset=${(p - 1) * PER_PAGE}${filter !== 'all' ? `&type=${filter}` : ''}&sort=${sort}`
      const res = await fetch(url)
      const data = await res.json()
      const items: Contribution[] = data.data || []
      setTotal(data.total || 0)
      if (reset) {
        setContributions(items)
        setPage(1)
      } else {
        setContributions(prev => {
          const ids = new Set(prev.map(c => c.id))
          return [...prev, ...items.filter(c => !ids.has(c.id))]
        })
      }
      setHasMore(items.length === PER_PAGE)
    } finally {
      setLoading(false)
    }
  }, [filter, sort, page])

  useEffect(() => { load(true) }, [filter, sort])

  // Poll for new contributions every 30s
  useEffect(() => {
    const timer = setInterval(async () => {
      const res  = await fetch(`/api/contributions?limit=1&sort=latest`)
      const data = await res.json()
      if (data.data?.[0] && contributions.length > 0 && data.data[0].id !== contributions[0]?.id) {
        setNewCount(prev => prev + 1)
      }
    }, 30000)
    return () => clearInterval(timer)
  }, [contributions])

  function loadMore() {
    setPage(prev => prev + 1)
    load(false)
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--void)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 80 }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 32,
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <div className="section-tag">Community Feed</div>
            <h1 className="section-title" style={{ fontSize: 'clamp(24px, 4vw, 40px)' }}>
              Every contribution.{' '}
              <span style={{ color: 'var(--neon-cyan)' }}>Public forever.</span>
            </h1>
            {!loading && (
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                marginTop: 6,
              }}>
                {total.toLocaleString()} contributions · Season Genesis
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="live-dot">Live</span>
            <Link href="/submit">
              <button className="btn-neon-solid" style={{ padding: '10px 20px' }}>
                + Submit
              </button>
            </Link>
          </div>
        </div>

        {/* New contributions banner */}
        {newCount > 0 && (
          <button
            onClick={() => { setNewCount(0); load(true) }}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(0,245,212,0.08)',
              border: '1px solid rgba(0,245,212,0.3)',
              borderRadius: 8,
              color: 'var(--neon-cyan)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              marginBottom: 20,
              transition: 'background 0.2s',
              textTransform: 'uppercase',
            }}
          >
            ↑ {newCount} new contribution{newCount > 1 ? 's' : ''} — click to refresh
          </button>
        )}

        {/* Filters + Sort */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}>
          {/* Type filters */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: filter === f.value ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.08)',
                  background: filter === f.value ? 'rgba(0,245,212,0.08)' : 'transparent',
                  color: filter === f.value ? 'var(--neon-cyan)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: 10 }}>{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', gap: 4 }}>
            {SORTS.map(s => (
              <button
                key={s.value}
                onClick={() => setSort(s.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 5,
                  border: '1px solid',
                  borderColor: sort === s.value ? 'rgba(0,245,212,0.3)' : 'transparent',
                  background: sort === s.value ? 'rgba(0,245,212,0.05)' : 'transparent',
                  color: sort === s.value ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Main feed */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : contributions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 0',
              }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}>
                  No contributions yet
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
                  Be the first to{' '}
                  <Link href="/submit" style={{ color: 'var(--neon-cyan)', textDecoration: 'none' }}>
                    submit one
                  </Link>
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {contributions.map((c, i) => (
                    <ContributionCard
                      key={c.id}
                      contribution={c}
                      animate
                      delay={Math.min(i * 60, 500)}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div style={{ textAlign: 'center', marginTop: 32 }}>
                    <button
                      onClick={loadMore}
                      className="btn-neon"
                      style={{ padding: '10px 32px' }}
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div style={{
            width: 240,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'sticky',
            top: 88,
          }} className="hidden lg:flex">
            {/* Point values card */}
            <div className="cyber-card" style={{ padding: '20px' }}>
              <div className="cyber-card-corner-br" />
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 14,
              }}>
                // Point Values
              </div>
              {[
                { type: 'Tweet',    pts: 10, color: '#38bdf8' },
                { type: 'Thread',   pts: 25, color: 'var(--neon-purple)' },
                { type: 'Feedback', pts: 15, color: 'var(--neon-green)' },
                { type: 'Referral', pts: 40, color: 'var(--neon-gold)' },
              ].map(item => (
                <div key={item.type} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ fontSize: 12, color: item.color, fontFamily: 'var(--font-mono)' }}>{item.type}</span>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--neon-cyan)',
                  }}>
                    +{item.pts}
                  </span>
                </div>
              ))}
            </div>

            {/* Submit CTA */}
            <div style={{
              padding: 20,
              background: 'linear-gradient(135deg, rgba(0,245,212,0.08), rgba(168,85,247,0.05))',
              border: '1px solid rgba(0,245,212,0.2)',
              borderRadius: 10,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>⚡</div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}>
                Ready to submit?
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
                Earn points for every community contribution.
              </p>
              <Link href="/submit">
                <button className="btn-neon-solid" style={{ width: '100%', padding: '10px' }}>
                  Submit Now
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
