# Índice de Reputação Filtra — checklist de recebimento de lote

Este processo não autoriza coleta. Ele serve para revisar um lote obtido legalmente e com escopo documentado. Não envie avaliações em texto livre, e-mails, telefones, CNPJs completos, tokens ou identificadores de conta neste repositório.

## Antes de importar

- [ ] Identificar fonte e responsável por ela.
- [ ] Registrar URL/documentação e termos/licença aplicáveis.
- [ ] Confirmar permissão para reutilização em pesquisa pública agregada.
- [ ] Registrar aprovação interna, pessoa revisora, data e expiração.
- [ ] Confirmar opt-in/consentimento documentado ou outra base legal formalmente aprovada.
- [ ] Definir e registrar a versão do termo e o canal de retirada, quando aplicável.
- [ ] Limitar o lote ao período e aos campos necessários.
- [ ] Remover comentários e qualquer dado pessoal não necessário antes da transferência.
- [ ] Pseudonimizar a empresa com chave estável gerada no ambiente controlado; não usar nome, CNPJ, slug ou e-mail como chave pública.
- [ ] Excluir dados de teste e definir deduplicação.
- [ ] Verificar formato, notas válidas de 1 a 5 e datas.
- [ ] Documentar a taxonomia e a fonte usada para setor/localização; não inferir classificação sem verificação.
- [ ] Calcular contagens de qualidade sem registrar valores identificáveis nos logs.

## Após importar, antes de publicar

- [ ] Registrar o hash do lote, versão do código e parâmetros de agregação.
- [ ] Conferir duplicatas, exclusões, cobertura temporal e concentração por fonte.
- [ ] Aplicar mínimo inicial de 30 empresas e 500 avaliações por recorte, além de análise de viés e reidentificação.
- [ ] Suprimir recortes pequenos e evitar comparações que misturem fontes incompatíveis.
- [ ] Revisar resultados e texto por uma pessoa responsável.
- [ ] Aprovar explicitamente a edição e sua data de corte.
- [ ] Manter as rotas `noindex` até a aprovação de publicação.
- [ ] Registrar processo de correção e retirada para futuras edições.

## Layout lógico de importação

O arquivo de dados minimizado deve conter apenas:

| Campo | Obrigatório | Regra |
|---|---|---|
| `source_id` | Sim | ID interno da fonte aprovada, nunca token |
| `source_review_id` | Sim | ID para deduplicação dentro da fonte; guardar em área restrita |
| `company_key` | Sim | Pseudônimo estável, sem identificadores diretos |
| `rating` | Sim | Inteiro de 1 a 5 |
| `created_at` | Sim | Data/hora ISO 8601, com fuso quando disponível |
| `sector_code` | Não | Código de taxonomia documentada e validada |
| `region_code` | Não | Código geográfico validado; preferir granularidade agregada |
| `has_response` | Não | `true`, `false` ou vazio se desconhecido |
| `is_test` | Sim | `true` para excluir teste; valor desconhecido bloqueia o lote até revisão |

Metadados de aprovação da fonte, versão do termo e consentimento devem ser mantidos no registro de proveniência controlado, não confiados a uma coluna booleana fornecida junto com o CSV. O pipeline deve cruzar os IDs com esses registros aprovados antes de agregar.

**Importante:** não importar o CSV para a tabela operacional `public.reviews`. O conjunto de pesquisa deve ser isolado, com acesso restrito e retenção definida.
