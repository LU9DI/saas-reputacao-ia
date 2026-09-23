# Filtra.AI — Plano SEO (implementado)

## Status

| Item | Status |
|------|--------|
| Metadata global (title, OG, Twitter, keywords) | Feito (`layout.tsx`) |
| JSON-LD Organization + SoftwareApplication + FAQ | Feito (`JsonLd.tsx`) |
| sitemap.xml / robots.txt | Feito |
| 5 páginas pilar | Feito |
| Blog index + 8 artigos | Feito |
| Footer home com links SEO | Feito |

## Páginas pilar

- `/como-funciona`
- `/restaurantes`
- `/clinicas`
- `/agencias`
- `/pedir-estrela-vs-filtrar`

## Blog

- `/blog` (índice)
- `/blog/como-conseguir-avaliacoes-google`
- `/blog/velocity-reviews-google-maps-2026`
- `/blog/review-1-estrela-primeiras-24-horas`
- `/blog/qr-code-balcao-reviews`
- `/blog/seo-local-avaliacoes-local-pack`
- `/blog/clinica-checklist-avaliacoes-google`
- `/blog/agencia-vender-gestao-reputacao`
- `/blog/whatsapp-pedir-estrela-vs-filtrar-qr`

## Pós-deploy (manual)

1. Aguardar Vercel deploy em `main`
2. Google Search Console → propriedade filtraai.com
3. Enviar `https://filtraai.com/sitemap.xml`
4. Inspecionar URLs das pilares
5. Opcional: `NEXT_PUBLIC_SITE_URL=https://filtraai.com` no Vercel
