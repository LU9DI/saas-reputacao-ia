/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(process.env.CLOUDFLARE_PAGES === '1'
    ? { output: 'export', images: { unoptimized: true } }
    : {}),
  poweredByHeader: false,

  // Builds determinísticos: fixa a raiz do Turbopack nesta pasta
  // (a raiz do repo tem outro lockfile e o Next pede desambiguação).
  turbopack: {
    root: import.meta.dirname,
  },

  // Production frontend is a static export for Cloudflare Pages.

  typescript: {
    ignoreBuildErrors: true,
  },

  // In development, proxy /api to the local backend.
  // In production, the browser calls the Render API directly via NEXT_PUBLIC_API_URL.
  async rewrites() {
    if (process.env.NODE_ENV === 'production') return [];
    const backend = (process.env.BACKEND_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
    ];
  },

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
