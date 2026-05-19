import 'server-only'
import { NextRequest } from 'next/server'
import nacl from 'tweetnacl'
import bs58 from 'bs58'

/**
 * Verifies that a request came from the admin wallet.
 *
 * The client (admin page) signs a message of the form `POS_ADMIN:<timestamp>`
 * using their connected Solana wallet, and sends three headers:
 *   - x-admin-wallet:    base58 public key
 *   - x-admin-timestamp: unix ms
 *   - x-admin-signature: base58-encoded ed25519 signature
 *
 * Server checks:
 *   1. wallet matches ADMIN_WALLET (server env, NOT NEXT_PUBLIC_)
 *   2. timestamp is within MAX_SESSION_MS of now
 *   3. signature is valid ed25519 over `POS_ADMIN:<timestamp>` by the wallet's pubkey
 */

const MAX_SESSION_MS = 60 * 60 * 1000 // 1 hour

export type AdminAuthResult =
  | { ok: true }
  | { ok: false; status: number; error: string }

export function verifyAdminRequest(req: NextRequest): AdminAuthResult {
  const adminWallet = process.env.ADMIN_WALLET
  if (!adminWallet) {
    return { ok: false, status: 500, error: 'Server misconfigured: ADMIN_WALLET not set' }
  }

  const wallet    = req.headers.get('x-admin-wallet')
  const timestamp = req.headers.get('x-admin-timestamp')
  const signature = req.headers.get('x-admin-signature')

  if (!wallet || !timestamp || !signature) {
    return { ok: false, status: 401, error: 'Missing admin auth headers' }
  }

  if (wallet !== adminWallet) {
    return { ok: false, status: 403, error: 'Not an admin wallet' }
  }

  const ts = parseInt(timestamp, 10)
  if (!Number.isFinite(ts)) {
    return { ok: false, status: 401, error: 'Invalid timestamp' }
  }
  const age = Date.now() - ts
  if (age < 0 || age > MAX_SESSION_MS) {
    return { ok: false, status: 401, error: 'Admin session expired — reconnect' }
  }

  // Verify signature
  try {
    const message  = new TextEncoder().encode(`POS_ADMIN:${timestamp}`)
    const sigBytes = bs58.decode(signature)
    const pubBytes = bs58.decode(wallet)
    const valid    = nacl.sign.detached.verify(message, sigBytes, pubBytes)
    if (!valid) {
      return { ok: false, status: 401, error: 'Invalid signature' }
    }
  } catch {
    return { ok: false, status: 401, error: 'Signature verification failed' }
  }

  return { ok: true }
}
