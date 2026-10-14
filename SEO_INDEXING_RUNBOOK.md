# Filtra.AI — Indexação orgânica

Este procedimento acompanha uma publicação grande do frontend. Não é necessário criar um deploy para cada URL.

## Antes da publicação

1. Confirmar CI verde, incluindo o build em modo `CLOUDFLARE_PAGES=1` e `npm run seo:audit`.
2. Confirmar que o sitemap contém apenas URLs públicas, HTTPS, do host canônico `filtraai.com`.
3. Confirmar que rotas de aplicação e conversão estão fora do sitemap e emitem `noindex, nofollow`.
4. Não alterar o backend, DNS ou variáveis de API como parte de uma entrega de indexação sem validar o endpoint canônico separadamente.

## Após a publicação grande

1. Abrir `https://filtraai.com/sitemap.xml` e `https://filtraai.com/robots.txt`; confirmar HTTP 200 e conteúdo atualizado.
2. No Google Search Console, selecionar a propriedade de domínio `filtraai.com`, enviar `https://filtraai.com/sitemap.xml` e verificar o estado do processamento.
3. Usar a inspeção de URL do Search Console nas páginas prioritárias e solicitar indexação quando estiverem acessíveis, canônicas e com conteúdo final.
4. No Bing Webmaster Tools, verificar o domínio e confirmar a leitura do sitemap. O workflow envia as URLs do sitemap via IndexNow depois de publicar.
5. Após alguns dias, analisar páginas indexadas, exclusões, canonicals escolhidos pelo Google, consultas e cliques; corrigir causas técnicas antes de reenviar solicitações.

## Ordem de prioridade

- Núcleo: página inicial, `/filtra-ai`, `/gestao-de-reputacao-online`, `/avaliacoes-google`, `/reputacao-google`, `/analise-de-avaliacoes-com-ia`, `/feedback-de-clientes`, `/como-melhorar-avaliacoes-google`, `/monitoramento-reputacao-online` e `/gestao-de-feedback`.
- Depois: páginas de auditoria gratuita e segmentos empresariais; em seguida, artigos relacionados e as versões traduzidas.
- A estratégia busca competitividade para Top 3/Top 10 nas consultas adequadas, sem prometer Top 1 nem indexação imediata.

## Limite de automação

O workflow pode validar o artefato e notificar mecanismos compatíveis com IndexNow. A submissão e a inspeção no Google Search Console exigem acesso autorizado à propriedade; não devem ser simuladas por CI nem tratadas como concluídas sem confirmação no próprio Search Console.
