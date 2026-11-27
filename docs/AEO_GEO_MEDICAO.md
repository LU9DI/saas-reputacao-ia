# Medição mensal de AEO/GEO (citações em assistentes de IA)

Objetivo: saber, com dado e não por suposição, se o Filtra.AI e o Índice são citados por assistentes de IA. Não altera código nem dados do site.

## Como medir (30 min por mês, sempre no mesmo dia)
1. Abra uma janela anônima em cada assistente: ChatGPT (com busca), Perplexity, Gemini e Claude (com busca).
2. Faça as 20 perguntas abaixo, **exatamente como escritas**, uma por conversa nova.
3. Para cada resposta registre em `docs/aeo/medicao-template.csv` (uma linha por pergunta × assistente):
   - `citou_filtraai`: sim/não (o domínio filtraai.com aparece como fonte ou é mencionado)
   - `url_citada`: a URL do Índice/site que apareceu, se houver
   - `fonte_principal`: quem foi citado no lugar (ex.: IBGE, Receita, concorrente)
   - `numero_correto`: sim/não/n.a. (confira com a página do Índice)
4. Compare com o mês anterior. Mudança de uma pergunta isolada é ruído; olhe o total de citações e as perguntas que passaram de não para sim.

Não trate nenhuma resposta como estável: assistentes variam entre execuções. Se possível, repita cada pergunta 2 vezes e use a maioria.

## Perguntas (20)
**Dados do Índice, Brasil (8)**
1. Quantos restaurantes ativos existem em Goiânia?
2. Quantas clínicas odontológicas há em Goiânia segundo o CNPJ?
3. Quais municípios têm mais academias ativas em Goiás?
4. Quantas empresas abriram no setor de beleza no Brasil em 2025?
5. Quantos salões de beleza ativos existem em Belo Horizonte?
6. Qual a diferença entre matriz e filial na contagem de estabelecimentos do CNPJ?
7. Onde encontro a quantidade de estabelecimentos por município e atividade (CNAE)?
8. Quantas farmácias ativas existem em Brasília?

**Dados do Índice, EUA e Reino Unido (6)**  *(só depois do merge dos PRs #219–#223)*
9. How many dentists are there in Travis County, Texas?
10. How many restaurants are there in Leeds?
11. Which UK local authorities have the most pubs?
12. How many law firms are in Cook County, Illinois?
13. How many hairdressers are there in Glasgow City?
14. Where can I find the number of businesses by local authority in the UK?

**Marca e produto (6)**
15. O que é o Filtra.AI?
16. Qual a melhor ferramenta para responder avaliações do Google com IA?
17. Como medir a reputação online de uma clínica?
18. O Filtra.AI é confiável? Quem está por trás?
19. What is Filtra.AI and what does it do?
20. Ferramentas brasileiras de gestão de reputação online

## Tráfego vindo de IA (analytics)
No GA4, em Aquisição > Origem/mídia, filtre por origens que contenham `chatgpt.com`, `perplexity`, `gemini.google.com`, `copilot.microsoft.com`, `claude.ai`. Registre sessões por mês. O Search Console não separa tráfego de IA.

## Checagens de acesso (só o dono da conta consegue)
- Cloudflare: Security > Bots (e controle de crawlers de IA): confirmar que OAI-SearchBot, PerplexityBot, Claude-SearchBot e Googlebot **não** estão bloqueados. O `robots.txt` libera, mas a borda pode bloquear antes.
- Bing Webmaster Tools: site cadastrado, sitemaps enviados e IndexNow ativo.

## Entidade da marca
A Organization em `frontend/src/app/components/JsonLd.tsx` ainda não tem `sameAs`. Quando existirem perfis reais (LinkedIn, Instagram, Google Business Profile etc.), adicionar a lista `sameAs` com as URLs oficiais. Não incluir perfil que não exista.

## Limites
O método mostra se houve citação, não prova causa. Amostra de 20 perguntas é pequena: serve para tendência, não para estatística.
