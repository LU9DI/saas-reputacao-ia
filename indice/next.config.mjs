/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // O app é servido em filtraai.com/indice (rota do Cloudflare para este projeto).
  // basePath também prefixa /_next, então os assets não colidem com os do site principal.
  basePath: '/indice',
  // Convenção pública: sem barra final. /indice/ responde 308 para /indice.
  trailingSlash: false,
  // Limite do cache de páginas em memória por instância (padrão do Next: 50 MB).
  // O Índice tem ~43 mil URLs com ISR de 24h e roda em instância Free de 512 MB.
  // Medição reproduzível em docs/MEMORIA_INDICE_2026-11-04.md: com cache em disco
  // frio, 8 MB reduz o pico de RSS de 460,9 para 375,7 MiB (-18,5%) e o platô de
  // 447,1 para 374,3 MiB (-16,3%), sem regressão relevante de latência (p50 92→96 ms
  // no BR e 41→36 ms nos EUA). Não altera conteúdo, status HTTP nem revalidação:
  // as páginas continuam vindo do cache ISR em disco.
  cacheMaxMemorySize: 8 * 1024 * 1024,
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
