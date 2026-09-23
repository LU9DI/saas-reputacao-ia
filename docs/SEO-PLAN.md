# Filtra.AI — Plano SEO (páginas pilar + conteúdo)

## 1. Cinco páginas pilar

### P1 — `/como-funciona`
- **Title:** Como funciona o Filtra.AI | Filtro de avaliações Google
- **H1:** Como o Filtra.AI protege sua reputação no Google
- **Seções:** Canal (QR/link) → Nota 1–5 → 4–5★ Google → 1–3★ painel + IA → Relatório → Trial 7 dias
- **CTA:** Começar teste gratuito
- **KW:** como funciona gestão avaliações Google, filtro review

### P2 — `/restaurantes`
- **Title:** Avaliações Google para restaurantes | Filtra.AI
- **H1:** Reputação no Google para restaurantes e food service
- **Seções:** Dor (1★ mata mês de ads) · QR na mesa · Velocity de reviews · Case hipotético · Planos
- **CTA:** Trial 7 dias
- **KW:** avaliações Google restaurante, reputação restaurante

### P3 — `/clinicas`
- **Title:** Gestão de avaliações Google para clínicas | Filtra.AI
- **H1:** Clínicas: controle a reputação antes do Google
- **Seções:** Confiança do paciente · Feedback privado · Conformidade/tom · Multi-unidade
- **CTA:** Trial 7 dias
- **KW:** avaliações Google clínica, reputação clínica

### P4 — `/agencias`
- **Title:** Filtra.AI para agências de marketing e SEO local
- **H1:** Ofereça reputação operacional aos seus clientes
- **Seções:** White-label mindset · Ticket extra · Onboarding rápido · Parceria
- **CTA:** Falar / trial agência
- **KW:** ferramenta reputação para agências, SEO local reviews tool

### P5 — `/pedir-estrela-vs-filtrar`
- **Title:** Pedir estrela no Google não basta | Filtre antes de publicar
- **H1:** Pedir avaliação ≠ controlar reputação
- **Seções:** Problema do “só peça 5★” · Risco compliance Google · Modelo 4–5 / 1–3 · FAQ
- **CTA:** Testar Filtra.AI grátis
- **KW:** como pedir avaliação Google, filtrar avaliações

---

## 2. Calendário de 8 artigos (blog)

| # | Título | Intenção | CTA |
|---|--------|----------|-----|
| 1 | Como conseguir mais avaliações no Google (sem parecer spam) | Informacional | Trial |
| 2 | Por que a velocidade de reviews importa no Google Maps em 2026 | Informacional / tendência | Trial |
| 3 | Review 1★: o que fazer nas primeiras 24 horas | Comercial / urgência | Trial |
| 4 | QR Code no balcão: fluxo que aumenta reviews 4–5★ | Transacional | Trial |
| 5 | SEO local e avaliações: o que realmente ranqueia no Local Pack | Informacional | Página restaurantes |
| 6 | Clínica e reputação online: checklist de avaliações Google | Segmento | /clinicas |
| 7 | Agência: como vender gestão de reputação como serviço recorrente | Segmento B2B | /agencias |
| 8 | Pedir estrela no WhatsApp vs filtrar no QR: comparativo honesto | Comparação | Trial |

**Ritmo sugerido:** 1 artigo / semana · interlink para pilares e home · FAQ schema quando couber.

---

## 3. Metadata global (implementado)

Atualizado em `frontend/src/app/layout.tsx`:
- Title/description orientados a **avaliações Google + trial 7 dias**
- Open Graph / Twitter
- Keywords e `lang="pt-BR"`
- `metadataBase` + canonical

## 4. Próximos passos técnicos

1. Criar rotas Next das 5 páginas pilar
2. Google Search Console + sitemap.xml
3. JSON-LD Organization + SoftwareApplication + FAQ
4. Medir trials com UTM `?utm_source=organic`
