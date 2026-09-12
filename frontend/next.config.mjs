/** @type {import('next').NextConfig} */
const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Proxy para chamadas relativas /api/*.
  // Em produção, usa NEXT_PUBLIC_API_URL (Render), nunca localhost.
  // Em desenvolvimento, o script do frontend define NEXT_PUBLIC_API_URL
  // para o backend local.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },

  // Headers úteis para PWA / SW.
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },
};

export default nextConfig;
