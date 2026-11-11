# Análise de exportação CSV do Google Search Console

Este guia prepara a análise de CTR e posição para quando houver uma exportação autorizada do Search Console. A sessão de auditoria de 2026-11-11 não tinha ferramenta nem credencial do GSC; portanto, nenhum número de indexação ou CTR foi produzido ou estimado aqui.

## Como exportar

1. Abra a propriedade verificada de `filtraai.com` no Search Console.
2. Em **Desempenho**, selecione o período desejado (por exemplo, 28 dias) e a aba **Páginas**.
3. Use **Exportar** e escolha **CSV**. Repita para a aba **Consultas**.
4. Mantenha o arquivo fora do repositório. Exportações contêm URLs e consultas de pesquisa e não devem ser commitadas.

O CSV do GSC varia com o idioma da interface e com o separador. O analisador aceita:

- cabeçalhos em português ou inglês (`Páginas`, `Paginas`, `Page`, `Consultas`, `Query`, `Cliques`, `Clicks`, `Impressões`, `Impressions`, `CTR`, `Posição`, `Position`);
- separador `,`, `;` ou tabulação;
- BOM, CRLF e campos entre aspas com vírgula;
- decimal com vírgula quando o separador é `;`.

## Executar

    cd frontend
    npm run seo:gsc:analyze -- --file /caminho/Pages.csv --period "2026-10-01..2026-10-28"
    npm run seo:gsc:analyze -- --file /caminho/Queries.csv --format json --min-impressions 20

Opções:

| Opção | Padrão | Efeito |
|---|---:|---|
| `--file` | obrigatório | CSV exportado do GSC |
| `--format` | `md` | `md`, `json` ou `csv` |
| `--period` | vazio | rótulo do período exibido no relatório |
| `--min-impressions` | 10 | impressões mínimas para entrar nas listas |
| `--min-position` | 8 | início da faixa de "striking distance" |
| `--max-position` | 30 | fim da faixa de "striking distance" |
| `--top-ctr` | 0.02 | limite de CTR para o topo (posições 1–7) |
| `--limit` | 50 | máximo de linhas por lista |
| `--out` | — | grava a saída em arquivo |

## O que o relatório responde

- **Posições 8–30 com impressões relevantes:** páginas ou consultas que já aparecem, mas fora da primeira página. O relatório mostra impressões, cliques, CTR e posição exata do arquivo.
- **Posições 1–7 com CTR baixo:** páginas que aparecem bem, mas recebem poucos cliques. São candidatas a revisão de título, descrição e alinhamento com a intenção da consulta.
- **Impressões por tipo de página:** agrega o Índice por home, UF, município, célula, ranking e EUA, além das páginas do site.

O analisador **não** calcula "oportunidade" ou CTR esperado, não projeta cliques e não promete ganho de posição. Um CTR baixo pode refletir intenção da consulta, SERP features ou sazonalidade; a decisão exige comparar períodos e inspecionar as consultas.

## Rotina recomendada

1. Exportar Páginas e Consultas no mesmo período.
2. Rodar o analisador para cada arquivo e guardar a saída com a data.
3. Comparar duas janelas (por exemplo, 28 dias antes e 28 dias depois de uma mudança) usando os mesmos filtros.
4. Priorizar apenas páginas com impressões relevantes e uma hipótese clara de título, descrição, conteúdo ou link interno.
5. Validar a mudança em branch, com testes e build, antes de qualquer publicação.

## Testes

    cd frontend
    npm run test:seo:gsc

Os testes cobrem cabeçalhos em PT/EN, BOM/CRLF, consulta com vírgula entre aspas, decimal com vírgula, linhas inválidas, filtros de posição/impressões, classificação de URLs e o formato do relatório.
