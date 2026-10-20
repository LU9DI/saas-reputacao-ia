# Índice de Reputação Filtra — auditoria de prontidão

**Data da auditoria:** 20/10/2026  
**Repositório:** `LU9DI/saas-reputacao-ia`  
**Banco consultado:** Supabase `LU9DI's Project` (PostgreSQL 17, produção)  
**Escopo:** leitura agregada de esquema e contagens; nenhuma linha de cliente foi exportada; nenhuma alteração de banco foi feita.

## Conclusão executiva

**Ainda não há dados suficientes para publicar um índice de mercado ou comparativos por setor/região.** A aplicação já coleta avaliações no produto, mas o conjunto atual é pequeno, recente e sem classificação estruturada suficiente para segmentação confiável.

## Evidências observadas

- `public.reviews`: 11 registros de avaliação; 11 com nota válida entre 1 e 5; 0 marcados como teste; distribuídos entre 4 empresas.
- Período coberto pela amostra consultada: 09/09/2026 a 18/09/2026.
- `public.empresas`: 8 empresas cadastradas.
- O esquema de `empresas` não possui campos estruturados de setor econômico, município/UF ou região.
- `reviews` inclui identificadores da empresa, nota, comentário, datas, tags/sentimento e sinalização de teste, entre outros campos operacionais. Esses campos não devem ser expostos em páginas públicas em nível individual.
- RLS aparece habilitado nas tabelas Filtra consultadas. Isso não comprova, por si só, que todas as políticas de acesso estejam corretas; não foi feita alteração de políticas nesta tarefa.

## Decisão sobre a primeira página

Foi criada a rota estática `/indice-reputacao-filtra` com conteúdo de metodologia e transparência, sem publicar estatísticas de clientes. A página define que o índice ainda não está disponível, explica critérios propostos e usa `noindex,follow`. Ela não foi adicionada ao sitemap nem à navegação principal, evitando que uma página sem resultados seja apresentada como pesquisa concluída.

## Critérios propostos antes de publicar resultados

Estes são gates operacionais iniciais, não uma alegação de que a amostra se torna automaticamente representativa:

1. Pelo menos 30 empresas distintas e 500 avaliações válidas por segmento publicado.
2. Definir uma janela temporal explícita (inicialmente até 90 dias), com atualização e data de corte.
3. Excluir avaliações de teste, duplicatas identificáveis e registros inválidos; documentar os critérios de exclusão.
4. Mostrar tamanho da amostra, distribuição de notas, cobertura geográfica/temporal e limitações.
5. Não publicar células com baixo número de empresas, nem texto de avaliação ou combinação de campos que permita reidentificação.
6. Usar dados de clientes somente quando contrato, aviso de privacidade, base legal e autorização forem compatíveis com a finalidade de pesquisa e publicação. RLS e anonimização técnica não substituem essas condições.
7. Para dados externos, documentar origem, termos de uso, permissões, método de coleta e limites de reutilização.
8. Separar métricas observadas de métricas inferidas; não criar rankings até existir metodologia testada e auditável.

## Lacunas a resolver

- Definir fonte autorizada para ampliar a amostra.
- Criar processo de consentimento/opt-in ou outra base legal validada para contribuição de dados de clientes.
- Adicionar metadados estruturados de setor e localização somente com fonte verificável e controles de qualidade.
- Definir regras de deduplicação, janela temporal, critérios de exclusão e cálculo.
- Criar pipeline de agregação que publique apenas estatísticas aprovadas, sem expor a tabela `reviews` ou identificadores no frontend.
- Implementar testes para amostra mínima, registros de teste, datas, duplicatas e proteção contra reidentificação.

## Validação e segurança

- Consultas realizadas somente para contagens agregadas e metadados de esquema.
- Nenhuma alteração ou migração aplicada ao banco de produção.
- Nenhum deploy realizado.
- A nova página e os metadados precisam passar pela CI normal do projeto antes de merge.
- A página permanece `noindex` e fora do sitemap até que exista um conjunto publicável e revisão de privacidade.

## Próximo marco

Escolher e validar a fonte autorizada de dados. Só depois gerar o primeiro relatório com números reais e habilitar indexação pública.
