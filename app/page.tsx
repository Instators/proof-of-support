'use client'

import { useEffect, useRef, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'

/* ---- PARTICLE CANVAS ---- */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }[] = []
    const COLORS = ['rgba(0,245,212,', 'rgba(168,85,247,', 'rgba(255,45,120,']

    for (let i = 0; i < 80; i++) {
      particles.push({
        x:     Math.random() * window.innerWidth,
        y:     Math.random() * window.innerHeight,
        vx:    (Math.random() - 0.5) * 0.3,
        vy:    (Math.random() - 0.5) * 0.3,
        size:  Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })
    }

    let raf: number
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x
          const dy   = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(0,245,212,${0.08 * (1 - dist / 120)})`
            ctx.lineWidth   = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw particles
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color + p.alpha + ')'
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}

/* ---- ANIMATED COUNTER ---- */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start    = 0
    const dur    = 2000
    const step   = Math.ceil(target / (dur / 16))
    const timer  = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(start)
    }, 16)
    return () => clearInterval(timer)
  }, [target])

  return <span>{count.toLocaleString()}{suffix}</span>
}

/* ---- GLITCH HEADING ---- */
function GlitchHeading({ text, highlight }: { text: string; highlight: string }) {
  return (
    <h1
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(40px, 7vw, 88px)',
        fontWeight: 900,
        lineHeight: 1.05,
        letterSpacing: '-0.02em',
        color: 'var(--text-primary)',
        position: 'relative',
      }}
    >
      <span
        className="glitch"
        data-text={text}
        style={{ display: 'block' }}
      >
        {text}
      </span>
      <span
        className="glitch glow-cyan"
        data-text={highlight}
        style={{
          display: 'block',
          color: 'var(--neon-cyan)',
          marginTop: -4,
        }}
      >
        {highlight}
      </span>
    </h1>
  )
}

const TICKER_ITEMS = [
  '⚡ Contribution verified',
  '🏆 Badge earned: Champion',
  '🔥 7-day streak achieved',
  '📡 Thread submitted +25 pts',
  '🌱 New contributor joined',
  '💎 Legend badge unlocked',
  '📢 Referral tracked +40 pts',
  '✅ Contribution approved',
  '⚡ Contribution verified',
  '🏆 Badge earned: Champion',
  '🔥 7-day streak achieved',
  '📡 Thread submitted +25 pts',
  '🌱 New contributor joined',
  '💎 Legend badge unlocked',
  '📢 Referral tracked +40 pts',
  '✅ Contribution approved',
]

const FEATURES = [
  {
    icon: '🔐',
    tag: '01',
    title: 'Wallet Identity',
    desc: 'Your Solana wallet is your identity. No email. No password. No friction. Just proof.',
    accent: 'var(--neon-cyan)',
  },
  {
    icon: '📡',
    tag: '02',
    title: 'Submit & Track',
    desc: 'Link any tweet, thread, referral, or feedback. All contributions live in a public feed forever.',
    accent: 'var(--neon-purple)',
  },
  {
    icon: '⚡',
    tag: '03',
    title: 'Earn Points',
    desc: 'Every submission earns XP. Build streaks. Level up. Rise through the ranks.',
    accent: 'var(--neon-gold)',
  },
  {
    icon: '🏆',
    tag: '04',
    title: 'NFT Badges',
    desc: 'Hit milestones and unlock hexagonal on-chain badges — permanent proof of your impact.',
    accent: 'var(--neon-pink)',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Connect Wallet', desc: 'Phantom, Solflare, or Backpack — one click, you\'re in.' },
  { step: '02', title: 'Submit Contribution', desc: 'Paste your link, describe your impact, select the type.' },
  { step: '03', title: 'Get Verified', desc: 'Community upvotes + admin review locks in your proof.' },
  { step: '04', title: 'Earn & Flex', desc: 'Points, badges, streaks — your reputation on-chain forever.' },
]

export default function LandingPage() {
  const { connected } = useWallet()
  const router = useRouter()
  const [statsLoaded, setStatsLoaded] = useState(false)
  const [stats, setStats] = useState({ users: 0, contributions: 0, points: 0 })

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setStatsLoaded(true) })
      .catch(() => setStatsLoaded(true))
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--void)' }}>
      <Navbar />

      {/* ---- HERO SECTION ---- */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        paddingTop: 80,
      }}>
        <ParticleCanvas />

        {/* Radial gradient center glow */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(0,245,212,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <div className="page-container" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          {/* Live badge */}
          <div
            className="animate-fade-in-up opacity-0-init"
            style={{ animationFillMode: 'forwards', marginBottom: 32 }}
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              background: 'rgba(0,245,212,0.06)',
              border: '1px solid rgba(0,245,212,0.25)',
              borderRadius: 100,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--neon-cyan)',
            }}>
              <span style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: 'var(--neon-cyan)',
                boxShadow: '0 0 6px var(--neon-cyan)',
                animation: 'pulse-dot 1.5s infinite',
                display: 'inline-block',
              }} />
              Live on Solana Devnet · Season Genesis
            </span>
          </div>

          {/* Main heading */}
          <div
            className="animate-fade-in-up opacity-0-init delay-200"
            style={{ animationFillMode: 'forwards', marginBottom: 24 }}
          >
            <GlitchHeading text="Your Contributions." highlight="On-Chain. Forever." />
          </div>

          {/* Subheading */}
          <p
            className="animate-fade-in-up opacity-0-init delay-300"
            style={{
              animationFillMode: 'forwards',
              fontFamily: 'var(--font-body)',
              fontSize: 18,
              fontWeight: 300,
              color: 'var(--text-secondary)',
              maxWidth: 560,
              margin: '0 auto 40px',
              lineHeight: 1.7,
            }}
          >
            The Web3 platform where community contributions are
            tracked, verified, and rewarded — visible to everyone, owned by no one.
          </p>

          {/* CTA */}
          <div
            className="animate-fade-in-up opacity-0-init delay-400"
            style={{
              animationFillMode: 'forwards',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 60,
            }}
          >
            {connected ? (
              <>
                <button
                  onClick={() => router.push('/submit')}
                  className="btn-neon-solid"
                  style={{ fontSize: 12, padding: '14px 32px' }}
                >
                  ⚡ Submit Contribution
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn-neon"
                  style={{ padding: '14px 32px' }}
                >
                  View Dashboard
                </button>
              </>
            ) : (
              <>
                <WalletMultiButton style={{ height: 48, fontSize: 11 }} />
                <Link href="/feed" style={{ textDecoration: 'none' }}>
                  <button className="btn-neon" style={{ padding: '13px 28px' }}>
                    Browse Feed
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Live Stats */}
          <div
            className="animate-fade-in-up opacity-0-init delay-500"
            style={{ animationFillMode: 'forwards' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              flexWrap: 'wrap',
            }}>
              {[
                { label: 'Contributors', value: stats.users, suffix: '+' },
                { label: 'Contributions', value: stats.contributions, suffix: '' },
                { label: 'Points Distributed', value: stats.points, suffix: '' },
              ].map((item, i) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div style={{
                    padding: '20px 40px',
                    textAlign: 'center',
                    borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 32,
                      fontWeight: 800,
                      color: 'var(--neon-cyan)',
                      lineHeight: 1,
                      textShadow: '0 0 30px rgba(0,245,212,0.4)',
                    }}>
                      {statsLoaded ? <AnimatedCounter target={item.value} suffix={item.suffix} /> : '—'}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginTop: 6,
                    }}>
                      {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          opacity: 0.4,
          animation: 'float 3s ease-in-out infinite',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Scroll
          </div>
          <div style={{ width: 1, height: 30, background: 'linear-gradient(to bottom, var(--neon-cyan), transparent)' }} />
        </div>
      </section>

      {/* ---- TICKER ---- */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {TICKER_ITEMS.map((item, i) => (
            <span key={i} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 16 }}>
              {item}
              <span style={{ color: 'var(--border-cyan)' }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ---- FEATURES ---- */}
      <section style={{ padding: '100px 0' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="section-tag" style={{ justifyContent: 'center' }}>Features</div>
            <h2 className="section-title" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
              Built for contributors who{' '}
              <span style={{ color: 'var(--neon-cyan)' }}>actually show up</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.tag}
                className="animate-fade-in-up opacity-0-init"
                style={{
                  animationDelay: `${i * 100}ms`,
                  animationFillMode: 'forwards',
                }}
              >
                <div className="cyber-card" style={{ padding: '28px 24px', height: '100%' }}>
                  <div className="cyber-card-corner-br" />
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48, height: 48,
                    borderRadius: 10,
                    background: `${f.accent}15`,
                    border: `1px solid ${f.accent}30`,
                    fontSize: 22,
                    marginBottom: 16,
                  }}>
                    {f.icon}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    color: 'var(--text-muted)',
                    marginBottom: 6,
                  }}>
                    {f.tag} ——
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    color: 'var(--text-primary)',
                    marginBottom: 10,
                  }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- HOW IT WORKS ---- */}
      <section style={{ padding: '80px 0 120px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="section-tag" style={{ justifyContent: 'center' }}>Process</div>
            <h2 className="section-title" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
              Up and running in <span style={{ color: 'var(--neon-cyan)' }}>60 seconds</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 1,
            position: 'relative',
          }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.step}
                style={{
                  padding: '32px 24px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 48,
                  fontWeight: 900,
                  color: 'rgba(0,245,212,0.08)',
                  lineHeight: 1,
                  marginBottom: 16,
                  letterSpacing: '-0.02em',
                }}>
                  {step.step}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: 'var(--neon-cyan)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {step.desc}
                </p>

                {/* Arrow connector */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: -12,
                    transform: 'translateY(-50%)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 16,
                    color: 'var(--neon-cyan)',
                    zIndex: 2,
                    opacity: 0.4,
                  }}>
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- BOTTOM CTA ---- */}
      <section style={{
        padding: '80px 0',
        textAlign: 'center',
        background: 'linear-gradient(0deg, rgba(0,245,212,0.04), transparent)',
        borderTop: '1px solid rgba(0,245,212,0.1)',
      }}>
        <div className="page-container">
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
            marginBottom: 16,
          }}>
            Start building your proof today.
          </h2>
          <p style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
            marginBottom: 36,
            fontWeight: 300,
          }}>
            Every contribution is a building block. Start with one.
          </p>
          <WalletMultiButton style={{ height: 52, fontSize: 12 }} />
        </div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.04)',
        padding: '28px 0',
        textAlign: 'center',
      }}>
        <div className="page-container">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              ⚡ PROOF-OF-SUPPORT · HELPBNK × SUPERTEAM
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { label: 'Feed', href: '/feed' },
                { label: 'Submit', href: '/submit' },
                { label: 'Leaderboard', href: '/leaderboard' },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--neon-cyan)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                  {l.label}
                </Link>
              ))}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              SOLANA DEVNET · SEASON GENESIS
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
