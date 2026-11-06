# Baseline SEO + AEO + GEO — Filtra.AI (2026-11-06)

Linha de base e plano de acompanhamento da auditoria técnica de SEO, AEO
(answer engines) e GEO (mecanismos generativos). Este documento separa
**medido**, **observado** e **hipótese** e não declara conclusão a partir de
pontuação de ferramenta.

## Escopo e limitações

- Auditoria de código e de produção feita em 2026-11-06 a partir do commit
  `61e0df5b24f3b003fb23142d744cf056ba083fb2` (merge do PR #199) na branch `main`.
- Não houve acesso ao Search Console, GA4, Bing Webmaster Tools nem ao painel do
  Render nesta sessão. Os números de GSC abaixo vêm do export de
  2026-10-19 já registrado em `docs/SEO_GOOGLE_SEARCH_CONSOLE_2026-10-19.md`.
- Não há medição de citação em IA. A seção de GEO propõe um método reproduzível;
  qualquer número de citação só vale depois de executado e datado.

## Arquitetura de produção confirmada (medido)

Verificado por cabeçalhos HTTP e rotas públicas em 2026-11-06:

| Camada | Provedor | Evidência |
| --- | --- | --- |
| Site principal `filtraai.com` | Render (runtime do frontend) | `x-render-origin-server: Render`, `x-filtra-failover-origin: render-frontend-runtime`, `rndr-id` |
| `/robots.txt` e `/sitemap.xml` | Cloudflare Worker → Vercel (origem canônica) | `infra/cloudflare/README.md`, `SEO_INDEXING_RUNBOOK.md` |
| `/indice` (43.920 URLs) | Render, serviço separado | `x-indice-origem` |
| API | Render | `x-render-origin-server: Render` |
| Banco | Supabase ou Neon | `.github/workflows/README.md` |

Vercel **não** serve o site principal; é a origem canônica de `robots.txt` e
`sitemap.xml` consumida pelo Worker de rota exata.

## Inventário técnico (medido em 2026-11-06)

- `/sitemap.xml`: **107 URLs**, todas com resposta `200`, canonical próprio e
  `lastmod` real (85 entradas).
- `/sitemap-index.xml`: índice central com o leaf principal + 5 shards do Índice.
- Índice: **43.920 URLs** (28.853 BR + 15.067 US); 20/20 respostas `200` por shard.
- `robots.txt`: permite `*`, bloqueia apenas `/api/`, declara o índice central e
  os três sitemaps. Libera OAI-SearchBot, ChatGPT-User, GPTBot, PerplexityBot,
  Perplexity-User, ClaudeBot, Claude-SearchBot, Claude-User, Google-Extended,
  Applebot-Extended, CCBot, meta-externalagent, Amazonbot, DuckAssistBot,
  MistralAI-User.
- Arquivos de referência para IA: `/llms.txt`, `/llms-full.txt`, `llms-en/es/zh.txt`
  e `/indice/llms.txt` (todos `200`; 134 links do `llms.txt` validados).
- Dados estruturados por URL (amostra das 107 URLs): `Organization`, `WebSite` e
  `SoftwareApplication` em 107/107; `BreadcrumbList` em 100; `WebPage` em 85;
  `FAQPage` em 66; `BlogPosting` em 31.
- `Organization` com `legalName` (Filtra Ai Tecnologia LTDA), CNPJ
  `69.113.166/0001-10`, `knowsAbout` e `disambiguatingDescription`.
- HTML inicial com `lang` correto (`pt-BR`, `en`, `es`, `zh`); `x-default`
  presente; `zh` fora de `hreflang` e do sitemap (noindex).
- Cache: HTML `s-maxage=300` + `stale-while-revalidate`; `/_next/static` imutável.

## Baseline de desempenho (medido, export GSC de 2026-10-19)

Amostra pequena e recente; não permite afirmar tendência nem causalidade.

- Brasil: 47 impressões, 0 cliques, posição média 40,53.
- Portugal: 29 impressões, 0 cliques, posição média 56,76.
- Computador: 83 impressões, 2 cliques, posição média 42,88.
- Celular: 33 impressões, 0 cliques, posição média 47,76.
- Consulta “gestão de reputação online”: 18 impressões, 0 cliques, posição 82,33.
- Página `/blog/gestao-reputacao-online-guia`: 32 impressões, 0 cliques, posição 76,25.
- Página inicial: 30 impressões, 0 cliques, posição média 3,67 (revisar consultas
  associadas antes de atribuir a CTR a palavra-chave relevante).
- Indexação (último ponto 2026-10-11): 42 URLs indexadas e 90 não indexadas; 80
  “detectadas, mas não indexadas”.

## Achados desta auditoria e respectivas evidências

### P1 — Dados estruturados prometiam escopo não suportado (GEO/AEO)

- **Homepage**: o `description` do nó `WebPage` em JSON-LD dizia
  *“Monitore avaliações Google … melhore respostas …”*, contradizendo o escopo
  real do produto (o Filtra.AI organiza o feedback que a empresa coleta; não
  importa nem monitora reviews públicos do Google) já fixado no PR #191, na
  página `/avaliacoes-google` e no `llms.txt`. Dados estruturados são fonte
  primária para mecanismos generativos.
- **`/turismo`**: meta description, Open Graph e Twitter prometiam *“Monitore
  avaliações e feedback …”*.
- **`/gestao-de-reputacao-online`**: Twitter description prometia *“Monitore
  avaliações …”*.
- **Lacuna de guardrail**: `frontend/scripts/audit-meta-descriptions.mjs`
  verificava apenas `<title>` e `<meta name="description">`. Violações em
  `og:description`, `twitter:description` e JSON-LD passavam pelo CI.

### P2 — Cobertura AEO da página de entidade

- **`/filtra-ai`**: página principal de entidade/marca, com seções em formato de
  pergunta (“O que é a Filtra.AI?”, “Para quem é a Filtra.AI?”), mas sem
  `FAQPage`, apesar de o site já usar o padrão em 66 páginas.

### Observado, não corrigido (P2/P3)

- 22 páginas indexáveis sem nó `WebPage` (artigos traduzidos, índices de blog,
  `/calculadora-nota-google`, `/auditoria-gratuita`, `/planos`, `/termos`,
  `/privacidade` e equivalentes `en/es`). Baixo risco, escopo amplo.
- `Organization` sem `sameAs`: não há perfis públicos oficiais verificáveis no
  repositório. Só adicionar `sameAs` com perfis reais confirmados.
- Títulos com sufixo de marca `· Filtra.AI` ultrapassam 60 caracteres em várias
  páginas. O sufixo é intencional (template do layout raiz); não remover sem
  medir CTR. Monitorar.

## Correções implementadas nesta PR

1. Homepage: `description` do `WebPage` em JSON-LD alinhado ao escopo real,
   incluindo a negativa explícita de monitoramento/importação.
2. `/turismo`: meta, Open Graph e Twitter sem promessa de monitoramento.
3. `/gestao-de-reputacao-online`: Twitter description sem promessa de monitoramento.
4. Textos de contexto em `/filtra-ai`, `/restaurantes` e no `SeoLanding`
   deixaram de prometer monitoramento de avaliações.
5. `audit-meta-descriptions.mjs`: guardrail ampliado para `og:description`,
   `twitter:description` e `description` de JSON-LD, com padrões novos para
   “Monitore avaliações (do Google) e feedback” e “melhore respostas”.
6. `/filtra-ai`: seção visível “Perguntas frequentes” + `FAQPage`, com respostas
   alinhadas ao escopo real (inclui a pergunta *“A Filtra.AI importa ou monitora
   avaliações do Google automaticamente?”*).

## GEO — método reproduzível de menção/citação em IA (a executar)

Não há métrica de citação inventada. Para cada janela (14/28/60 dias):

1. Fixar um conjunto de prompts em PT, EN e ES cobrindo: o que é gestão de
   reputação online; como responder a avaliação negativa; como melhorar a
   reputação no Google; como coletar feedback; como monitorar múltiplas
   unidades; softwares de gestão de reputação; “Filtra.AI”.
2. Executar cada prompt uma vez por engine: ChatGPT Search, Google AI Overviews /
   AI Mode, Gemini, Perplexity, Bing Copilot.
3. Registrar, por prompt e engine: data, engine, se a marca foi citada, se uma
   URL oficial foi citada, quais fontes foram usadas e se a descrição está
   correta.
4. Guardar a captura (texto e, quando possível, imagem) como evidência. Sem
   captura, o registro é tratado como observação, não como métrica.
5. Comparar entre janelas a **taxa de citação** e a **precisão da descrição**,
   nunca apenas a presença.

## Plano de acompanhamento

### 14 dias (2026-11-20)

- Contar impressões, cliques, CTR e posição por URL e por consulta no GSC,
  comparando com 2026-10-19 (janela de 28 dias).
- Verificar indexação/recrawl de `/filtra-ai`, `/turismo`,
  `/gestao-de-reputacao-online` e da homepage após o deploy.
- Rodar a primeira medição de citação em IA nos 5 engines.
- Confirmar que produção serve o novo `description` do JSON-LD.

### 28 dias (2026-12-04)

- Comparar tráfego/conversões orgânicas no GA4, incluindo sessões de referrers
  de assistentes de IA, quando identificáveis.
- Revisar CTR da homepage (baseline: posição 3,67 com 0 cliques em 30 impressões).
- Decidir se vale cobrir as 22 páginas sem `WebPage` e revisar títulos >60
  caracteres com base em dados, não em suposição.

### 60 dias (2027-01-05)

- Avaliar se a taxa de citação em IA e a precisão da descrição melhoraram.
- Reavaliar o guardrail: adicionar padrões novos se surgirem outras promessas de
  escopo.
- Confirmar que nenhuma regressão de canonical/redirect/sitemap ocorreu.

## Riscos residuais

- Amostra de GSC pequena; mudanças de metadados não produzem efeito imediato.
- Sem acesso ao GSC/GA4 nesta sessão, o acompanhamento depende de acesso
  autorizado.
- Citações em IA não são controláveis pelo site; só a clareza da entidade, a
  consistência e a qualidade do conteúdo são acionáveis.
