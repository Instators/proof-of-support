'use client'

import { FC, ReactNode, useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'

require('@solana/wallet-adapter-react-ui/styles.css')

// Note: Backpack is no longer added explicitly — its adapter package was
// deprecated. Backpack now connects automatically via the Solana Wallet
// Standard when the user has the extension installed.

function resolveNetwork(): WalletAdapterNetwork {
  const raw = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet').toLowerCase()
  if (raw === 'mainnet-beta' || raw === 'mainnet') return WalletAdapterNetwork.Mainnet
  if (raw === 'testnet')                            return WalletAdapterNetwork.Testnet
  return WalletAdapterNetwork.Devnet
}

export const SolanaWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const network  = useMemo(() => resolveNetwork(), [])
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const wallets  = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
