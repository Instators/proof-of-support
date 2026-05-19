'use client'

import type { Contribution } from '@/lib/types'
import { timeAgo, getDomain, getTypeConfig, avatarInitials, avatarColor, shortenWallet } from '@/lib/utils'
import { useState } from 'react'

interface Props {
  contribution: Contribution
  animate?: boolean
  delay?: number
  onUpvote?: (id: string) => void
}

const STATUS_CONFIG = {
  pending:  { label: 'PENDING',  color: 'var(--neon-gold)',   bg: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.2)' },
  approved: { label: 'VERIFIED', color: 'var(--neon-cyan)',   bg: 'rgba(0,245,212,0.06)',    border: 'rgba(0,245,212,0.2)' },
  rejected: { label: 'REJECTED', color: 'var(--neon-pink)',   bg: 'rgba(255,45,120,0.08)',   border: 'rgba(255,45,120,0.2)' },
}

export function ContributionCard({ contribution, animate = true, delay = 0, onUpvote }: Props) {
  const [upvoted, setUpvoted] = useState(false)
  const [votes, setVotes]     = useState(contribution.upvotes || 0)
  const [hovered, setHovered] = useState(false)

  const typeConfig   = getTypeConfig(contribution.type)
  const statusConfig = STATUS_CONFIG[contribution.status]
  const wallet       = contribution.wallet
  const displayName  = contribution.users?.username || shortenWallet(wallet)
  const initials     = avatarInitials(wallet, contribution.users?.username)
  const gradient     = avatarColor(wallet)
  const domain       = getDomain(contribution.link)

  function handleUpvote() {
    if (upvoted) return
    setUpvoted(true)
    setVotes(v => v + 1)
    // Persist the upvote — revert local state on failure.
    fetch(`/api/contributions/${contribution.id}/upvote`, { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error('upvote failed')
      })
      .catch(() => {
        setUpvoted(false)
        setVotes(v => Math.max(0, v - 1))
      })
    onUpvote?.(contribution.id)
  }

  return (
    <div
      className={animate ? 'animate-fade-in-up opacity-0-init' : ''}
      style={animate ? { animationDelay: `${delay}ms`, animationFillMode: 'forwards' } : {}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position: 'relative',
        background: hovered ? 'rgba(26,26,46,0.8)' : 'rgba(20,20,30,0.6)',
        border: `1px solid ${hovered ? 'rgba(0,245,212,0.35)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 12,
        padding: '20px',
        transition: 'all 0.25s ease',
        boxShadow: hovered ? '0 0 30px rgba(0,245,212,0.08), inset 0 0 30px rgba(0,245,212,0.02)' : 'none',
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
      }}>
        {/* Top-left corner decorator */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: 16, height: 16,
          borderTop: '2px solid var(--neon-cyan)',
          borderLeft: '2px solid var(--neon-cyan)',
          borderRadius: '2px 0 0 0',
          opacity: hovered ? 0.8 : 0.3,
          transition: 'opacity 0.3s',
        }} />
        {/* Bottom-right corner decorator */}
        <div style={{
          position: 'absolute',
          bottom: 0, right: 0,
          width: 16, height: 16,
          borderBottom: '2px solid var(--neon-cyan)',
          borderRight: '2px solid var(--neon-cyan)',
          borderRadius: '0 0 2px 0',
          opacity: hovered ? 0.8 : 0.3,
          transition: 'opacity 0.3s',
        }} />

        {/* Scan line on hover */}
        {hovered && (
          <div style={{
            position: 'absolute',
            left: 0, right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0,245,212,0.4), transparent)',
            animation: 'scanMove 1.5s linear infinite',
            pointerEvents: 'none',
          }} />
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Avatar */}
            <div style={{
              width: 36, height: 36,
              borderRadius: '50%',
              background: gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: 12,
              fontWeight: 700,
              color: '#000',
              flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              {initials}
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--text-primary)',
                letterSpacing: '0.05em',
              }}>
                {displayName}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                marginTop: 1,
              }}>
                {timeAgo(contribution.created_at)}
              </div>
            </div>
          </div>

          {/* Right badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Type */}
            <span className={`neon-badge ${typeConfig.class}`}>
              {typeConfig.label}
            </span>
            {/* Status */}
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.12em',
              padding: '3px 7px',
              borderRadius: 3,
              color: statusConfig.color,
              background: statusConfig.bg,
              border: `1px solid ${statusConfig.border}`,
            }}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Description */}
        <p style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
          marginBottom: 14,
        }}>
          {contribution.description}
        </p>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          {/* Link */}
          <a
            href={contribution.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-muted)',
              textDecoration: 'none',
              letterSpacing: '0.08em',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--neon-cyan)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <span>↗</span>
            {domain}
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Upvote */}
            <button
              onClick={handleUpvote}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'none',
                border: 'none',
                cursor: upvoted ? 'default' : 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: upvoted ? 'var(--neon-purple)' : 'var(--text-muted)',
                transition: 'color 0.2s',
                padding: '4px 8px',
                borderRadius: 4,
              }}
              onMouseEnter={e => {
                if (!upvoted) (e.currentTarget as HTMLButtonElement).style.color = 'var(--neon-purple)'
              }}
              onMouseLeave={e => {
                if (!upvoted) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
              }}
            >
              <span style={{ fontSize: 12 }}>{upvoted ? '▲' : '△'}</span>
              {votes}
            </button>

            {/* Points */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--neon-cyan)',
            }}>
              <span style={{ fontSize: 11 }}>⚡</span>
              +{typeConfig.points} pts
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
