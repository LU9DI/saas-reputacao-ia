/**
 * Tipagem mínima do worker Cloudflare (arquivo JS puro, sem etapa de build).
 * Necessária apenas para o typecheck dos testes de failover — o contrato real
 * do Worker é o handler `fetch`.
 */
declare const worker: {
  fetch(request: Request, env: Record<string, unknown>, ctx?: unknown): Promise<Response>;
};

export default worker;
