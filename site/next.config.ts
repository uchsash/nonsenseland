import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

// The Cloudflare build (npm run cf:build) swaps Node-only libraries for stand-ins.
const forCloudflare = process.env.BUILD_TARGET === 'cloudflare'
const cloudflareAliases: Record<string, string> = forCloudflare ? { sharp: './src/lib/stubs/sharp.ts' } : {}

const nextConfig: NextConfig = {
  // Photos from the quick-post page (/post); they are already shrunk in the browser.
  experimental: { serverActions: { bodySizeLimit: '12mb' } },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    Object.assign((webpackConfig.resolve.alias ??= {}), Object.fromEntries(
      Object.entries(cloudflareAliases).map(([k, v]) => [k, path.resolve(dirname, v)]),
    ))
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
    resolveAlias: cloudflareAliases,
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
