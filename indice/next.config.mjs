/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // O app é servido em filtraai.com/indice (rota do Cloudflare para este projeto).
  // basePath também prefixa /_next, então os assets não colidem com os do site principal.
  basePath: '/indice',
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
