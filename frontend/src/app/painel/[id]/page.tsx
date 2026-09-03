'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { getEnv } from '../../utils/env';

interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  ai_reply: string | null;
  ai_tags: string[];
  createdAt: string;
}

interface PainelData {
  empresa: {
    id: string;
    nome_empresa: string;
    status: string;
    expira_em: string;
  };
  reviews: Review[];
  metricas: {
    total: number;
    media: number;
    negativas: number;
    positivas: number;
    alerta_crise: boolean;
    crises_24h: number;
  };
  links?: {
    avaliacao: string;
    painel: string;
    widget: string;
    embed: string;
  };
}

interface AssinaturaInfo {
  status: string;
  plan?: string;
  expira_em?: string;
  expira_em_formatado?: string | null;
  cancel_at_period_end?: boolean;
  tem_acesso?: boolean;
  mensagem?: string | null;
  aviso_cancelamento?: string | null;
}

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-500/90 text-[13px] tracking-wide" aria-hidden>
      {'★'.repeat(Math.min(5, Math.max(0, n)))}
      <span className="text-slate-200">{'★'.repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

export default function PainelEmpresa() {
  const params = useParams();
  const empresaId = String(params?.id || '');

  const [data, setData] = useState<PainelData | null>(null);
  const [assinatura, setAssinatura] = useState<AssinaturaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const api = getEnv('NEXT_PUBLIC_API_URL');
  const appOrigin =
    typeof window !== 'undefined' ? window.location.origin : getEnv('NEXT_PUBLIC_APP_URL');

  const linkAvaliacao =
    data?.links?.avaliacao || `${appOrigin}/avaliacao/${empresaId}`;

  const carregar = async () => {
    if (!empresaId) {
      setErro('Identificador inválido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErro('');
    try {
      const res = await fetch(`${api}/api/empresa/${empresaId}/painel`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Erro ${res.status}`);
      setData(json);

      // Status de assinatura / cancelamento (não bloqueia o painel se falhar)
      try {
        const r2 = await fetch(`${api}/api/empresa/${empresaId}/assinatura`);
        if (r2.ok) setAssinatura(await r2.json());
      } catch {
        /* opcional */
      }
    } catch (e: any) {
      setErro(
        e.message === 'Failed to fetch'
          ? 'Não foi possível conectar ao servidor. Verifique se a API está em execução.'
          : e.message || 'Erro ao carregar o painel.'
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  useEffect(() => {
    if (!linkAvaliacao || !data) {
      setQrUrl(null);
      return;
    }
    QRCode.toDataURL(linkAvaliacao, {
      width: 220,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [linkAvaliacao, data]);

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(linkAvaliacao);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const baixarQr = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `qr-avaliacao.png`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center">
        <p className="text-sm text-slate-400">Carregando…</p>
      </div>
    );
  }

  if (erro || !data) {
    return (
      <div className="min-h-screen bg-[#f7f7f8] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-slate-600 text-sm max-w-md">{erro || 'Painel indisponível.'}</p>
        <p className="text-xs text-slate-400 font-mono">{empresaId}</p>
        <button
          type="button"
          onClick={carregar}
          className="text-sm text-slate-600 hover:text-slate-900 underline underline-offset-4"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const { empresa, reviews, metricas } = data;
  const criticas = reviews.filter((r) => r.rating <= 3);

  const cancelado = !!assinatura?.cancel_at_period_end;
  const ateFormatado =
    assinatura?.expira_em_formatado ||
    (empresa.expira_em
      ? new Date(empresa.expira_em).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : null);

  const statusLabel = cancelado
    ? 'Cancelada — acesso até o fim do ciclo'
    : empresa.status === 'trial'
      ? '7 dias grátis ativos'
      : empresa.status === 'ativo'
        ? 'Licença ativa'
        : empresa.status;

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-slate-800">
      <header className="bg-white border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-7 flex items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-[1.65rem] font-bold text-slate-900 tracking-tight">
              {empresa.nome_empresa}
            </h1>
            <p className="text-sm text-slate-500 mt-1">Gerenciamento de Avaliações</p>
          </div>
          <button
            type="button"
            onClick={carregar}
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
          >
            Atualizar
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-10">
        {/* Aviso de cancelamento: uso até o fim do período pago */}
        {cancelado && (
          <div
            role="status"
            className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950 leading-relaxed"
          >
            <p className="font-semibold text-amber-900">Assinatura cancelada</p>
            <p className="mt-1 text-amber-900/90">
              {assinatura?.aviso_cancelamento ||
                `Você tem direito de usar o sistema até ${ateFormatado || 'o último dia do período já pago'}. O acesso será encerrado automaticamente após essa data — não há bloqueio antecipado.`}
            </p>
          </div>
        )}

        {!cancelado && assinatura?.mensagem && (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-600">
            {assinatura.mensagem}
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl px-6 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-slate-100/80">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
              Avaliações no Google
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
              {metricas.positivas}
            </p>
            <p className="mt-1 text-xs text-slate-400">Notas 4 e 5 estrelas</p>
          </div>

          <div className="bg-white rounded-2xl px-6 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-slate-100/80">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
              Críticas retidas
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
              {metricas.negativas}
            </p>
            <p className="mt-1 text-xs text-slate-400">Privadas · não publicadas</p>
          </div>

          <div className="bg-white rounded-2xl px-6 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-slate-100/80">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
              Status da licença
            </p>
            <p
              className={`mt-3 text-lg font-semibold tracking-tight ${
                cancelado ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {statusLabel}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {cancelado ? 'Uso liberado até' : 'Válido até'}{' '}
              {ateFormatado ||
                new Date(empresa.expira_em).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl px-6 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-slate-100/80 flex flex-col">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400 mb-4">
              Link de avaliação
            </p>
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="flex-1 min-w-0 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-600 font-mono break-all leading-relaxed">
                {linkAvaliacao}
              </div>
              <button
                type="button"
                onClick={copiarLink}
                className="shrink-0 self-stretch sm:self-auto px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-400 leading-relaxed">
              Compartilhe este endereço ou o QR Code com seus clientes no balcão e nas mesas.
            </p>
          </div>

          <div className="bg-white rounded-2xl px-6 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-slate-100/80 flex flex-col items-center justify-center text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400 mb-4 self-start">
              QR Code
            </p>
            {qrUrl ? (
              <>
                <img src={qrUrl} alt="QR Code de avaliação" className="w-40 h-40 rounded-lg" />
                <button
                  type="button"
                  onClick={baixarQr}
                  className="mt-4 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Baixar para impressão
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-400 py-10">Gerando QR Code…</p>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-slate-100/80 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Feedbacks privados</h2>
            <p className="text-xs text-slate-400 mt-1">
              Críticas retidas pelo sistema antes de irem a público
            </p>
          </div>

          {criticas.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-sm text-slate-500">Nenhuma crítica privada no momento.</p>
              <p className="text-xs text-slate-400 mt-1">
                Quando um cliente enviar uma nota baixa, ela aparecerá aqui.
              </p>
            </div>
          ) : (
            <ul>
              {criticas.map((r, index) => (
                <li
                  key={r.id}
                  className={`px-6 py-6 ${
                    index !== criticas.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-900">{r.name}</span>
                      <Stars n={r.rating} />
                    </div>
                    <time className="text-xs text-slate-400">
                      {new Date(r.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">{r.comment}</p>
                  )}
                  {r.ai_reply && (
                    <div className="mt-3 pl-3 border-l-2 border-slate-200">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
                        Resposta sugerida
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed">{r.ai_reply}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-center text-[11px] text-slate-300 font-mono pb-4">{empresaId}</p>
      </main>
    </div>
  );
}
