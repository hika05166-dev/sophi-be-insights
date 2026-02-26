/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // better-sqlite3はサーバーサイドのネイティブモジュール
      config.externals = config.externals || []
      config.externals.push('better-sqlite3')
    }
    return config
  },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
}

module.exports = nextConfig
