# Spec Kit

Este diretório contém recursos de auditoria e testes de especificação para o projeto **Spec‑Driven Development**.

- **Auditorias**: scripts e documentação para validar requisitos críticos.
- **Testes**: suites de teste que verificam isolamento de dados, quotas de IA, geração de QR‑codes, webhook Stripe etc.

## Regra de comunicação e SEO da Filtra.AI

A Filtra.AI deve manter comunicação institucional, SEO, conteúdo editorial e textos de produto estritamente focados no próprio produto e no valor entregue ao cliente.

**Regra obrigatória:** Filtra.AI: **sem ataques, comparações depreciativas ou referências desnecessárias a concorrentes/produtos de terceiros.**

Essa regra se aplica a títulos, descriptions, headings, textos de páginas, metadados, Open Graph, JSON-LD, landing pages, artigos, campanhas, prompts de geração de conteúdo e demais superfícies públicas.

Quando uma distinção competitiva for necessária, ela deve ser feita de forma factual, neutra e centrada nas capacidades da Filtra.AI, sem depreciar, ridicularizar ou mencionar terceiros sem necessidade.

## Critério de auditoria

Qualquer conteúdo novo ou alterado que viole essa regra deve ser considerado falha de especificação e corrigido antes do deploy.

Adicione aqui os arquivos necessários para a sua auditoria.


## Auditoria executável de comunicação/SEO

O guardrail `audit-seo-brand.mjs` verifica o conteúdo público em `frontend/src/app` e falha quando encontra a frase legada de filtros de fotografia, referências explícitas a concorrentes/competidores ou linguagem depreciativa. Execute antes do deploy:

```bash
node spec-kit/audit-seo-brand.mjs
```

O objetivo é impedir regressões da regra de comunicação no código, sem bloquear usos funcionais e neutros de termos como `comparar` ou `SEO`.
