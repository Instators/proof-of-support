'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { getDomain, getTypeConfig } from '@/lib/utils'
import type { ContributionType } from '@/lib/types'

const TYPES: { value: ContributionType; label: string; icon: string; desc: string; pts: number; color: string }[] = [
  { value: 'tweet',    label: 'Tweet',    icon: '🐦', desc: 'A post or reply on X/Twitter', pts: 10, color: '#38bdf8' },
  { value: 'thread',   label: 'Thread',   icon: '🧵', desc: 'A multi-post thread or article', pts: 25, color: 'var(--neon-purple)' },
  { value: 'referral', label: 'Referral', icon: '📣', desc: 'Bringing in new members', pts: 40, color: 'var(--neon-gold)' },
  { value: 'feedback', label: 'Feedback', icon: '💬', desc: 'Detailed feedback or review', pts: 15, color: 'var(--neon-green)' },
]

export default function SubmitPage() {
  const { publicKey, connected, signMessage } = useWallet()
  const router = useRouter()

  const [type, setType]             = useState<ContributionType>('tweet')
  const [link, setLink]             = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)

  const selectedType = TYPES.find(t => t.value === type)!
  const domain       = link ? getDomain(link) : null
  const charCount    = description.length
  const isValid      = link.trim() && description.trim().length >= 10

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!publicKey || !isValid) return
    setLoading(true)
    setError('')

    try {
      // Optionally sign message for cryptographic proof
      let signature: string | null = null
      if (signMessage) {
        try {
          const msg  = new TextEncoder().encode(`Proof-of-Support: ${link} | ${Date.now()}`)
          const sig  = await signMessage(msg)
          signature  = Buffer.from(sig).toString('base64')
        } catch {
          // User rejected sign — continue without signature
        }
      }

      const res = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          link:   link.trim(),
          description: description.trim(),
          type,
          signature,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--void)' }}>
        <Navbar />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          padding: 24,
        }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            {/* Animated lock icon */}
            <div style={{
              width: 80, height: 80,
              border: '1px solid rgba(0,245,212,0.3)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              margin: '0 auto 24px',
              background: 'rgba(0,245,212,0.05)',
              animation: 'float 4s ease-in-out infinite',
            }}>
              🔐
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'var(--text-primary)',
              marginBottom: 10,
            }}>
              Wallet Required
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28, lineHeight: 1.65 }}>
              Connect your Solana wallet to submit contributions and start earning points.
            </p>
            <WalletMultiButton style={{ height: 48, fontSize: 11 }} />
          </div>
        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--void)' }}>
        <Navbar />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          padding: 24,
        }}>
          <div style={{ textAlign: 'center', maxWidth: 440 }} className="animate-fade-in-up">
            {/* Success animation */}
            <div style={{
              position: 'relative',
              width: 100, height: 100,
              margin: '0 auto 28px',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px solid var(--neon-cyan)',
                animation: 'ripple 1.5s ease-out',
              }} />
              <div style={{
                width: 100, height: 100,
                borderRadius: '50%',
                background: 'rgba(0,245,212,0.1)',
                border: '1px solid rgba(0,245,212,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 42,
              }}>
                ⚡
              </div>
            </div>

            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: 'var(--neon-cyan)',
              textShadow: '0 0 20px rgba(0,245,212,0.4)',
              marginBottom: 8,
            }}>
              Contribution Submitted!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
              +{selectedType.pts} points added to your profile
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 32 }}>
              Your contribution is now live on the public feed.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => router.push('/feed')}
                className="btn-neon-solid"
                style={{ padding: '12px 28px' }}
              >
                View Feed
              </button>
              <button
                onClick={() => {
                  setSuccess(false)
                  setLink('')
                  setDescription('')
                }}
                className="btn-neon"
                style={{ padding: '12px 28px' }}
              >
                Submit Another
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--void)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div className="section-tag">Submit</div>
            <h1 className="section-title" style={{ fontSize: 'clamp(24px, 4vw, 40px)' }}>
              Prove your{' '}
              <span style={{ color: 'var(--neon-cyan)' }}>contribution</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>
              Every link you submit becomes permanent, verifiable proof of your community work.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* Type Selection */}
              <div>
                <label style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  display: 'block',
                  marginBottom: 12,
                }}>
                  // 01 — Contribution Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      style={{
                        padding: '16px',
                        borderRadius: 10,
                        border: '1px solid',
                        borderColor: type === t.value ? t.color : 'rgba(255,255,255,0.07)',
                        background: type === t.value ? `${t.color}12` : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {type === t.value && (
                        <div style={{
                          position: 'absolute',
                          top: 0, left: 0,
                          width: 16, height: 16,
                          borderTop: `2px solid ${t.color}`,
                          borderLeft: `2px solid ${t.color}`,
                          borderRadius: '2px 0 0 0',
                        }} />
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 18 }}>{t.icon}</span>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 12,
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: type === t.value ? t.color : 'var(--text-primary)',
                        }}>
                          {t.label}
                        </span>
                        <span style={{
                          marginLeft: 'auto',
                          fontFamily: 'var(--font-display)',
                          fontSize: 11,
                          fontWeight: 700,
                          color: type === t.value ? t.color : 'var(--text-muted)',
                        }}>
                          +{t.pts} pts
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                        {t.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Link Input */}
              <div>
                <label style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  display: 'block',
                  marginBottom: 10,
                }}>
                  // 02 — Contribution Link
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="url"
                    required
                    value={link}
                    onChange={e => setLink(e.target.value)}
                    placeholder="https://twitter.com/your/tweet-url"
                    className="cyber-input"
                    style={{ paddingRight: domain ? 100 : 16 }}
                  />
                  {domain && (
                    <div style={{
                      position: 'absolute',
                      right: 12, top: '50%',
                      transform: 'translateY(-50%)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--neon-cyan)',
                      letterSpacing: '0.08em',
                      background: 'rgba(0,245,212,0.08)',
                      padding: '3px 8px',
                      borderRadius: 4,
                      border: '1px solid rgba(0,245,212,0.2)',
                    }}>
                      {domain}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}>
                  <label style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                  }}>
                    // 03 — Describe Your Impact
                  </label>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: charCount > 400 ? 'var(--neon-pink)' : 'var(--text-muted)',
                  }}>
                    {charCount}/500
                  </span>
                </div>
                <textarea
                  required
                  minLength={10}
                  maxLength={500}
                  rows={5}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Explain what you contributed, why it matters, and what impact it had on the community..."
                  className="cyber-input"
                  style={{ resize: 'none' }}
                />
                {description.length > 0 && description.length < 10 && (
                  <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--neon-gold)',
                    marginTop: 6,
                    letterSpacing: '0.05em',
                  }}>
                    ⚠ Minimum 10 characters required
                  </p>
                )}
              </div>

              {/* Preview */}
              {link && description.length >= 10 && (
                <div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: 10,
                  }}>
                    // Preview
                  </div>
                  <div style={{
                    padding: '16px',
                    background: 'rgba(0,245,212,0.03)',
                    border: '1px solid rgba(0,245,212,0.15)',
                    borderRadius: 10,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className={`neon-badge ${getTypeConfig(type).class}`}>
                        {getTypeConfig(type).label}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 11,
                        color: 'var(--neon-cyan)',
                        fontWeight: 700,
                      }}>
                        +{selectedType.pts} pts
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
                      {description}
                    </p>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                        letterSpacing: '0.05em',
                      }}
                    >
                      ↗ {domain}
                    </a>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(255,45,120,0.08)',
                  border: '1px solid rgba(255,45,120,0.25)',
                  borderRadius: 8,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--neon-pink)',
                  letterSpacing: '0.03em',
                }}>
                  ⚠ {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !isValid}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: isValid && !loading ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid',
                  borderColor: isValid && !loading ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: isValid && !loading ? 'var(--void)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: isValid && !loading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.25s ease',
                  boxShadow: isValid && !loading ? '0 0 20px rgba(0,245,212,0.25)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 14, height: 14,
                      borderRadius: '50%',
                      border: '2px solid rgba(0,0,0,0.2)',
                      borderTopColor: '#000',
                      animation: 'spin-slow 0.8s linear infinite',
                      display: 'inline-block',
                    }} />
                    Submitting...
                  </>
                ) : (
                  <>⚡ Submit Contribution · +{selectedType.pts} pts</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
