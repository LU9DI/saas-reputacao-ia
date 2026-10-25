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
O ingest valida o layout nas primeiras linhas e aborta se algo não bater. **Nunca foi executado contra a base real
pelo autor** (o ambiente de desenvolvimento não acessa o portal): a primeira execução deve ser revisada.

## Páginas
`/` · `/[uf]` · `/[uf]/[municipio]` · `/[uf]/[municipio]/[segmento]` · `/metodologia` · `/sitemap-index.xml`
Só existem combinações com >= `minimoParaIndexar` ativos (padrão 10). As demais devolvem 404.
