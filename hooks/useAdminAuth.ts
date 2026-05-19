'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useEffect, useState } from 'react'

const SESSION_KEY = 'pos_admin_session'
const MAX_SESSION_MS = 60 * 60 * 1000 // must match server

type AdminSession = {
  wallet:    string
  timestamp: number
  signature: string // base58
}

function loadSession(wallet: string): AdminSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s: AdminSession = JSON.parse(raw)
    if (s.wallet !== wallet) return null
    if (Date.now() - s.timestamp > MAX_SESSION_MS) return null
    return s
  } catch {
    return null
  }
}

function saveSession(s: AdminSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
}

export function useAdminAuth() {
  const { publicKey, signMessage } = useWallet()
  const [session, setSession] = useState<AdminSession | null>(null)
  const [signing, setSigning] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (publicKey) {
      const existing = loadSession(publicKey.toString())
      setSession(existing)
    } else {
      setSession(null)
    }
  }, [publicKey])

  const requestSession = useCallback(async () => {
    if (!publicKey || !signMessage) {
      setError('Connect a wallet that supports message signing.')
      return null
    }
    setSigning(true)
    setError(null)
    try {
      const timestamp = Date.now()
      const message   = new TextEncoder().encode(`POS_ADMIN:${timestamp}`)
      const sigBytes  = await signMessage(message)
      // Encode signature as base58 to match server.
      // bs58 isn't imported on the client; use a tiny inline encoder.
      const signature = base58Encode(sigBytes)
      const s: AdminSession = { wallet: publicKey.toString(), timestamp, signature }
      saveSession(s)
      setSession(s)
      return s
    } catch (e: any) {
      setError(e?.message || 'Failed to sign admin session')
      return null
    } finally {
      setSigning(false)
    }
  }, [publicKey, signMessage])

  /**
   * fetch wrapper that attaches admin headers. Will prompt the wallet to sign
   * a new session message if no valid session exists.
   */
  const adminFetch = useCallback(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    let s = session
    if (!s || Date.now() - s.timestamp > MAX_SESSION_MS) {
      s = await requestSession()
      if (!s) throw new Error('Admin auth required')
    }
    const headers = new Headers(init.headers)
    headers.set('x-admin-wallet',    s.wallet)
    headers.set('x-admin-timestamp', String(s.timestamp))
    headers.set('x-admin-signature', s.signature)
    return fetch(input, { ...init, headers })
  }, [session, requestSession])

  return { session, signing, error, requestSession, adminFetch }
}

// Minimal base58 encoder (Bitcoin alphabet) — no extra dependency.
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return ''
  // Count leading zeros
  let zeros = 0
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++
  // Convert to base58
  const digits: number[] = [0]
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i]
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8
      digits[j] = carry % 58
      carry = Math.floor(carry / 58)
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = Math.floor(carry / 58)
    }
  }
  let result = ''
  for (let i = 0; i < zeros; i++) result += '1'
  for (let i = digits.length - 1; i >= 0; i--) result += BASE58_ALPHABET[digits[i]]
  return result
}
