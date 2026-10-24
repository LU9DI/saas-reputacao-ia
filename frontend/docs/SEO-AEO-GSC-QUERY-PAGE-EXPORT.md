# Exportar consultas × páginas do Google Search Console

O arquivo `export-gsc-query-page-to-drive.gs` é um auxiliar de leitura para gerar um CSV com as dimensões **consulta e página na mesma linha**. Os arquivos padrão do Search Console `Consultas.csv` e `Páginas.csv` são agregados separadamente e não podem ser cruzados para reconstruir essa relação.

## Executar uma vez

1. Abra [Google Apps Script](https://script.google.com/) usando a conta que tem acesso à propriedade `https://filtraai.com/`.
2. Crie um projeto independente.
3. Em **Serviços** (ícone +), adicione o serviço avançado **Google Search Console API**. Se o Google solicitar, habilite a API Search Console no projeto Google Cloud associado.
4. Abra este arquivo no repositório, copie todo o conteúdo para `Code.gs` no projeto Apps Script e salve.
5. Selecione a função `exportQueryPageCsv` e clique em **Executar**. Autorize o acesso solicitado ao Search Console e ao Drive.
6. Abra o **Registro de execução** e copie o link `CSV URL`. O CSV ficará no seu Google Drive. Baixe-o para a pasta Downloads do Windows.

O script está configurado para `2026-07-01` até `2026-09-30`, tipo de pesquisa Web. Para outro intervalo, altere as constantes no início do arquivo antes de executar.

## Analisar o CSV localmente

No PowerShell, cole somente os comandos abaixo (sem os marcadores Markdown). Ajuste o nome do CSV se o navegador o salvou com sufixo como `(1)`.

```powershell
Set-Location C:\Users\lucas\saas-reputacao-ia-pr95\frontend
npm run seo:overlap -- --input "$HOME\Downloads\filtraai-query-page-2026-07-01-to-2026-09-30.csv" --site "https://filtraai.com/" --start-date 2026-07-01 --end-date 2026-09-30
```

O relatório será gravado em `frontend/reports/seo-aeo-opportunities/query-page-overlap.json` e `.csv`. Ele sinaliza URLs múltiplas por consulta para revisão; não declara canibalização como fato nem autoriza publicação.

## Limites importantes

- O script consulta a API em janelas mensais e pagina em blocos de até 25.000 linhas.
- O Search Console pode omitir consultas anonimizadas e a API pode não devolver todas as combinações. O total exportado não deve ser interpretado como censo completo.
- Se o Apps Script exceder o limite de execução, altere `GSC_START_DATE` e `GSC_END_DATE` para executar um mês por vez. Analise cada arquivo separadamente; não concatene CSVs sem conferir cabeçalhos e intervalos.
- O script só lê Search Console e cria um arquivo CSV no Drive. Não publica páginas, altera o site, envia URLs nem muda sitemap/indexação.
- Não versione CSVs brutos: consultas podem conter dados sensíveis. Os relatórios locais são artefatos de análise, não uma autorização editorial.
