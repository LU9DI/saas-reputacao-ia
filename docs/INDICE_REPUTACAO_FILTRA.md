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
- A consulta de contagens e esquema de `reviews` e `empresas` não foi uma auditoria completa de RLS. Uma triagem separada identificou RLS desabilitado em sete tabelas internas: `leads_basis_backup_20261008`, `relatorio_generation_log`, `relatorio_envios_mensais`, `empresa_owners`, `dot_admin_pins`, `dot_admin_pin_attempts` e `dot_admin_sessions`. As verificações de grants disponíveis não indicaram `SELECT`/`INSERT` para `anon` ou `authenticated` nessas tabelas; portanto, RLS desabilitado é um alerta que exige revisão por tabela, mas não prova isoladamente exposição pública. Nenhuma política ou permissão foi alterada. Ver `docs/INDICE_REPUTACAO_FONTE_DE_DADOS.md` para o plano de triagem.

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

## Implementação adicional na branch de fundação

- Foram criadas páginas de escopo para setor, região, tendências e relatório anual. Todas têm canonical próprio, `noindex,follow` e não foram incluídas no sitemap. Elas explicam a metodologia planejada, não exibem resultados simulados.
- A página metodológica liga às quatro frentes de pesquisa para navegação interna; a navegação não significa que os resultados estejam prontos para publicação.
- A auditoria do artefato estático agora exige que as cinco rotas permaneçam com `noindex` e falha se qualquer rota do índice entrar no sitemap.
- Foi criado `backend/services/reputationIndexAggregation.ts`, um agregador puro e fail-closed que exige autorização da fonte e consentimento marcado, exclui registros de teste/inválidos/fora da janela, deduplica por fonte e ID da avaliação e só devolve agregados que atingem os limites configurados.
- Foram adicionados testes unitários para os gates de publicação, deduplicação, distribuição de notas e ausência de identificadores individuais na saída.
- O agregador e o validador de proveniência ainda não estão conectados a uma fonte real nem a uma rota pública. Essa separação é intencional: nenhuma credencial ou dado operacional deve ser usado sem aprovação formal da fonte e do tratamento.
- Foi criado `backend/services/reputationIndexIntake.ts` para cruzar cada lote com registro de aprovação de fonte e consentimento revogável, com data de revisão, validade, versão do termo e motivos de exclusão agregados. O serviço ainda não está conectado a uma rota nem importa dados automaticamente.
- Foram adicionados testes para aprovação ausente/pendente, expiração, retirada do consentimento e timestamps inválidos.
- Foram preparados uma minuta de adesão voluntária (explicitamente marcada para revisão jurídica antes de uso) e um checklist de recebimento de lote. Nenhum formulário foi publicado e nenhuma coleta foi iniciada.
- O guardrail SEO foi ajustado para permitir menções educativas neutras a competidores e continuar sinalizando frases diretamente depreciativas. O teste de integração do backend recebe instalação de SQLite de teste na CI; as dependências são instaladas no job sem alterar o lockfile da aplicação.

## Próximo marco

Escolher e validar a fonte autorizada de dados. Só depois gerar o primeiro relatório com números reais e habilitar indexação pública.
