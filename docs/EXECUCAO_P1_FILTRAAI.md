# Execução P1 — Links internos do Filtra.AI

**Data:** 2026-11-08  
**Repositório:** `LU9DI/saas-reputacao-ia`  
**Base:** `main` em `9be7edaba9a4af2107a480a476247ff9f5cacf32`  
**Branch isolada:** `seo/p1-links-contextuais-2026-11-08`

## Alterações aplicadas

1. **P1-1 — Navegação institucional:** adicionado link para `/indice` no cabeçalho efetivamente utilizado pela home (`frontend/src/app/preview/page.tsx`). A inspeção do código mostrou que `frontend/src/app/page.tsx` delega a renderização para `PreviewLanding`; por isso, o cabeçalho foi alterado no componente real, não no layout global.
2. **P1-2 — Home → ranking nacional:** adicionado link contextual para `/indice/rankings/ativos/restaurantes` na grade de conteúdo da home, com textos localizados para PT, EN, ES e ZH.
3. **P1-3 — Guia de reputação → ranking nacional:** adicionado link contextual para o ranking nacional de restaurantes.
4. **P1-4 — Guia de SEO local → célula de São Paulo:** adicionado link para `/indice/sp/sao-paulo/restaurantes`.
5. **P1-5 — Guia de QR Code → ranking nacional:** adicionado link para o ranking nacional, preservando o link existente para feedback privado.
6. **P1-6 — Respostas negativas → ranking RJ:** adicionado link para `/indice/rankings/ativos/restaurantes/rj`.

## Regressões protegidas

- Os quatro links atribuídos ao PR #199 foram verificados no código da branch e continuam presentes:
  - guia de reputação → respostas negativas;
  - guia de reputação → artigo de QR Code;
  - artigo de QR Code → feedback de clientes;
  - artigo de avaliação 1 estrela → feedback de clientes.
- A árvore do repositório contém as rotas dinâmicas de ranking nacional, ranking estadual e célula município/segmento.
- Nenhum arquivo de sitemap, canonical, robots, noindex, DNS, Cloudflare, Render ou Supabase foi alterado.
- Nenhuma URL foi removida ou reclassificada; nenhum dado das 43.920 URLs foi alterado.

## P1-8 — self-links

**Não aplicado nesta etapa.** A varredura dos 19 arquivos de página em `main` não encontrou autorreferências literais em seus próprios `href`. Foi encontrada uma ligação fixa no componente compartilhado `BlogArticle.tsx` para o guia de reputação, o que gera autorreferência nesse guia específico e link de navegação nos demais artigos. A alegação de self-link nos 19 artigos depende da confirmação no HTML de produção; não removi o link compartilhado sem comprovação, para não eliminar links úteis de outros artigos.

## Testes adicionados e validação

- Adicionado `frontend/scripts/test-p1-internal-links.mjs`, com verificações para P1-1 a P1-6 e regressão dos quatro links do PR #199.
- Adicionado comando `npm run test:seo:p1-links` em `frontend/package.json`.
- Asserções estáticas equivalentes foram executadas contra os arquivos obtidos da branch: **10/10 verificações de links e preservação passaram**; as três rotas dinâmicas esperadas também foram encontradas na árvore do repositório.
- **O script Node ainda não foi executado em ambiente local com dependências do projeto.** A tentativa de clonar a branch para executar o teste falhou por indisponibilidade de resolução DNS para `github.com` no ambiente de execução; portanto, não declaro o teste automatizado como executado. O check de status `Vercel` do HEAD `38e909e2722b76b5659ec7f4db5a240bb55d4421` retornou `success`; isso é um status de integração, não substitui a execução local do script. Os logs detalhados de build não foram inspecionados.
- O preview Vercel associado ao código de aplicação no SHA `56b8cc738cb5e8477f2aff5479da75cafa25dd0b` foi reportado como pronto na verificação anterior. A inspeção de produção abaixo foi feita separadamente no domínio canônico.
- **Validação em produção concluída para os quatro destinos P1** por captura ao vivo, sem erros: `https://filtraai.com/indice`, `/indice/rankings/ativos/restaurantes`, `/indice/sp/sao-paulo/restaurantes` e `/indice/rankings/ativos/restaurantes/rj`. Todos retornaram conteúdo; em todos, `canonical` corresponde exatamente à URL solicitada e `robots` é `index, follow`. Isso confirma que os destinos existem, são acessíveis e estão elegíveis para indexação. Não significa que as novas ligações já estejam publicadas em produção, pois a branch não foi mesclada.

## Estado final

- Alterações isoladas na branch `seo/p1-links-contextuais-2026-11-08`, baseada diretamente em `main`.
- A branch está 12 commits à frente de `main` e zero atrás; HEAD `a3a532289b807016210f29e1c4e44768dba76189`.
- PR de revisão #201 aberto em rascunho: https://github.com/LU9DI/saas-reputacao-ia/pull/201. O rascunho deixa explícitos os testes pendentes.
- **Nenhum merge foi feito e nenhum deploy de produção foi solicitado ou executado.**
- `main` permanece intocada.
