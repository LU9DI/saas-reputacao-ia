/**
 * 404 + handler global de erros Express.
 */
import type { Request, Response, NextFunction } from 'express';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Rota não encontrada.' });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) return;

<<<<<<< HEAD
  const status = Number(err?.status || err?.statusCode) || 500;
  const raw = String(err?.message || 'Erro na requisição.');
  const message = status >= 500 ? 'Erro interno do servidor.' : raw;

  if (status >= 500) {
    console.error('[error]', err?.code || '', raw, err?.stack?.slice?.(0, 400) || err);
  }

  res.status(status).json({
    error: message,
    // detail curto ajuda a diagnosticar trial/billing em produção sem stack
    ...(status >= 500
      ? { detail: raw.slice(0, 240) }
      : process.env.NODE_ENV !== 'production'
        ? { detail: raw }
        : {}),
=======
  let status = Number(err?.status || err?.statusCode) || 500;
  if (!Number.isFinite(status) || status < 400 || status > 599) status = 500;

  const rawMsg = String(err?.message || 'Erro na requisição.');

  // Log interno completo — nunca enviar stack ao cliente em produção
  console.error('[error]', {
    status,
    message: rawMsg,
    code: err?.code,
    stack: process.env.NODE_ENV === 'production' ? undefined : err?.stack?.split('\n').slice(0, 8),
  });

  const isPaymentish =
    /mercado\s*pago|mp_|pix|paypal|stripe|credencial|access token|public key|unauthorized/i.test(
      rawMsg
    ) ||
    status === 401 ||
    status === 403 ||
    status === 502;

  // Cliente: genérico em 5xx (exceto pagamentos que precisam de mensagem acionável)
  const message =
    status >= 500 && !isPaymentish
      ? 'Erro ao processar a solicitação.'
      : status >= 500 && isPaymentish
        ? rawMsg
        : rawMsg;

  res.status(status).json({
    error: message,
    ...(isPaymentish && status >= 400 ? { provider: 'payment' } : {}),
>>>>>>> 4d10efc0aeb52dab05eae3aedaeceb6534ada2d5
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
