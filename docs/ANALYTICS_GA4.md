# Google Analytics 4 — Filtra.AI (filtraai.com)

Documento operacional da instrumentação. Código-fonte:

| Arquivo | Papel |
|---|---|
| `frontend/src/app/lib/analyticsPolicy.ts` | Política pura: allowlist de rotas, catálogo de eventos, filtro de dados pessoais. Testado por `scripts/test-analytics.mjs`. |
| `frontend/src/app/lib/analytics.ts` | Runtime: consentimento, carregamento idempotente do `gtag.js`, dedupe de `page_view`/eventos. |
| `frontend/src/app/components/GoogleAnalytics.tsx` | Montagem no layout raiz, `page_view` em mudança de rota (SPA) e delegação de `contact`/`cta_click`. |
| `frontend/src/app/components/CookieConsent.tsx` | Banner de consentimento (aceitar/recusar). |
| `frontend/src/app/components/CookiePreferencesButton.tsx` | Reabertura do banner na Política de Privacidade. |

## 1. Propriedade GA4

| Campo | Valor |
|---|---|
| Conta | `414880880` |
| Propriedade | `562518631` |
| Fluxo de dados web | `https://filtraai.com` |
| Measurement ID | **PENDENTE** — informar o valor `G-XXXXXXXXXX` do fluxo web (GA4 › Administrador › Fluxos de dados) |

A URL do painel com os IDs acima foi fornecida pelo responsável
(`analytics.google.com/analytics/web/#/a414880880p562518631/admin/streams/table`).
O **Measurement ID não é derivável** do account/property ID: precisa ser lido no
fluxo de dados ou na API Admin do GA4. Nenhum ID foi inventado.

### Como ativar

1. Copie o Measurement ID do fluxo web (`G-` seguido de letras/dígitos).
2. Defina `NEXT_PUBLIC_GA_MEASUREMENT_ID` **no ambiente de build**:
   - Cloudflare Pages (produção estática): Settings › Environment variables › Production.
   - Render (runtime Next usado pelo failover): Environment › `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
   - Vercel (fallback): Project › Settings › Environment Variables.
3. Rode o build novamente (a variável é inlined em build time).
4. Valide conforme a seção 7.

Sem a variável o comportamento é seguro: `isAnalyticsConfigured()` é `false`, o
banner não aparece e nada é enviado.

## 2. Consentimento e privacidade

- A tag **não** é carregada antes de consentimento explícito. Não há `gtag.js`
  no HTML inicial: ele é injetado por `loadAnalytics()` somente após o aceite.
## 3. Eventos instrumentados

| Evento | Conversão? | Disparado em | Parâmetros |
|---|---|---|---|
| `page_view` | não | Toda rota pública, uma vez por rota (manual, `send_page_view: false`) | `page_location`, `page_path` |
| `sign_up` | **sim** | `/teste` e `/preview/teste`: resposta OK de `POST /api/lead` | `method`, `plan` |
| `login` | não | `/login`: login aceito pelo backend | `method` |
| `generate_lead` | **sim** | `/auditoria-gratuita`: `lead_id` retornado por `/api/public/acquisition/consent` | `form`, `locale` |
| `form_submit` | não | `/auditoria-gratuita`: diagnóstico concluído com OK do backend | `form`, `locale` |
| `report_generated` | **sim** | Diagnóstico gratuito concluído (`tool=free_audit`) | `tool`, `plan` |
| `purchase` | **sim** | `MpTransparentCheckout` / `PixCheckoutModal`: status `approved` do Mercado Pago | `plan`, `value`, `currency`, `method` |
| `contact` | **sim** | Clique em `mailto:`, `tel:`, `wa.me`, `t.me` (delegação global) | `channel` |
| `cta_click` | não | Clique em `[data-ga-cta]` (header, hero, footer, seção Dot) | `cta`, `placement` |

**Eventos-chave a marcar no GA4** (Administrador › Eventos › Eventos-chave
ou "Marcar como conversão"): `sign_up`, `generate_lead`, `purchase`,
`report_generated`, `contact`.

`purchase` **não** é disparado em `/pagamento-ok`: aquela rota apenas recebe o
redirecionamento do Stripe e não confirma a cobrança no backend. Só contamos
compra onde existe status aprovado do provedor (Mercado Pago, cartão ou Pix).

### Regras aplicadas

1. Conversão só depois da confirmação do backend/provedor — nunca no clique.
2. `cta_click` e `form_submit` não são conversões.
3. Dedupe de 1,5 s por `evento + parâmetros + rota` (protege contra duplo
   render, StrictMode e botão clicado duas vezes).

## 4. Páginas medidas x páginas privadas

`page_view` é bloqueado em: `/admin`, `/painel`, `/dot`, `/login`,
`/recuperar-senha`, `/pagamento-ok`, `/avaliacao`, `/widget`, `/api`, `/preview`.

Em caminhos privados, apenas `login`, `sign_up`, `purchase`, `report_generated`
e `cta_click` podem sair — sempre sem identificadores.

## 5. Tráfego humano x automatizado

GA4 é uma fonte de mensuração comportamental, **não** um detector de bots. A
estratégia é medir e segmentar, não "limpar" números:

- **Métricas de engajamento**: Usuários ativos, Sessões, Sessões engajadas e
  Engajamento médio (o GA4 já não conta sessões sem interação como engajadas;
  `bounce` não existe mais).
- **Aquisição**: Origem/mídia da sessão separa `organic` (Search Console via
  Windsor.ai), `direct`, `referral` e `social`. Usar *Explorar › Aquisição*.
- **Crawlers conhecidos**: não executam JavaScript na maioria dos casos
  (Bingbot, GPTBot, CCBot); Googlebot/Applebot executam. Um hit de crawler que
  executa JS aparece como sessão com 0 s de engajamento e origem `direct`.
- **Requisições automatizadas**: segmento operacional "provável bot" =
  `Sessões engajadas = 0` **e** `Duração do engajamento < 3 s`. Tratar como
  sinal de qualidade, não como verdade absoluta.
- **Não enviamos tráfego artificial** ao GA4 (nenhum uso de Measurement
  Protocol com dados sintéticos) — métricas não são infladas por construção.
- **Validação cruzada**: `sessions` do GA4 x cliques do Search Console
  (Windsor.ai) x hits de borda no Cloudflare. Divergência é esperada
  (consentimento recusado, adblock, ITP, cache).

- Decisão persistida em `localStorage.filtra_consent_v1` (`granted`/`denied`).
- Consent Mode v2 é declarado com `ad_storage`, `ad_user_data` e
  `ad_personalization` sempre `denied` (não fazemos publicidade) e
## 6. SEO — estado auditado (05/11/2026, neste HEAD)

- `next build` (export estático) + `seo:audit`: canônicas self-referencing,
  `robots.txt` liberando `/` e bloqueando `/api/`, sitemap central em
  `/sitemap-index.xml` cobrindo `/sitemap.xml` + 5 shards do Índice.
- `/`, `/avaliacoes-google`, `/en`, `/indice` continuam indexáveis; `/zh/*` e as
  rotas privadas continuam `noindex`.
- `www.filtraai.com` responde `301 → https://filtraai.com/…` e `http://` →
  `https://` (verificado em produção em 05/11/2026).
- Nenhuma página foi removida nem desindexada nesta entrega.

## 7. Como validar no GA4 (tempo real)

1. Abra `https://filtraai.com/` em janela anônima.
2. O banner "Cookies de medição" aparece → clique em **Aceitar**.
3. DevTools › Network › filtre por `gtag/js`: deve haver **exatamente 1**
   requisição `https://www.googletagmanager.com/gtag/js?id=G-…`.
4. Filtre por `collect`: cada navegação SPA gera **1** requisição com
   `en=page_view` e `dl` no domínio apex, sem query string.
5. GA4 › Relatórios › **Tempo real**: 1 usuário ativo e o `page_view` no caminho
   correto.
6. GA4 › Administrador › **DebugView** (Tag Assistant): confira `page_view` e
   `cta_click`.
7. Conversões: `/auditoria-gratuita` (formulário completo) → `form_submit`,
   `report_generated` e `generate_lead` quando o e-mail/consentimento é
   registrado; `/teste` → `sign_up` após criar a conta.
8. Verificação automatizada local:
   `E2E_GA_ID=G-… npm run build` e `npx playwright test e2e/analytics.spec.ts`.

> Validação técnica (tag carregada, 1 requisição, eventos no `dataLayer`) é
> diferente de validação de produto (dados aparecendo no painel do GA4). A
> segunda depende do Measurement ID configurado no build de produção.

## 8. Testes

```bash
cd frontend
npm run test:analytics   # política pura: rotas, allowlist, PII, dedupe (11 testes)
npm run lint
npm run build            # export estático + guards de SEO/idioma/meta
npx playwright test e2e/analytics.spec.ts   # com E2E_GA_ID e build correspondente
```

`e2e/analytics.spec.ts` (4 testes) cobre: nenhuma requisição ao Google antes do
consentimento, `gtag.js` carregado uma única vez, 1 `page_view` por rota (inclusive
em navegação SPA), `send_page_view: false`, recusa mantendo a medição desligada,
`cta_click`/`contact` com os parâmetros esperados e ausência de e-mail/CPF no
`dataLayer`. O teste faz *stub* de `gtag.js` — nada é enviado ao Google.

## 9. Pendências e o que depende de acesso externo

| Item | Situação | Dependência |
|---|---|---|
| Measurement ID `G-…` | **pendente** | Precisa ser lido no fluxo de dados do GA4 (ou via API Admin, conexão `google_analytics` com OAuth ativo) |
| Dados aparecendo no GA4 | **não validado** | Só é possível após configurar o ID no build de produção e receber tráfego real |
| Marcar eventos-chave no GA4 | **pendente** | Ação manual no painel (Administrador › Eventos) |
| App `/indice` (43.920 URLs) | **fora desta entrega** | É um deploy Next separado (`indice/`); precisa da mesma política de consentimento e de um segundo build com o ID |
| PageSpeed/PSI pós-mudança | **não executado** | A API pública do PSI retornou `429 RESOURCE_EXHAUSTED` (quota diária anônima esgotada) e não há deploy de produção autorizado |
| Validação Windsor/Supermetrics/Ahrefs | **não executado** | Dependem de contas ativas nessas ferramentas; ausência de acesso não é evidência de ausência de problema |

Impacto de performance esperado: a tag **não** entra no HTML e **não** carrega
antes do consentimento, então LCP/TBT da primeira visita não são afetados. O custo
é o módulo de analytics no bundle do layout (≈4 KB antes de gzip) mais o banner
(só renderiza após hidratação, quando há ID configurado e nenhuma decisão salva).

  `analytics_storage` liberado apenas após o aceite.
- Recusar (ou revogar) remove cookies `_ga*`/`_gid` do domínio.
- Revogação disponível em `/privacidade` → botão "Preferências de cookies".
- `anonymize_ip`, `allow_google_signals: false`, `allow_ad_personalization_signals: false`.
- Nenhum parâmetro de evento carrega e-mail, telefone, nome, empresa, CPF/CNPJ,
  token, UUID, hash, conteúdo de formulário ou texto de avaliação: a allowlist de
  `analyticsPolicy.ts` descarta valores com esse padrão (ver testes).
