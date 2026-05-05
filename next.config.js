/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs:              false,
        path:            false,
        crypto:          false,
        'pino-pretty':   false,
        'lokiTransport': false,
        'thread-stream': false,
      }
    }
    // Suppress noisy warnings from WalletConnect/ox internals
    config.ignoreWarnings = [
      { module: /virtualMasterPool/ },
      { module: /pino/ },
    ]
    return config
  },
  experimental: {
    serverComponentsExternalPackages: ['@solana/web3.js'],
  },
}

module.exports = nextConfig
