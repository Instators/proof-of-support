'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState, useCallback } from 'react'
import type { User } from '@/lib/types'

export function useUser() {
  const { publicKey, connected } = useWallet()
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const fetchOrCreate = useCallback(async (wallet: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/user/${wallet}`, { method: 'POST' })
      const data = await res.json()
      if (data.user) setUser(data.user)
    } catch (e) {
      setError('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (connected && publicKey) {
      fetchOrCreate(publicKey.toString())
    } else {
      setUser(null)
    }
  }, [connected, publicKey, fetchOrCreate])

  const refetch = useCallback(() => {
    if (publicKey) fetchOrCreate(publicKey.toString())
  }, [publicKey, fetchOrCreate])

  return { user, loading, error, refetch }
}
