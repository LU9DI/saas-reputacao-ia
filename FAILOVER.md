# Filtra.AI — failover automático Vercel → Cloudflare

## Arquitetura

filtraai.com fica atrás de uma Cloudflare Worker Route. A Worker usa Workers KV para manter o estado e Cloudflare Cache para manter uma cópia recente das páginas públicas.

- PRIMARY: Vercel
- FALLBACK: cache da Cloudflare Worker

A troca acontece dentro do Worker, sem alteração manual de DNS.

## Failover por saúde

A Worker tenta a origem primária. Respostas públicas bem-sucedidas aquecem o cache da Cloudflare. Em erros HTTP 502/503/504/521/522/523/524 ou falha de rede, a Worker grava o estado fallback e serve a cópia em cache quando existir.

Enquanto estiver em fallback, a Worker faz sondagens controladas à Vercel. Quando a origem primária volta a responder, o estado retorna automaticamente para primary.

## Failover por orçamento

O Spend Management da Vercel envia webhook com budgetAmount, currentSpend, teamId e thresholdPercent. Os thresholds nativos documentados são 50%, 75% e 100%.

A assinatura do webhook é validada com x-vercel-signature usando HMAC-SHA1.

O monitor próprio de 90% permanece desativado por padrão. Ele exige uma URL explícita de uso configurada em VERCEL_USAGE_URL e secrets fornecidos pelo operador.

## Terraform

O diretório infra/cloudflare provisiona:

- namespace KV FAILOVER_ORIGIN;
- chave active_origin;
- Worker;
- binding KV;
- secrets do webhook e monitor;
- Route filtraai.com/*.

Nenhuma credencial é gravada no repositório.

## Estado atual

Este código não aplica Terraform, não cria recursos na Cloudflare, não altera DNS e não configura Spend Management.

Próxima sequência segura:

1. CI verde.
2. Terraform plan/validate em staging.
3. Aplicar staging.
4. Testar failover e recovery.
5. Configurar Spend Management.
6. Só então preparar produção.

Comandos locais:

    npm test
    terraform -chdir=infra/cloudflare fmt -check -recursive
    terraform -chdir=infra/cloudflare init -backend=false
    terraform -chdir=infra/cloudflare validate
