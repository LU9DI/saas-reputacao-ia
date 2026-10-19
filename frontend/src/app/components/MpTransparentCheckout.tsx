'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { apiFetch } from '../utils/apiFailover';
import { Loader2, X, Check } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  planoKey: string;
  planoLabel?: string;
  empresaId?: string | null;
  email?: string | null;
};

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

function loadMpSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR'));
    if (window.MercadoPago) return resolve();
    const existing = document.querySelector('script[data-mp-sdk]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('SDK MP falhou')));
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://sdk.mercadopago.com/js/v2';
    s.async = true;
    s.dataset.mpSdk = '1';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Não carregou SDK Mercado Pago'));
    document.head.appendChild(s);
  });
}

export function MpTransparentCheckout({
  open,
  onClose,
  planoKey,
  planoLabel,
  empresaId,
  email,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const brickRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [pago, setPago] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [pixQr, setPixQr] = useState<string | null>(null);

  const destroyBrick = useCallback(() => {
    try {
      brickRef.current?.unmount?.();
    } catch {
      /* */
    }
    brickRef.current = null;
    if (containerRef.current) containerRef.current.innerHTML = '';
  }, []);

  useEffect(() => {
    if (!open) {
      destroyBrick();
      setPago(false);
      setErro('');
      setPixQr(null);
      setStatusMsg('');
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setErro('');
      setPago(false);
      setPixQr(null);
      try {
        const cfgRes = await apiFetch(`/api/mp/config?plano=${encodeURIComponent(planoKey)}`, {
          cache: 'no-store',
        });
        const cfg = await cfgRes.json().catch(() => ({}));
        if (!cfgRes.ok || !cfg.configured) {
          throw new Error(
            cfg.error ||
              'Mercado Pago não configurado. Defina MP_ACCESS_TOKEN e MP_PUBLIC_KEY no Render.'
          );
        }
        const publicKey =
          cfg.public_key ||
          (typeof process !== 'undefined'
            ? process.env.NEXT_PUBLIC_MP_PUBLIC_KEY
            : '') ||
          '';
        if (!publicKey) {
          throw new Error(
            'MP_PUBLIC_KEY ausente. No painel do Mercado Pago copie a Public Key e coloque no Render (MP_PUBLIC_KEY) e na Vercel (NEXT_PUBLIC_MP_PUBLIC_KEY).'
          );
        }
        if (cfg.amount == null) throw new Error('Não foi possível obter o valor do plano.');
        if (cancelled) return;
        setAmount(Number(cfg.amount));

        await loadMpSdk();
        if (cancelled || !containerRef.current) return;

        destroyBrick();
        const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
        const bricksBuilder = mp.bricks();

        brickRef.current = await bricksBuilder.create('payment', containerRef.current.id, {
          initialization: {
            amount: Number(cfg.amount),
            payer: email ? { email } : undefined,
          },
          customization: {
            paymentMethods: {
              creditCard: 'all',
              debitCard: 'all',
              ticket: 'all',
              bankTransfer: 'all',
              maxInstallments: 12,
            },
            visual: {
              style: {
                theme: 'dark',
              },
            },
          },
          callbacks: {
            onReady: () => {
              if (!cancelled) setLoading(false);
            },
            onError: (err: any) => {
              console.error('[mp brick]', err);
              if (!cancelled) setErro(err?.message || 'Erro no formulário de pagamento');
            },
            onSubmit: ({ formData }: any) => {
              return new Promise<void>(async (resolve, reject) => {
                try {
                  const res = await apiFetch('/api/mp/process-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      plano: planoKey,
                      empresa_id: empresaId || undefined,
                      formData,
                    }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    throw new Error(data.error || `Erro ${res.status}`);
                  }
                  if (data.qr_code_base64) setPixQr(data.qr_code_base64);
                  if (data.approved || data.status === 'approved') {
                    setPago(true);
                    setStatusMsg('Pagamento aprovado! Plano será ativado em instantes.');
                  } else if (data.status === 'pending' || data.status === 'in_process') {
                    setStatusMsg(
                      data.payment_method_id === 'pix'
                        ? 'Pix gerado. Escaneie o QR ou aguarde a confirmação.'
                        : `Pagamento ${data.status}. Aguardando confirmação…`
                    );
                    if (data.payment_id) {
                      const poll = setInterval(async () => {
                        try {
                          const pr = await apiFetch(`/api/pix/payment/${data.payment_id}`);
                          const pd = await pr.json().catch(() => ({}));
                          if (pd.approved || pd.status === 'approved') {
                            clearInterval(poll);
                            setPago(true);
                            setStatusMsg('Pagamento confirmado!');
                          }
                        } catch {
                          /* */
                        }
                      }, 4000);
                      setTimeout(() => clearInterval(poll), 15 * 60 * 1000);
                    }
                  } else if (data.status === 'rejected') {
                    throw new Error(data.status_detail || 'Pagamento recusado');
                  } else {
                    setStatusMsg(`Status: ${data.status}`);
                  }
                  resolve();
                } catch (e: any) {
                  setErro(e.message || 'Falha ao processar pagamento');
                  reject();
                }
              });
            },
          },
        });
      } catch (e: any) {
        if (!cancelled) {
          setErro(e.message || 'Falha ao iniciar Checkout Transparente');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      destroyBrick();
    };
  }, [open, planoKey, empresaId, email, destroyBrick]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto overscroll-contain">
      <div className="w-full max-w-lg max-h-[min(92dvh,920px)] overflow-y-auto overflow-x-hidden bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 sm:p-5 md:p-6 space-y-4 relative my-3 sm:my-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-200 z-10"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="pr-8">
          <h3 className="text-lg font-bold text-zinc-50">Checkout Mercado Pago</h3>
          <p className="text-sm text-zinc-400 mt-1">
            {planoLabel || planoKey}
            {amount != null ? ` · R$ ${Number(amount).toFixed(2).replace('.', ',')}` : ''}
          </p>
          <p className="text-[11px] text-zinc-600 mt-1">
            Pagamento dentro do Filtra.AI (Checkout Transparente) — cartão, Pix e mais.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-zinc-400 text-sm">
            <Loader2 className="animate-spin" size={18} /> Carregando formulário…
          </div>
        )}

        {erro && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-3 py-2">
            {erro}
          </p>
        )}

        {pago && (
          <div className="text-center py-6 space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Check size={24} />
            </div>
            <p className="text-emerald-400 font-semibold">Pagamento confirmado!</p>
            <p className="text-xs text-zinc-500">{statusMsg || 'Seu plano será ativado em instantes.'}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium"
            >
              Fechar
            </button>
          </div>
        )}

        {!pago && (
          <>
            {statusMsg && !erro && (
              <p className="text-sm text-amber-200/90 bg-amber-950/30 border border-amber-900/50 rounded-xl px-3 py-2">
                {statusMsg}
              </p>
            )}
            {pixQr && (
              <div className="flex justify-center w-full">
                <img
                  src={`data:image/png;base64,${pixQr}`}
                  alt="QR Pix"
                  className="w-40 h-40 sm:w-48 sm:h-48 max-w-full rounded-xl bg-white p-2 object-contain"
                />
              </div>
            )}
            {/* Contém o Brick do MP para não estourar a viewport */}
            <div
              id="mp-payment-brick"
              ref={containerRef}
              className={
                loading
                  ? 'min-h-[120px] w-full max-w-full overflow-x-hidden'
                  : 'min-h-[240px] w-full max-w-full overflow-x-hidden [&_iframe]:max-w-full [&_img]:max-w-full [&_img]:h-auto'
              }
              style={{ maxWidth: '100%' }}
            />
          </>
        )}
      </div>
    </div>
  );
}
