# Índice de Reputação Filtra — plano de dados e controles

**Status:** proposta técnica; não autoriza coleta nem publicação por si só.  
**Princípio:** nenhum dado de produção deve ser reutilizado para pesquisa pública até que finalidade, base legal, transparência contratual e permissões da fonte sejam aprovadas.

## 1. Fontes aceitas para o piloto

### Preferencial: painel voluntário de empresas
Convidar empresas a participar explicitamente do estudo, registrar consentimento/termo específico para pesquisa agregada, origem dos dados, período e possibilidade de retirada. O termo deve explicar que o resultado será agregado e pode ser publicado. A participação no estudo não pode ser condição oculta para usar o SaaS.

### Alternativa: conexão autorizada de plataforma
Utilizar apenas integrações oficiais e dados que a empresa tenha autorização para fornecer. Antes de ativar qualquer conector, validar os termos da API, escopos, retenção, redistribuição e restrições de uso em relatórios públicos. Não raspar páginas nem contornar limites técnicos.

### Fontes públicas empresariais
Bases oficiais como CNPJ podem ajudar a classificar atividade econômica/localidade, mas não são, por si só, fonte de avaliações ou de reputação. Registrar licença, data de atualização e correspondência da empresa; não inferir setor/região sem validação.

## 2. Registro mínimo de fonte

Cada lote importado deve registrar:
- identificador interno da fonte e do lote;
- tipo de fonte e URL/documentação de origem;
- titular/controlador ou responsável pela autorização;
- fundamento de uso, texto/versão do aceite e data;
- escopos e termos aplicáveis;
- intervalo de coleta, data de importação e data de expiração/revisão;
- critérios de deduplicação, validação e exclusão;
- responsável por aprovar a publicação.

Não guardar conteúdo bruto de avaliação no pipeline público se a estatística puder ser calculada sem ele. Não colocar tokens, chaves, dados de contato, CNPJ completo ou IDs de clientes em páginas públicas.

## 3. Separação entre produto e pesquisa

- Não consultar a tabela operacional `reviews` diretamente do frontend público.
- Não usar dados do cliente por padrão; exigir adesão específica e documentada ou outra base legal formalmente validada.
- Manter o conjunto de pesquisa separado do banco operacional, com identificadores pseudonimizados e retenção limitada.
- Processar agregações em job de backend com credencial de servidor, nunca com chave privilegiada no navegador.
- Publicar somente uma tabela/materialização de estatísticas revisadas e explicitamente aprovadas.
- Registrar auditoria de cada versão publicada: fonte, corte, consulta/versão de código, contagens, aprovação e correções posteriores.

## 4. Critérios de publicação

Os limites de 30 empresas distintas e 500 avaliações válidas por segmento são apenas um gate mínimo inicial, não prova de representatividade. Antes de publicar, também exigir:
1. cobertura geográfica e temporal conhecida;
2. avaliação de viés de seleção e concentração por rede/plataforma;
3. regras de deduplicação e exclusão de avaliações de teste;
4. distribuição das notas e tamanho da amostra, não apenas média;
5. supressão de células pequenas e revisão de risco de reidentificação;
6. metodologia versionada e revisão humana;
7. revisão de privacidade e de termos de uso;
8. data de corte, limitações e processo de correção pública.

Não criar ranking de empresas individuais no piloto. Priorizar estatísticas descritivas agregadas.

## 5. Plano de implementação

1. Aprovar fonte e base legal com assessoria responsável por privacidade/contratos.
2. Criar fluxo de adesão separado, versionado e revogável.
3. Importar um lote de teste sintético, nunca misturado com dados reais.
4. Implementar validação e deduplicação com testes automatizados.
5. Gerar agregados em ambiente isolado e validar amostra/viés.
6. Revisar risco de reidentificação e aprovação editorial.
7. Publicar a primeira edição apenas quando todos os gates forem aprovados; só então remover `noindex`.

## 6. Alerta de segurança Supabase — precisa de triagem separada

A inspeção de metadados reportou RLS desabilitado em:
- `public.leads_basis_backup_20261008`
- `public.relatorio_generation_log`
- `public.relatorio_envios_mensais`
- `public.empresa_owners`
- `public.dot_admin_pins`
- `public.dot_admin_pin_attempts`
- `public.dot_admin_sessions`

Isso não prova exposição explorável sem conferir grants e políticas efetivas, mas é crítico. Não aplicar apenas `ENABLE ROW LEVEL SECURITY` indiscriminadamente: tabelas de uso interno podem depender de acesso do backend e precisam de políticas/grants compatíveis. Próximas verificações somente leitura:
- grants de `anon`, `authenticated`, `service_role` e funções;
- políticas atuais e dependências no código;
- se as tabelas internas são acessadas apenas pelo backend com credencial privilegiada;
- exposição efetiva via PostgREST;
- plano por tabela para revogar grants indevidos e ativar RLS com políticas mínimas.

**Não foi alterado o banco de produção.** Não executar correção em lote até mapear os consumidores e validar um plano reversível.

## 7. Bloqueios operacionais observados

- A PR #71 continua draft e precisa de CI verde antes de sair desse estado.
- GitHub Actions marcou backend, frontend, SEO e summary como falhos, mas a API de logs retornou `BlobNotFound`; a causa ainda não está confirmada.
- O deployment de preview do Vercel associado à branch falhou no build. O conector Vercel recusou acesso aos logs por falta de autorização para o escopo `lu9di`; conceder acesso ao projeto/equipe ao conector ou revisar os logs no painel antes de tentar corrigir às cegas.
- Nenhum merge, deploy de produção, alteração de schema ou coleta externa foi executado nesta etapa.
