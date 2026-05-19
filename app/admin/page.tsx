'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Navbar } from '@/components/Navbar'
import { shortenWallet, timeAgo, getTypeConfig } from '@/lib/utils'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import type { Contribution, AdminStats } from '@/lib/types'

type AdminTab = 'pending' | 'approved' | 'rejected' | 'stats'

function StatBox({ label, value, icon, color }: {
  label: string; value: number | string; icon: string; color: string
}) {
  return (
    <div style={{
      padding: '20px',
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${color}25`,
      borderRadius: 10,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0, right: 0,
        width: 60, height: 60,
        background: `radial-gradient(circle at top right, ${color}15, transparent)`,
        pointerEvents: 'none',
      }} />
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 28,
        fontWeight: 800,
        color,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}>
        {label}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { publicKey, connected } = useWallet()
  const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET
  const { adminFetch, signing, error: authError } = useAdminAuth()

  const [tab, setTab]                 = useState<AdminTab>('pending')
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [stats, setStats]             = useState<AdminStats | null>(null)
  const [loading, setLoading]         = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const isAdmin = connected && publicKey?.toString() === ADMIN_WALLET

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function loadData() {
    setLoading(true)
    try {
      const [contribRes, statsRes] = await Promise.all([
        adminFetch(`/api/admin/contributions?status=${tab}`),
        adminFetch('/api/admin/stats'),
      ])
      const contribData = await contribRes.json()
      const statsData   = await statsRes.json()
      setContributions(contribData.data || [])
      setStats(statsData)
    } catch (e: any) {
      showToast(e?.message || 'Failed to load admin data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) loadData()
  }, [tab, isAdmin])

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setActionLoading(id)
    try {
      const res = await adminFetch(`/api/admin/contributions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'approve' ? 'approved' : 'rejected' }),
      })
      if (!res.ok) throw new Error('Action failed')
      setContributions(prev => prev.filter(c => c.id !== id))
      showToast(`Contribution ${action}d successfully`, 'success')
    } catch {
      showToast('Action failed. Try again.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  if (!connected) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--void)' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
              Admin Access Required
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>Connect the admin wallet to access this panel.</p>
          </div>
        </div>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--void)' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--neon-pink)', letterSpacing: '0.05em' }}>
              Access Denied
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>This wallet does not have admin privileges.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--void)' }}>
      <Navbar />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24, right: 24,
          padding: '12px 20px',
          background: toast.type === 'success' ? 'rgba(0,245,212,0.12)' : 'rgba(255,45,120,0.12)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(0,245,212,0.35)' : 'rgba(255,45,120,0.35)'}`,
          borderRadius: 8,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: toast.type === 'success' ? 'var(--neon-cyan)' : 'var(--neon-pink)',
          letterSpacing: '0.05em',
          zIndex: 100,
          animation: 'fadeIn 0.3s ease',
          backdropFilter: 'blur(12px)',
        }}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 80 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div className="section-tag" style={{ margin: 0 }}>Admin Panel</div>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.15em',
              padding: '2px 8px',
              background: 'rgba(255,45,120,0.1)',
              border: '1px solid rgba(255,45,120,0.25)',
              borderRadius: 3,
              color: 'var(--neon-pink)',
            }}>
              RESTRICTED
            </span>
          </div>
          <h1 className="section-title" style={{ fontSize: 32 }}>
            Control Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 4, letterSpacing: '0.05em' }}>
            Logged in as: {shortenWallet(publicKey!.toString(), 6)}
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12,
            marginBottom: 32,
          }}>
            <StatBox label="Total Users"         value={stats.total_users}              icon="👤" color="var(--neon-cyan)" />
            <StatBox label="Total Contributions" value={stats.total_contributions}      icon="📝" color="var(--neon-purple)" />
            <StatBox label="Pending Review"      value={stats.pending_contributions}    icon="⏳" color="var(--neon-gold)" />
            <StatBox label="Points Distributed"  value={stats.total_points_distributed} icon="⚡" color="var(--neon-cyan)" />
            <StatBox label="New Today (Users)"   value={stats.new_users_today}          icon="🌱" color="var(--neon-green)" />
            <StatBox label="Contributions Today" value={stats.contributions_today}      icon="📈" color="var(--neon-pink)" />
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
            { id: 'pending',  label: 'Pending',  color: 'var(--neon-gold)' },
            { id: 'approved', label: 'Approved', color: 'var(--neon-cyan)' },
            { id: 'rejected', label: 'Rejected', color: 'var(--neon-pink)' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 18px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${tab === t.id ? t.color : 'transparent'}`,
                color: tab === t.id ? t.color : 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Contributions Table */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />
            ))}
          </div>
        ) : contributions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.08em' }}>
              Nothing in {tab} queue
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {contributions.map((c, i) => {
              const typeConfig = getTypeConfig(c.type)
              const isPending  = c.status === 'pending'

              return (
                <div
                  key={c.id}
                  className="animate-fade-in-up opacity-0-init"
                  style={{
                    animationDelay: `${i * 40}ms`,
                    animationFillMode: 'forwards',
                    padding: '18px 20px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
                >
                  {/* Meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span className={`neon-badge ${typeConfig.class}`}>{typeConfig.label}</span>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.05em',
                      }}>
                        {shortenWallet(c.wallet, 5)} · {timeAgo(c.created_at)}
                      </span>
                    </div>

                    <p style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: 8,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {c.description}
                    </p>

                    <a
                      href={c.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--neon-cyan)',
                        textDecoration: 'none',
                        letterSpacing: '0.05em',
                        opacity: 0.7,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
                    >
                      ↗ {c.link.length > 60 ? c.link.slice(0, 60) + '...' : c.link}
                    </a>
                  </div>

                  {/* Actions */}
                  {isPending && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => handleAction(c.id, 'approve')}
                        disabled={actionLoading === c.id}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(0,245,212,0.1)',
                          border: '1px solid rgba(0,245,212,0.3)',
                          borderRadius: 6,
                          color: 'var(--neon-cyan)',
                          fontFamily: 'var(--font-display)',
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          opacity: actionLoading === c.id ? 0.5 : 1,
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget.style.background = 'rgba(0,245,212,0.2)')
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget.style.background = 'rgba(0,245,212,0.1)')
                        }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleAction(c.id, 'reject')}
                        disabled={actionLoading === c.id}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(255,45,120,0.08)',
                          border: '1px solid rgba(255,45,120,0.25)',
                          borderRadius: 6,
                          color: 'var(--neon-pink)',
                          fontFamily: 'var(--font-display)',
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          opacity: actionLoading === c.id ? 0.5 : 1,
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget.style.background = 'rgba(255,45,120,0.16)')
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget.style.background = 'rgba(255,45,120,0.08)')
                        }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
