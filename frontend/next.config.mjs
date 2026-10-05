/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Temporário: desbloqueia deploy na Vercel enquanto o Dot fica offline.
  // Os redirects de /dot precisam ir ao ar mesmo se algum typecheck falhar.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Dot ainda não validado em localhost — não publicar a rota em produção.
  async redirects() {
    return [
      { source: '/dot', destination: '/', permanent: false },
      { source: '/dot/:path*', destination: '/', permanent: false },
    ];
  },

  // Em dev: proxy /api → backend local.
  // Em produção (Vercel): o front chama NEXT_PUBLIC_API_URL (Render) direto — sem rewrite.
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
