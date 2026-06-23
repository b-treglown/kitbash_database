/** @type {import('next').NextConfig} */
const r2PublicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || process.env.R2_CDN_URL;
let r2PublicHost = null;

if (r2PublicBaseUrl) {
  try {
    r2PublicHost = new URL(r2PublicBaseUrl).hostname;
  } catch {
    r2PublicHost = null;
  }
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cdn.cloudflare.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      ...(r2PublicHost
        ? [
            {
              protocol: 'https',
              hostname: r2PublicHost,
            },
          ]
        : []),
    ],
  },
  swcMinify: true,
};

module.exports = nextConfig;
