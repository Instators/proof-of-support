import type { Metadata } from 'next'
import { SolanaWalletProvider } from '@/providers/WalletProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Proof-of-Support | Verify. Contribute. Earn.',
  description: 'The Web3 platform where community contributions are tracked, verified, and rewarded on-chain.',
  metadataBase: new URL('https://proof-of-support.vercel.app'),
  openGraph: {
    title: 'Proof-of-Support',
    description: 'Your contributions. On-chain. Forever.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Proof-of-Support',
    description: 'Track, verify, and reward Web3 community contributions.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
      </head>
      <body>
        <SolanaWalletProvider>
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  )
}
