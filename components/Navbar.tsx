'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { useUser } from '@/hooks/useUser'
import { formatPoints, shortenWallet } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/feed',        label: 'Feed',        tag: '01' },
  { href: '/submit',      label: 'Submit',      tag: '02' },
  { href: '/leaderboard', label: 'Leaderboard', tag: '03' },
  { href: '/dashboard',   label: 'Dashboard',   tag: '04' },
]

export function Navbar() {
  const pathname = usePathname()
  const { connected, publicKey } = useWallet()
  const { user } = useUser()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 50,
          transition: 'all 0.3s ease',
          background: scrolled
            ? 'rgba(5,5,8,0.92)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled
            ? '1px solid rgba(0,245,212,0.12)'
            : '1px solid transparent',
        }}
      >
        {/* Top accent line */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--neon-cyan), transparent)',
          opacity: scrolled ? 1 : 0,
          transition: 'opacity 0.3s',
        }} />

        <div className="page-container" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}>
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32,
                border: '1px solid var(--neon-cyan)',
                borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,245,212,0.06)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <span style={{ fontSize: 16, position: 'relative', zIndex: 1 }}>⚡</span>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(0,245,212,0.1), transparent)',
                }} />
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--text-primary)',
                }}>
                  PROOF<span style={{ color: 'var(--neon-cyan)' }}>-OF-</span>SUPPORT
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  letterSpacing: '0.15em',
                  color: 'var(--text-muted)',
                  marginTop: -2,
                }}>
                  SOLANA DEVNET
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="hidden md:flex">
              {NAV_LINKS.map(({ href, label, tag }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 6,
                      textDecoration: 'none',
                      fontFamily: 'var(--font-display)',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: active ? 'var(--neon-cyan)' : 'var(--text-muted)',
                      background: active ? 'rgba(0,245,212,0.06)' : 'transparent',
                      border: '1px solid',
                      borderColor: active ? 'rgba(0,245,212,0.2)' : 'transparent',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'transparent'
                      }
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, opacity: 0.5 }}>{tag}</span>
                    {label}
                  </Link>
                )
              })}
            </div>

            {/* Right Side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Points Display */}
              {connected && user && (
                <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    background: 'rgba(0,245,212,0.06)',
                    border: '1px solid rgba(0,245,212,0.2)',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: 14 }}>⚡</span>
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--neon-cyan)',
                        lineHeight: 1,
                      }}>
                        {formatPoints(user.total_points)}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.1em',
                      }}>
                        pts
                      </div>
                    </div>
                    {user.streak_days > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '2px 6px',
                        background: 'rgba(255,45,120,0.1)',
                        border: '1px solid rgba(255,45,120,0.2)',
                        borderRadius: 4,
                      }}>
                        <span style={{ fontSize: 10 }}>🔥</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--neon-pink)' }}>
                          {user.streak_days}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              )}

              {/* Admin Link */}
              {connected && publicKey?.toString() === process.env.NEXT_PUBLIC_ADMIN_WALLET && (
                <Link
                  href="/admin"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--neon-pink)',
                    textDecoration: 'none',
                    letterSpacing: '0.1em',
                    padding: '6px 10px',
                    border: '1px solid rgba(255,45,120,0.3)',
                    borderRadius: 4,
                  }}
                >
                  ADMIN
                </Link>
              )}

              <WalletMultiButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile nav spacer */}
      <div style={{ height: 64 }} />
    </>
  )
}
