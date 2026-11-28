# Checklist de go-live — Filtra.AI

## 0. Pré-requisitos

- [ ] Código revisado e CI verde no commit que será publicado.
- [ ] Deploy e rollback do serviço afetado identificados.
- [ ] Nenhum segredo incluído no repositório.

## 1. Render — aplicações de produção

- [ ] Confirmar o serviço Render correto antes de publicar.
- [ ] Conferir branch, root directory, build/start commands ou publish directory.
- [ ] Confirmar variáveis de ambiente no painel seguro do Render.
- [ ] Confirmar deploy concluído e revisar logs.
- [ ] API `https://filtra-ia-api.onrender.com/api/health` responde com sucesso.
- [ ] Site público `https://filtraai.com/` responde HTTP 200.
- [ ] Frontend com runtime, painel do cliente e Filtra Admin funcionam.
- [ ] Índice e páginas de estado/município respondem corretamente.

## 2. SEO, sitemaps e robots

- [ ] `https://filtraai.com/indice/sitemap-index.xml` responde HTTP 200.
- [ ] `https://filtraai.com/indice/sitemap/0.xml` responde HTTP 200.
- [ ] `https://filtraai.com/sitemap-index.xml` responde HTTP 200 e referencia os sitemaps esperados.
- [ ] `https://filtraai.com/robots.txt` responde HTTP 200 e contém as diretivas Sitemap corretas.
- [ ] Confirmar regra de mesmo host e ausência de sitemaps obsoletos.
- [ ] Validar páginas de amostra e metadados de indexação.

## 3. Cloudflare — preservar rotas específicas

- [ ] Confirmar DNS, proxy/cache e regras relevantes.
- [ ] Verificar os Workers ligados a rotas específicas (por exemplo, sitemap, robots.txt e IndexNow, quando configurados).
- [ ] Testar as rotas após qualquer alteração na origem.
- [ ] Não remover/desativar Workers, routes ou serviços Cloudflare como parte da aposentadoria do workflow de Pages.
- [ ] Não usar `.github/workflows/deploy-cloudflare.yml` como caminho de deploy do frontend; o pipeline foi aposentado. O deploy de frontend é feito pelo Render.

## 4. Dados e segurança

- [ ] Banco PostgreSQL de produção acessível e persistente.
- [ ] Login, autorização e painel carregam os dados corretos.
- [ ] CORS restrito aos domínios necessários.
- [ ] Segredos e tokens não aparecem nos logs.

## 5. Encerramento

- [ ] Smoke tests passaram no domínio público, não apenas na URL interna do provedor.
- [ ] Registrar commit, serviços afetados, horário e resultado.
- [ ] Se houver falha, interromper novas mudanças e usar o rollback do serviço afetado.
