# Índice Filtra.AI (`filtraai.com/indice`)

App Next.js separado do site principal. Gera páginas programáticas (município × segmento) a partir de
contagens agregadas do CNPJ aberto da Receita Federal. Não lê nem guarda nome, endereço, contato ou sócios.

## Rodar localmente (dados SINTÉTICOS, só para ver a interface)
    npm install
    node scripts/make-sample.mjs
    INDICE_DATA_DIR=data.sample INDICE_ALLOW_SAMPLE=1 npm run dev
Com dados sintéticos o app marca todas as páginas como `noindex` e o build de produção recusa a base.

## Dados reais
    npm run ingest            # baixa ~ dezenas de GB da Receita; use o workflow "Índice: atualizar dados"
O ingest valida o layout nas primeiras linhas e aborta se algo não bater. Cada ZIP processado é registrado em `meta.json` com nome, tipo, tamanho em bytes e SHA-256; a URL de download é registrada quando o arquivo é baixado pelo script. Para arquivos locais, o caminho da máquina não é publicado e a URL fica `null`. Esses metadados permitem identificar os artefatos processados, mas não substituem a preservação dos ZIPs nem comprovam, sozinhos, a correção dos dados. O acesso WebDAV usa o segredo `INDICE_RFB_SHARE_TOKEN` no ambiente; não grave tokens no código ou nos logs. Sem esse segredo, a ingestão remota aborta antes de qualquer download com uma mensagem explícita. A sondagem opcional do workflow também omite o token das URLs que registra. Como o ambiente de desenvolvimento não acessa o portal, a ingestão real deve ser revisada antes de publicar.

## Páginas
`/` · `/[uf]` · `/[uf]/[municipio]` · `/[uf]/[municipio]/[segmento]` · `/metodologia` · `/rankings/aberturas` · `/rankings/aberturas/[segmento]/[ano]` · `/rankings/ativos` · `/rankings/ativos/[segmento]` · `/rankings/ativos/[segmento]/[uf]` · `/sitemap-index.xml`
Só existem combinações com >= `minimoParaIndexar` ativos (padrão 10). As demais devolvem 404. Rankings de
aberturas só existem para anos fechados com pelo menos 100 aberturas no segmento e 10 municípios com
abertura no ano; o ano da competência é parcial e não gera página.

## Conteúdo e citabilidade (AEO)
- Cada página tem H1 factual, definição curta, tabelas HTML com `caption`, unidade, período e denominador,
  fonte primária linkada, data real de geração, FAQ visível, bloco de citação e JSON-LD
  (`Dataset`, `BreadcrumbList` e `FAQPage`).
- Competência, janela e data de geração vêm de `data/meta.json`; nenhuma data é inventada no código.
- O Índice delimita o universo e diz o que não mede: não é o total de empresas brasileiras, não mede
  reputação, faturamento ou qualidade, e não soma bases como Consumidor.gov.br ou avaliações do Google.
- Combinações abaixo do mínimo devolvem 404 e ficam fora do sitemap. Não há `noindex` em massa nem
  consolidação de URLs sem evidência.
- Rankings de aberturas por ano são calculados da mesma base agregada (nada é digitado no código), com
  período, geografia, segmento, fonte e data de referência explícitos. Empates dividem a posição e só
  anos fechados com dados suficientes ganham página; o ano da competência é parcial e não gera URL.
- Rankings de ativos usam o estoque de estabelecimentos com CNPJ ativo por segmento, no Brasil e por UF.
  O recorte estadual só é publicado com pelo menos 10 municípios no segmento; o nacional existe sempre que
  há município publicável. Eles não repetem a tabela de aberturas: linkam para `/rankings/aberturas`.
- Cada página de ranking abre com a resposta direta do número principal (município líder, total e
  parcela), que é o mesmo dado das tabelas e do JSON-LD `Dataset`.
- As páginas de ranking não usam JSON-LD `FAQPage`/`HowTo` para perseguir rich results que o Google já
  não oferece de forma geral; o FAQ visível continua existindo como conteúdo.
- A home revalida a cada 24 horas; as páginas de estado, município e célula são pré-geradas no build e só
  mudam em um novo deploy. A data de geração exibida é a da ingestão, não a do acesso.

## Auditoria de indexabilidade
    npm run audit:indexability
    npm run audit:indexability -- --json
Lê os mesmos dados do app, sem rede, e mostra os estratos (home, metodologia, UF, município, célula e
rankings), a cobertura por segmento e por UF, a distribuição de páginas por município, as células finas e as
listagens profundas. A saída é diagnóstico: nenhuma URL é removida ou marcada como `noindex`
automaticamente.

## Testes
    npm test
    npm run typecheck
    npm run build
    npm run test:seo
    npm run audit:indexability
`npm run build` roda `check-data.mjs` antes do Next e recusa base sintética, metadados incoerentes ou
estatísticas inconsistentes. `test:seo` sobe o build de produção em `127.0.0.1:3101` e valida canonical,
redirects, JSON-LD, datas, tabelas semânticas, 404 abaixo do mínimo e completude do sitemap. Não toca
produção.

## Medição
Publicar, enviar `https://filtraai.com/indice/sitemap-index.xml` e acompanhar o Search Console por
estrato (home, metodologia, UF, município, célula e rankings), usando a data de geração como referência. O
baseline de 26/10/2026 tinha 28.607 URLs no sitemap do Índice; após a integração dos rankings, o
snapshot de outubro/2026 tem 28.853 URLs e três URLs prioritárias com solicitação de indexação aceita,
ainda sem indexação confirmada. O Índice não mede citações em IA nem tráfego orgânico por conta própria;
não trate ausência de medição como resultado.

