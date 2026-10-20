# Contrato de dados — Índice Público de Reputação Filtra.AI

Status: desenho técnico inicial; não é um pipeline ativo nem autorização para publicar dados de clientes.  
Versão da metodologia: 1.0  
Página pública: https://filtraai.com/indice-reputacao

## Objetivo

Permitir que o Filtra.AI publique estatísticas úteis e citáveis sobre padrões de reputação sem transformar dados privados de clientes em conteúdo público, sem alegações estatísticas indevidas e sem divulgar recortes que facilitem reidentificação.

## Fontes elegíveis

Uma fonte só poderá alimentar o índice depois de passar por revisão jurídica, de produto e de privacidade. Para cada registro, deve existir evidência rastreável de autorização específica para uso agregado e público, incluindo escopo, data, origem e versão do texto de consentimento.

**Não usar por padrão**:
- avaliações armazenadas no tenant de um cliente;
- avaliações enviadas à auditoria gratuita;
- nomes, comentários integrais, e-mails, telefones, identificadores de conta ou outros dados pessoais;
- dados coletados por scraping que viole termos ou direitos aplicáveis;
- dados de teste, demonstração, sintéticos ou sem proveniência verificável.

A autorização para usar o Filtra.AI ou para processar feedback dentro de uma conta não equivale automaticamente a consentimento para publicação pública.

## Contrato mínimo de entrada

Cada registro de avaliação que entrar em um lote elegível precisa conter:
- identificador de origem e identificador do negócio, usados apenas para deduplicação e contagem interna;
- setor e região de uma taxonomia controlada;
- nota inteira entre 1 e 5;
- data observada válida;
- indicador de autorização explícita para publicação agregada;
- marcador de teste para exclusão.

Texto de avaliação, nome do autor, dados de contato e nomes de negócios não são necessários para calcular os indicadores e não devem ser passados ao agregador.

## Taxonomia controlada da versão 1.0

Setores aceitos: restaurantes, hotéis, clínicas, franquias, varejo e serviços. Regiões aceitas: Brasil (somente quando a cobertura realmente for nacional), Norte, Nordeste, Centro-Oeste, Sudeste e Sul. Sinônimos conhecidos são normalizados para uma chave canônica; setores não reconhecidos e recortes por cidade são rejeitados pelo agregador inicial, para evitar fragmentação e falsas alegações de cobertura.

## Regras de agregação da versão 1.0

- Cohorte: setor + região + mês de observação.
- Deduplicação: por negócio e identificador de avaliação.
- Elegibilidade: autorização explícita; nota válida; data válida; registro não marcado como teste.
- Limite inicial: no mínimo 10 negócios distintos e 100 avaliações válidas por cohorte mensal.
- Supressão adicional obrigatória se contexto, combinações de filtros ou informação externa puderem revelar um negócio ou indivíduo.
- Estatísticas: média de nota arredondada a duas casas, distribuição de notas, percentual de notas 4–5, número de avaliações e negócios elegíveis.
- Ordenação e comparação só entre coortes com critérios de inclusão e cobertura comparáveis.
- Cada publicação deve declarar fonte, período, cobertura, método, versão, limitações e data de atualização.

Os limites numéricos são mínimos, não uma garantia matemática de anonimato. A revisão contextual de reidentificação pode exigir limites maiores ou suprimir a publicação inteira.

## Regras de publicação

1. Revisar origem, direitos de uso e autorização antes de importar qualquer lote.
2. Validar esquema, proveniência, datas, notas e exclusão de dados de teste.
3. Deduplicar antes de calcular o tamanho da amostra.
4. Aplicar limites mínimos e revisão de risco de reidentificação.
5. Gerar apenas indicadores agregados; nunca expor IDs internos nem linhas individuais.
6. Revisar resultados, metodologia e texto de interpretação por uma pessoa responsável.
7. Registrar versão da metodologia, período de origem e resumo das transformações para auditoria.
8. Corrigir ou retirar publicações se a fonte for contestada, o consentimento for inválido ou a qualidade dos dados não sustentar a afirmação.

## Limitações e status atual

O serviço `backend/services/publicReputationIndex.ts` é um agregador puro, isolado e testável. Ele **não consulta o banco de produção**, não recolhe consentimento e não publica dados. A ativação depende de um fluxo de consentimento e proveniência aprovado, fonte elegível, testes executados e revisão de privacidade.

Até esses pré-requisitos serem concluídos, a página pública apresenta apenas a metodologia; não há médias setoriais, rankings nem tendências de mercado publicadas.
