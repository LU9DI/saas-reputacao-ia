# Google Search Console — integração direta

O Filtra.AI usa OAuth 2.0 diretamente com a API oficial do Google Search Console. Não depende do GSC Wizard.

## 1. Google Cloud

No Google Cloud Console:

1. Crie/seleciona um projeto.
2. Ative a **Google Search Console API**.
3. Configure a tela de consentimento OAuth.
4. Crie uma credencial **OAuth client ID → Web application**.
5. Adicione exatamente esta URI de redirecionamento:

```
https://filtraai.com/api/integrations/google-search-console/callback
```

Para desenvolvimento local:

```
http://localhost:5000/api/integrations/google-search-console/callback
```

O escopo solicitado é somente leitura:

```
https://www.googleapis.com/auth/webmasters.readonly
```

## 2. Variáveis do backend

Configure no Render (ou no ambiente da API):

```env
GOOGLE_SEARCH_CONSOLE_CLIENT_ID=...
GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET=...
GOOGLE_SEARCH_CONSOLE_REDIRECT_URI=https://filtraai.com/api/integrations/google-search-console/callback
PUBLIC_APP_URL=https://filtraai.com
GSC_TOKEN_ENCRYPTION_KEY=<segredo aleatório forte e estável>
GSC_OAUTH_STATE_SECRET=<segredo aleatório forte e estável>
```

Não coloque `GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET`, `GSC_TOKEN_ENCRYPTION_KEY` ou `GSC_OAUTH_STATE_SECRET` no frontend.

## 3. Fluxo

- Usuário autenticado inicia o OAuth.
- O backend cria um estado assinado, com expiração e nonce.
- Google autentica o usuário e retorna o código ao backend.
- O backend troca o código por refresh token.
- O refresh token é cifrado com AES-256-GCM e armazenado isoladamente por `empresa_id`.
- O navegador nunca recebe o refresh token.
- O backend lista as propriedades disponíveis e permite selecionar uma.
- Consultas usam `webmasters.readonly` e permanecem tenant-scoped.
- Desconexão revoga o token no Google quando possível e remove a credencial local.
- Eventos de conexão, seleção e desconexão entram no audit log.

## 4. Endpoints

```
GET    /api/integrations/google-search-console/status
GET    /api/integrations/google-search-console/connect
GET    /api/integrations/google-search-console/callback
GET    /api/integrations/google-search-console/sites
POST   /api/integrations/google-search-console/site
POST   /api/integrations/google-search-console/query
DELETE /api/integrations/google-search-console
```

O DOT também recebe a ferramenta somente leitura `search-console.query`, protegida pela permissão `seo.read`.

## 5. Interface

A página de conexão fica em:

```
/integracoes/google-search-console
```

Depois da conexão, o usuário pode selecionar uma propriedade e consultar consultas/páginas diretamente pelo Filtra.AI.
