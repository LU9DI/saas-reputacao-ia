# Fonte de dados, privacidade e critérios de publicação

## O que o repositório realmente tem

A leitura do schema atual (`backend/lib/db.ts`, `docs/schema.postgres.sql`, `backend/lib/unidades.ts`) encontrou:

- `empresas`: nome, CNPJ, slug e dados de conta/assinatura.
- `reviews`: avaliações recebidas por cada empresa, com nota, comentário, nome, tags e dados operacionais.
- `unidades`: pode conter cidade e identificadores de local, mas não garante UF nem setor econômico.
- Não foi encontrada uma coluna ou fluxo explícito de consentimento/licença para republicar dados agregados fora do SaaS.
- Não foi encontrado um catálogo confiável que classifique cada empresa em um dos setores do índice e no respectivo estado.

**Conclusão:** não gerar benchmarks públicos diretamente da tabela `reviews` existente. Esses registros são dados operacionais de clientes do Filtra; a presença deles no SaaS não autoriza sua republicação, mesmo em forma agregada. Também não inferir setor/UF pelo nome da empresa ou CNPJ.

## Fontes aceitáveis para alimentar `data/benchmarks.json`

Prioridade sugerida:

1. Dataset público com licença que permita reutilização comercial e republicação dos agregados.
2. Pesquisa própria com metodologia publicada e base legal/autorizações documentadas.
3. Empresas participantes que optem explicitamente por contribuir para o índice, com termo claro sobre agregação, publicação e retirada futura.

Cada lote deve ter, fora do conteúdo público, um registro de auditoria com identificador da fonte, licença/termo, data de coleta, transformação aplicada, responsável pela aprovação e versão da metodologia. Não inserir dados pessoais, comentários, nomes de avaliadores, CNPJ, identificadores de conta ou métricas individualizadas no dataset público.

## Critérios de publicação

- Só publicar a combinação setor × UF quando a classificação e a localização forem verificadas.
- O mínimo atual de 20 empresas e 100 avaliações é um filtro de amostra, não substitui autorização, avaliação de reidentificação nem análise jurídica.
- Temas devem ser categorias agregadas revisadas; nunca copiar trechos de comentários.
- Registrar o período analisado e a data real de atualização. Não alterar `updatedAt` apenas para aparentar novidade.
- Retirar a página do sitemap e da publicação quando a fonte perder autorização, ficar desatualizada ou não atender aos critérios.
- Se não houver fonte autorizada, manter zero páginas indexáveis.

## Contrato atual

O arquivo `data/benchmarks.json` é a interface de ingestão aprovada para o gerador. Ele não deve ser preenchido por consulta automática à base transacional. Uma futura integração deverá gerar esse JSON em um pipeline separado, com agregação, validação, revisão de privacidade e trilha de auditoria antes do build público.
