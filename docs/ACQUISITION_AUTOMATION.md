# Automação de aquisição e divulgação orgânica

Este documento descreve o MVP de aquisição da Filtra.AI. Ele foi desenhado para
gerar demanda **sem cold outreach, sem listas compradas, sem avaliações falsas e
sem publicação automática de conteúdo sem revisão**.

## 1. O que é automatizado

| Etapa | Automação | Intervenção humana |
| --- | --- | --- |
| Descoberta | Páginas SEO já publicadas e blog | Edição editorial e SEO |
| Conversão | Auditoria gratuita em `/auditoria-gratuita` | Nenhuma para gerar o diagnóstico |
| Captura | Consentimento explícito e `source` com UTM | Revisão de privacidade |
| Divulgação | Geração diária de rascunhos a partir de páginas reais | Aprovação de cada post em `/admin/aquisicao` |
| Publicação | Webhook para Buffer/Zapier/Make/n8n | Configuração do canal e aprovação |
| Medição | Diagnósticos, leads consentidos e fila de conteúdo | Leitura semanal do funil |

O sistema **não** faz:

- envio de e-mail em massa para contatos sem consentimento;
- mensagens diretas automatizadas no LinkedIn/Instagram/WhatsApp;
- publicação sem aprovação humana;
- criação de páginas em massa ou traduções superficiais;
- promessa de nota, remoção de avaliação ou resultado garantido.

## 2. Funil e oferta

- **ICP inicial:** negócios locais e PMEs com decisões influenciadas por
  avaliações — hotéis, restaurantes, clínicas, agências, franquias e operações
  multiunidade.
- **Oferta:** auditoria gratuita de avaliações → teste de 7 dias da Filtra.AI.
- **Canais iniciais:** site/blog, conteúdo orgânico em LinkedIn, Instagram e X,
  e webhook de publicação para a ferramenta que a conta já usar.
- **Orçamento padrão:** R$ 0 em mídia paga. A automação não cria gasto.
- **Volume padrão:** até 2 fontes por execução, no máximo 5; uma fonte não é
  reaproveitada por 30 dias. O padrão de 2 fontes produz até 6 posts por execução
  (2 fontes × 3 canais); o máximo manual de 5 fontes produz até 15. O workflow do
  n8n roda em dias úteis.
- **Base legal:** consentimento explícito para comunicações de marketing. O
  consentimento é opcional e o diagnóstico pode ser gerado sem ele.

> Esses parâmetros são o padrão seguro. Antes de ativar canais externos,
> confirme ICP, oferta, contas, remetente, volume e base legal.

## 3. Arquitetura

```text
Páginas reais da Filtra.AI
        │
        ▼
backend/services/acquisitionContent.ts
  - seleciona fontes elegíveis (rotação de 30 dias)
  - gera LinkedIn/Instagram/X com IA ou fallback determinístico
  - sinaliza métricas/promessas para revisão
  - grava em acquisition_content como pending_review
        │
        ▼
/admin/aquisicao  (aprovado/rejeitado/editado)
        │
        ▼
POST /api/admin/acquisition/content/:id/publish
        │
        ▼
ACQUISITION_PUBLISH_WEBHOOK_URL (Buffer/Zapier/Make/n8n)
```

O fluxo de geração também pode ser chamado pelo n8n:

```text
n8n-content-acquisition.json
  → POST /api/n8n/acquisition/content/generate
  → GET  /api/n8n/acquisition/content/pending
  → resumo da fila para revisão
```

O workflow do n8n vem **inativo** por padrão. Ele só cria rascunhos.

## 4. Configuração

No backend (Render), configure:

```env
# Site público usado nos links UTM
PUBLIC_SITE_URL=https://filtraai.com

# Segredo compartilhado com o n8n
N8N_INBOUND_SECRET=um-segredo-longo-e-aleatorio

# Publicação externa: desativada por padrão
ACQUISITION_PUBLISH_ENABLED=false
ACQUISITION_PUBLISH_WEBHOOK_URL=
ACQUISITION_PUBLISH_WEBHOOK_SECRET=

# Opcional: IA. Sem chave, o gerador usa textos determinísticos.
GROQ_API_KEY=
GEMINI_API_KEY=
```

Não coloque esses valores no frontend. O painel usa o cookie/JWT de admin.

### n8n

1. Importe `n8n-content-acquisition.json`.
2. Defina `FILTRA_API_URL` no ambiente do n8n, por exemplo
   `https://api.filtraai.com`.
3. Defina `N8N_INBOUND_SECRET` no n8n com o mesmo valor do backend.
   Se o seu n8n bloqueia `$env`, habilite o acesso a variáveis de ambiente ou
   troque as expressões por credenciais do n8n.
4. Execute manualmente uma vez.
5. Confira a fila em `/admin/aquisicao`.
6. Ative o workflow somente depois de validar o primeiro lote.

## 5. Revisão e publicação

Acesse `/admin/aquisicao` (a rota é `noindex`). Para cada rascunho:

1. Leia o texto e confira a página de origem.
2. Corrija títulos, links e promessas, se necessário.
3. Aprove ou rejeite.
4. Só publique depois de configurar o webhook.

O botão **Publicar via webhook** envia:

```json
{
  "id": "hash-do-conteudo",
  "channel": "linkedin",
  "title": "Título interno",
  "body": "Texto aprovado",
  "source_url": "/blog/exemplo",
  "utm_content": "blog-exemplo-linkedin",
  "approved_at": "2026-10-22T12:00:00.000Z",
  "campaign_id": "organic-content-2026-10"
}
```

O webhook deve responder `2xx`. Se falhar, o conteúdo permanece `approved` e
pode ser reenviado. Não há retentativa automática nesta versão.
Quando `ACQUISITION_PUBLISH_WEBHOOK_SECRET` estiver definido, o cabeçalho
`X-Filtra-Secret` é enviado para o receptor validar.

### Exemplo de roteamento no Buffer/Zapier/Make

- `channel=linkedin` → perfil LinkedIn da empresa;
- `channel=instagram` → conta Instagram da empresa;
- `channel=x` → conta X da empresa.

A publicação em cada rede continua sujeita às regras da plataforma. Não use o
mesmo texto em todas as contas sem adaptação.

## 6. Proteções implementadas

- **Sem avaliações fictícias:** o formulário de auditoria começa vazio. O
  visitante precisa colar avaliações reais.
- **Consentimento explícito:** o e-mail só é registrado quando a caixa de
  consentimento está marcada.
- **Atribuição de origem:** o formulário envia
  `auditoria-gratuita|<utm_source>|<utm_medium>|<utm_campaign>|<utm_content>` no
  campo `source`. Um componente global preserva os parâmetros UTM quando o
  visitante navega de uma página editorial para a auditoria gratuita. Páginas
  comerciais que não têm CTA de auditoria são promovidas com link direto para
  `/auditoria-gratuita`.
- **Sem publicação automática:** todo conteúdo nasce como `pending_review`.
- **Alertas de claim:** percentuais, valores em reais, garantias, superlativos e
  prazos são marcados para conferência humana.
- **Fallback seguro:** sem IA configurada, o gerador usa título, descrição,
  ângulo e URL da página; não inventa métricas.
- **Publicação opt-in:** exige `ACQUISITION_PUBLISH_ENABLED=true` e URL de
  webhook. HTTP só é aceito em localhost de desenvolvimento.
- **Sem cold outreach:** nenhum endpoint envia mensagem para lista comprada ou
  contato sem consentimento.

## 7. Atribuição e métricas

O painel mostra:

- leads com consentimento;
- diagnósticos registrados;
- rascunhos pendentes, aprovados, publicados e rejeitados.

Os links gerados usam:

```text
utm_source=linkedin|instagram|x
utm_medium=social
utm_campaign=organic-content-AAAA-MM
utm_content=<slug-da-pagina>-<canal>
```

O formulário de auditoria propaga `utm_source`, `utm_medium`,
`utm_campaign` e `utm_content` para o campo `source` do lead. Ele também envia
um objeto `attribution` sanitizado com `utm_term`, `landing_path` e
`referrer_origin`, no contrato proposto pela PR #83 (ainda não integrada).

O backend atual ignora esse objeto, portanto a mudança é retrocompatível. Após a
revisão independente e a integração da PR #83, os mesmos dados poderão alimentar
a atribuição por evento e o relatório Postgres. Até lá, use a combinação
`source` + diagnósticos + fila de conteúdo como leitura operacional.

Métricas de sucesso do MVP:

- taxa de conclusão da auditoria;
- leads com consentimento por origem;
- diagnósticos por semana;
- rascunhos aprovados / rejeitados;
- cliques e conversões dos links UTM quando a analítica estiver ativa;
- testes de 7 dias iniciados a partir da auditoria.

Não invente métricas. Se a origem não estiver registrada, trate como
"não atribuído".

## 8. Rotina semanal

- Segunda: revisar a fila e aprovar de 3 a 5 posts.
- Terça a quinta: publicar nos canais configurados.
- Sexta: ler diagnósticos, leads consentidos e feedbacks; ajustar os ângulos.
- Mensal: revisar fontes, canais e taxa de aprovação; pausar o que não gerar
  conversa qualificada.

## 9. Checklist de ativação

- [ ] `N8N_INBOUND_SECRET` configurado no backend e no n8n.
- [ ] `PUBLIC_SITE_URL` correto.
- [ ] Primeiro lote gerado e revisado.
- [ ] Contas/canais definidos e autorizados.
- [ ] Webhook de publicação testado com um post de baixo risco.
- [ ] `ACQUISITION_PUBLISH_ENABLED=true` somente após o teste.
- [ ] Política de privacidade e descadastro revisados.
- [ ] Volume e base legal confirmados.
- [ ] Nenhum e-mail de nurture ativado sem remetente, unsubscribe e suppressão.

## 10. Limitações atuais

- Não há envio de newsletter nesta versão.
- O scheduler de e-mail existente continua desativado por padrão; ele precisa de
  revisão de remetente, unsubscribe e suppressão antes de ser ligado.
- O webhook é genérico: a integração com Buffer/LinkedIn/Instagram/X depende da
  conta e das credenciais do responsável.
- A rotação de fontes usa uma janela de 30 dias; não há calendário editorial
  manual nesta versão.
- A publicação não tem fila de retentativa; falhas precisam ser reenviadas pelo
  painel.

## 11. Arquivos principais

- `backend/services/acquisitionContent.ts`: seleção de fontes, geração,
  validação de claims, aprovação e publicação.
- `backend/routes/acquisitionContentRoutes.ts`: endpoints admin e n8n.
- `frontend/src/app/admin/aquisicao/page.tsx`: fila de revisão.
- `frontend/src/app/auditoria-gratuita/AuditoriaGratuitaClient.tsx`: captura
  sem avaliações fictícias, com `source` UTM e objeto `attribution` compatível
  com a PR #83.
- `n8n-content-acquisition.json`: workflow diário que só cria rascunhos.
- `backend/.env.example`: flags de ativação.
