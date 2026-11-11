# Análise da exportação de indexação do Search Console

Este guia prepara a análise das páginas não indexadas quando houver acesso autorizado ao Search Console. A auditoria de 2026-11-11 não tinha sessão autenticada, ferramenta GSC ou credencial disponível; nenhum número de indexação foi estimado.

## Como exportar

1. Abra a propriedade verificada de `filtraai.com` no Search Console.
2. Vá em **Indexação → Páginas**.
3. Abra a aba **Não indexadas** e clique em **Exportar** (CSV).
4. Repita a exportação para cada motivo listado, se a interface limitar o número de linhas. O Search Console pode limitar a exportação da tabela; um arquivo truncado não representa o total.
5. Exporte também a aba **Indexadas** ou registre o total exibido, para o denominador.
6. Salve os arquivos fora do repositório. Eles contêm URLs e não devem ser commitados.

O arquivo esperado tem uma linha por URL e colunas equivalentes a:

- `URL` / `Página`;
- `Status` (`Indexada` / `Não indexada`);
- `Motivo` / `Cobertura` (`Descoberta, atualmente não indexada`, `Rastreada, atualmente não indexada`, `Duplicada...`, `Soft 404`, etc.);
- `Último rastreamento` (opcional).

O analisador aceita cabeçalhos em português ou inglês, BOM, CRLF, campos entre aspas e separadores `,`, `;` ou tabulação.

## Executar

    cd frontend
    npm run seo:gsc:indexing -- --file /caminho/indexing.csv --period "2026-11-01..2026-11-11"

Para cruzar com o sitemap completo:

    npm run seo:gsc:indexing -- --file /caminho/indexing.csv \
      --sitemap https://filtraai.com/sitemap-index.xml \
      --period "2026-11-01..2026-11-11" --examples 5

O argumento `--sitemap` aceita o índice central (`sitemapindex`) ou um leaf. Ao receber o índice, o script baixa os shards filhos e monta o conjunto de URLs. Se usar apenas um shard, o cruzamento cobre somente aquele shard.

Opções:

| Opção | Padrão | Efeito |
|---|---:|---|
| `--file` | obrigatório | CSV exportado da Indexação → Páginas |
| `--sitemap` | — | índice central, leaf ou arquivo local para cruzamento |
| `--format` | `md` | `md` ou `json` |
| `--period` | vazio | rótulo do período |
| `--examples` | 5 | exemplos por motivo |
| `--out` | — | grava a saída em arquivo |

## O que o relatório mostra

- Contagem de linhas, indexadas, não indexadas e status desconhecido.
- **Cada motivo separado**, com quantidade, percentual sobre o total não indexado, exemplos e prioridade sugerida.
- Distribuição por país, tipo de página, UF/estado e segmento.
- Cruzamento com o sitemap: URLs do sitemap ausentes do GSC, não indexadas dentro do sitemap e não indexadas fora dele.
- JSON com as linhas completas para análises adicionais.

Os motivos desconhecidos **não são agrupados**: cada texto distinto vira `outro:<texto>`. As prioridades são regras determinísticas (por exemplo, erro 5xx em URL do sitemap = P0; rastreada mas não indexada = P1; descoberta = P1 para hub/ranking e P2 para célula), não uma medição de impacto.

## Limitações

- O arquivo não prova que uma URL está fora do índice além do que o GSC informou.
- A exportação pode ser limitada pela UI; confirme o total exibido no relatório antes de usar os percentuais.
- Indexação, CTR e posição só mudam depois de nova coleta no Search Console; o script não prevê recuperação.

## Testes

    cd frontend
    npm run test:seo:gsc:indexing

Os testes cobrem PT/EN, motivo com vírgula entre aspas, BOM/CRLF, separação de motivos, denominador correto, cruzamento com sitemap, prioridades e exemplos.
