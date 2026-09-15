'use client';

import { useEffect, useState, useCallback } from 'react';
import { getEnv } from '../utils/env';
import { Loader2, Copy, Check, X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  planoKey: string;
  planoLabel?: string;
  empresaId?: string | null;
  email?: string | null;
};

type PixPayload = {
  payment_id: string;
  qr_code?: string | null;
  qr_code_base64?: string | null;
  copia_e_cola?: string | null;
  amount?: number;
  expires_at?: string | null;
  status?: string;
};

export function PixCheckoutModal({
  open,
  onClose,
  planoKey,
  planoLabel,
  empresaId,
  email,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [pix, setPix] = useState<PixPayload | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pago, setPago] = useState(false);
  const api = (getEnv('NEXT_PUBLIC_API_URL') || 'http://127.0.0.1:5000').replace(/\/$/, '');

  const criar = useCallback(async () => {
    setLoading(true);
    setErro('');
    setPix(null);
    setPago(false);
    try {
      const res = await fetch(`${api}/api/pix/avulso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plano: planoKey,
          empresa_id: empresaId || undefined,
          email: email || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error ||
            (res.status === 503
              ? 'Pix não configurado. Defina MP_ACCESS_TOKEN no backend.'
              : `Erro ${res.status}`)
        );
      }
      setPix({
        payment_id: data.payment_id,
        qr_code: data.qr_code,
        qr_code_base64: data.qr_code_base64,
        copia_e_cola: data.copia_e_cola || data.qr_code,
        amount: data.amount,
        expires_at: data.expires_at,
        status: data.status,
      });
    } catch (e: any) {
      setErro(e.message || 'Falha ao gerar Pix');
    } finally {
      setLoading(false);
    }
  }, [api, planoKey, empresaId, email]);

  useEffect(() => {
    if (open) criar();
  }, [open, criar]);

  useEffect(() => {
    if (!open || !pix?.payment_id || pago) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`${api}/api/pix/payment/${pix.payment_id}`);
        const data = await res.json().catch(() => ({}));
        if (data.approved || data.status === 'approved') {
          setPago(true);
        }
      } catch {
        /* */
      }
    }, 4000);
    return () => clearInterval(t);
  }, [open, pix?.payment_id, api, pago]);

  if (!open) return null;

  const copia = pix?.copia_e_cola || pix?.qr_code || '';

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto overscroll-contain">
      <div className="w-full max-w-md max-h-[min(92dvh,860px)] overflow-y-auto overflow-x-hidden bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 relative my-3 sm:my-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-200 z-10"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="pr-8">
          <h3 className="text-lg font-bold text-zinc-50">Pagar com Pix</h3>
          <p className="text-sm text-zinc-400 mt-1">
            {planoLabel || planoKey}
            {pix?.amount != null ? ` · R$ ${Number(pix.amount).toFixed(2)}` : ''}
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-zinc-400 text-sm">
            <Loader2 className="animate-spin" size={18} /> Gerando QR Code…
          </div>
        )}

        {erro && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-3 py-2">
            {erro}
          </p>
        )}

        {pago && (
          <div className="text-center py-6 space-y-2">
            <p className="text-emerald-400 font-semibold">Pagamento confirmado!</p>
            <p className="text-xs text-zinc-500">Seu plano será ativado em instantes.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium"
            >
              Fechar
            </button>
          </div>
        )}

        {!loading && !erro && pix && !pago && (
          <div className="space-y-4">
            {pix.qr_code_base64 && (
              <div className="flex justify-center w-full">
                <img
                  src={`data:image/png;base64,${pix.qr_code_base64}`}
                  alt="QR Code Pix"
                  className="w-44 h-44 sm:w-52 sm:h-52 max-w-full rounded-xl bg-white p-2 object-contain"
                />
              </div>
            )}
            <p className="text-xs text-zinc-500 text-center">
              Escaneie o QR no app do banco ou use o copia e cola
            </p>
            {copia && (
              <div className="space-y-2">
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[11px] font-mono text-zinc-400 break-all max-h-24 overflow-y-auto">
                  {copia}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(copia);
                      setCopiado(true);
                      setTimeout(() => setCopiado(false), 2000);
                    } catch {
                      /* */
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
                >
                  {copiado ? <Check size={16} /> : <Copy size={16} />}
                  {copiado ? 'Copiado!' : 'Copia e cola'}
                </button>
              </div>
            )}
            <p className="text-[11px] text-zinc-600 text-center">
              Aguardando pagamento… (atualiza sozinho)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
