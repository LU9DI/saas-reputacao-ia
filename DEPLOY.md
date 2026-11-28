# Deploy — Filtra.AI

## Arquitetura de produção (atual)

O **Render é a plataforma de execução/publicação das aplicações Filtra.AI**. O Cloudflare continua na camada de DNS/borda e pode manter Workers específicos que atendem rotas dedicadas. Não use o workflow de Cloudflare Pages deste repositório como caminho de deploy do frontend: ele foi aposentado para evitar dois pipelines concorrentes.

| Componente | Plataforma / serviço | Responsabilidade |
| --- | --- | --- |
| Frontend estático | Render Static Site (serviço existente, se aplicável) | Publicar o artefato estático do frontend |
| Frontend com runtime | Render Web Service (serviço existente) | Rotas que precisam de Next.js no servidor |
| Índice empresarial | Render Web Service `filtra-indice` | Páginas do índice e sitemaps do índice |
| API | Render Web Service `filtra-ia-api` | Backend HTTP e regras de negócio |
| DNS / borda | Cloudflare | DNS, proteção, cache e roteamento |
| Workers específicos | Cloudflare Workers | Somente rotas explicitamente configuradas, como workers de sitemap/robots/IndexNow quando ativos |
| Banco de dados | Supabase/PostgreSQL conforme configuração do ambiente | Persistência gerenciada |

Os serviços Render existentes não devem ser apagados apenas por parecerem duplicados. Antes de consolidar serviços, verificar domínio, rotas, build/publish path, logs, healthchecks e dependências. O frontend estático, o frontend com runtime e o índice podem ter funções distintas.

## 1. Deploy no Render

Para cada serviço existente, preserve as configurações atuais até validar a função e as rotas:

1. Confirme repositório, branch, root directory, build command, start command ou publish directory.
2. Configure as variáveis necessárias no painel do Render (nunca commite segredos).
3. Use deploy automático do Render apenas para o serviço correspondente e configure path filters quando disponíveis para evitar builds sem relação com o serviço.
4. Verifique o estado do deploy e os logs antes de considerar a publicação concluída.

URLs atualmente conhecidas:
- API: `https://filtra-ia-api.onrender.com`
- Frontend estático: `https://filtra-ai-web-cloud.onrender.com`
- Frontend com runtime: `https://filtra-ai-web-runtime.onrender.com`
- Índice: `https://filtra-indice.onrender.com`

Esses endereços de serviço não substituem a verificação dos domínios públicos.

## 2. Smoke tests após deploy

- [ ] API: `GET /api/health` responde com sucesso.
- [ ] Site público `https://filtraai.com/` responde HTTP 200.
- [ ] Índice `https://filtraai.com/indice/sitemap-index.xml` responde HTTP 200.
- [ ] Sitemap central `https://filtraai.com/sitemap-index.xml` responde HTTP 200 e aponta para os sitemaps esperados.
- [ ] `https://filtraai.com/robots.txt` responde e lista os sitemaps canônicos.
- [ ] Páginas representativas do índice e páginas de estado/município respondem corretamente.
- [ ] Login, Filtra Admin e painel do cliente funcionam.
- [ ] Workers Cloudflare de rotas específicas continuam respondendo como esperado.
- [ ] Verificar logs e erros 4xx/5xx; não inferir sucesso apenas pelo estado “Live” do provedor.

## 3. Cloudflare e Workers

Cloudflare Pages **não é o caminho de produção do frontend**. O workflow `.github/workflows/deploy-cloudflare.yml` foi removido deste repositório como pipeline de produção. Isso não remove nem desativa serviços ou Workers Cloudflare existentes.

Antes de alterar Workers, routes, DNS ou regras de cache:
- identifique a rota exata e o Worker associado;
- confirme a origem primária e o comportamento de fallback;
- teste sitemap, robots.txt e a chave IndexNow quando aplicável;
- faça deploy manual separado apenas quando a mudança exigir isso e após validar a origem Render.

## 4. Banco, CORS e segredos

- Use a URL de PostgreSQL configurada para o ambiente real; não presuma que SQLite local seja produção.
- Restrinja `APP_URL`, `FRONTEND_URL` e `CORS_ORIGINS` aos domínios legítimos.
- Mantenha tokens, credenciais e chaves exclusivamente nas configurações seguras do provedor.
- Teste autenticação, autorização e persistência após deploy.

## 5. Fluxo operacional

`push/PR → CI e revisão → merge em main → deploy Render do serviço afetado → smoke tests`.

Não dispare deploy paralelo no Cloudflare Pages. Não apague serviços Render ou Workers Cloudflare durante uma limpeza de pipeline; consolidação de infraestrutura requer auditoria e plano separado.
