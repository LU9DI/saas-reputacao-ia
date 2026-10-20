# Contrato de atribuição de aquisição — Filtra.AI

Status: contrato técnico; não ativa campanhas, envios ou automações.

## Eventos considerados

O relatório protegido `POST /api/n8n/acquisition/report` considera apenas:
- `consent.granted`: lead que autorizou contato comercial;
- `diagnostic.completed`: diagnóstico concluído e associado a um lead elegível.

O endpoint público de diagnóstico não confia no `lead_id` recebido do navegador: antes de persistir o evento ou alterar a etapa de aquisição, confirma no banco que o lead existe, tem consentimento, está elegível e não está suprimido. Diagnósticos anônimos continuam possíveis, mas não entram nas métricas de aquisição.

O relatório usa eventos dentro da janela solicitada. Portanto, os totais representam eventos/lead únicos observados nessa janela, não uma reconstrução histórica de todos os leads da base.

## Atribuição

- Somente campos UTM permitidos e sanitizados são aceitos.
- A atribuição de primeira origem é escolhida pelo timestamp mais antigo entre eventos que contêm atribuição válida, independentemente da ordem de leitura.
- Um diagnóstico sem evento de consentimento na janela não pode aumentar a contagem de leads consentidos.
- O relatório agrega por origem, mídia, campanha e conteúdo; não retorna e-mail, nome de empresa ou identificadores de lead.
- Valores ausentes são rotulados como `direct/unknown`, `unknown`, `unattributed` e `unspecified`; esses rótulos não significam origem confirmada.

## Janela e limites

- `days` é limitado a 1–90 dias.
- A janela temporal é aplicada no banco, normalizando timestamps SQLite por `datetime()`.
- O relatório lê até 10.001 eventos para detectar excesso. Se houver mais de 10.000 eventos na janela, retorna HTTP 422 e pede um intervalo menor, em vez de produzir totais silenciosamente incompletos.
- A credencial de webhook é comparada por `timingSafeEqual` após validação do tamanho.

## Privacidade e operação

- Metadados de consentimento e diagnóstico não devem duplicar e-mail ou nome da empresa.
- O endpoint exige segredo de integração configurado no servidor e não deve ser exposto em conteúdo público ou cliente frontend.
- Os dados de atribuição são telemetria operacional; não são consentimento para publicação no Índice Público de Reputação.
- O contrato não significa que n8n esteja importado/ativado, nem que campanhas ou mensagens estejam agendadas.
