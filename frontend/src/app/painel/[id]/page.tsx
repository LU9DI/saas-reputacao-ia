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
    plan?: string;
    expira_em: string;
    whatsapp?: string | null;
    whatsapp_url?: string | null;
  };
  reviews: Review[];
  metricas: {
    total: number;
    media: number;
    negativas: number;
    positivas: number;
    alerta_crise: boolean;
    crises_24h: number;
    distribuicao?: number[];
    top_tags?: { tag: string; count: number }[];
    taxa_positiva?: number;
  };
  dashboard?: {
    nivel: string;
    pdf_disponivel: boolean;
    mostrar_graficos: boolean;
    mostrar_tags: boolean;
    mostrar_crise: boolean;
  };
  links?: {
    avaliacao: string;
    painel: string;
    widget: string;
    embed: string;
    relatorio_pdf?: string | null;
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

const STAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-500/90 text-[13px] tracking-wide" aria-hidden>
      {'★'.repeat(Math.min(5, Math.max(0, n)))}
      <span className="text-slate-200">{'★'.repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

function textoFeedback(r: Review, nomeEmpresa?: string): string {
  return [
    `Feedback ${r.rating}★ — ${r.name || 'Anônimo'}`,
    nomeEmpresa ? `Empresa: ${nomeEmpresa}` : '',
    r.comment ? `Comentário: ${r.comment}` : '',
    r.ai_reply ? `Resposta IA: ${r.ai_reply}` : '',
    r.createdAt ? `Data: ${new Date(r.createdAt).toLocaleString('pt-BR')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function BarChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const labels = ['1★', '2★', '3★', '4★', '5★'];
  return (
    <div className="flex items-end gap-3 h-40 px-2">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <span className="text-[11px] font-semibold text-slate-600 tabular-nums">{v}</span>
          <div
            className="w-full rounded-t-md transition-all"
            style={{
              height: `${Math.max((v / max) * 100, v > 0 ? 6 : 2)}%`,
              backgroundColor: STAR_COLORS[i],
              minHeight: v > 0 ? 8 : 2,
            }}
            title={`${labels[i]}: ${v}`}
          />
          <span className="text-[10px] text-slate-400">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function Donut({ positive, negative }: { positive: number; negative: number }) {
  const total = Math.max(positive + negative, 1);
  const pct = Math.round((positive / total) * 100);
  const r = 36;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="flex items-center gap-6">
      <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#fee2e2" strokeWidth="12" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#22c55e"
          strokeWidth="12"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="54" textAnchor="middle" className="fill-slate-800" style={{ fontSize: 16, fontWeight: 700 }}>
          {pct}%
        </text>
      </svg>
      <div className="text-sm space-y-2">
        <p className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" /> Positivas: <strong>{positive}</strong>
        </p>
        <p className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-200" /> Críticas: <strong>{negative}</strong>
        </p>
      </div>
    </div>
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
  const [copiadoId, setCopiadoId] = useState<number | null>(null);
  const [whatsappInput, setWhatsappInput] = useState('');
  const [salvandoWpp, setSalvandoWpp] = useState(false);
  const [msgWpp, setMsgWpp] = useState('');
  const [baixandoPdf, setBaixandoPdf] = useState(false);
  const [msgPdf, setMsgPdf] = useState('');

  const api = getEnv('NEXT_PUBLIC_API_URL');
  const appOrigin =
    typeof window !== 'undefined' ? window.location.origin : getEnv('NEXT_PUBLIC_APP_URL');

  const linkAvaliacao = data?.links?.avaliacao || `${appOrigin}/avaliacao/${empresaId}`;

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
      setWhatsappInput(json.empresa?.whatsapp || '');

      try {
        const r2 = await fetch(`${api}/api/empresa/${empresaId}/assinatura`);
        if (r2.ok) setAssinatura(await r2.json());
      } catch {
        /* opcional */
      }
    } catch (e: any) {
      setErro(
        e.message === 'Failed to fetch'
          ? 'Não foi possível conectar ao servidor.'
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

  const copiarFeedback = async (r: Review) => {
    try {
      await navigator.clipboard.writeText(textoFeedback(r, data?.empresa.nome_empresa));
      setCopiadoId(r.id);
      setTimeout(() => setCopiadoId(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const abrirWhatsappFeedback = (r: Review) => {
    const base = data?.empresa.whatsapp_url;
    if (!base) return;
    const texto = textoFeedback(r, data?.empresa.nome_empresa);
    const sep = base.includes('?') ? '&' : '?';
    window.open(`${base}${sep}text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
  };

  const salvarWhatsapp = async () => {
    setSalvandoWpp(true);
    setMsgWpp('');
    try {
      const res = await fetch(`${api}/api/empresa/${empresaId}/whatsapp`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: whatsappInput }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Falha ao salvar WhatsApp');
      setMsgWpp('WhatsApp salvo.');
      await carregar();
    } catch (e: any) {
      setMsgWpp(e.message || 'Erro ao salvar');
    } finally {
      setSalvandoWpp(false);
    }
  };

  const baixarPdf = async () => {
    setBaixandoPdf(true);
    setMsgPdf('');
    try {
      const now = new Date();
      const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const res = await fetch(`${api}/api/empresa/${empresaId}/relatorio.pdf?mes=${mes}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Erro ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${mes}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setMsgPdf('PDF baixado.');
    } catch (e: any) {
      setMsgPdf(e.message || 'Não foi possível baixar o PDF');
    } finally {
      setBaixandoPdf(false);
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
        <button type="button" onClick={carregar} className="text-sm underline text-slate-600">
          Tentar novamente
        </button>
      </div>
    );
  }

  const { empresa, reviews, metricas, dashboard } = data;
  const criticas = reviews.filter((r) => r.rating <= 3);
  const temWpp = Boolean(empresa.whatsapp_url);
  const dist = metricas.distribuicao || [0, 0, 0, 0, 0];
  const nivel = dashboard?.nivel || 'basico';
  const pdfOk = dashboard?.pdf_disponivel;
  const planLabel = String(empresa.plan || 'trial').toUpperCase();

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

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-slate-800">
      <header className="bg-white border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{empresa.nome_empresa}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Dashboard · Plano <span className="font-semibold text-slate-700">{planLabel}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pdfOk ? (
              <button
                type="button"
                disabled={baixandoPdf}
                onClick={baixarPdf}
                className="text-sm px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50"
              >
                {baixandoPdf ? 'Gerando PDF…' : 'Baixar relatório PDF'}
              </button>
            ) : (
              <span className="text-xs text-slate-400 max-w-[180px] text-right">
                PDF a partir do plano Pro
              </span>
            )}
            <button
              type="button"
              onClick={carregar}
              className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Atualizar
            </button>
          </div>
        </div>
        {msgPdf && <p className="text-center text-xs text-slate-500 pb-3">{msgPdf}</p>}
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-8">
        {cancelado && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
            <p className="font-semibold">Assinatura cancelada</p>
            <p className="mt-1">{assinatura?.aviso_cancelamento || `Acesso até ${ateFormatado}`}</p>
          </div>
        )}

        {/* KPIs */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl px-5 py-5 border border-slate-100">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Volume</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{metricas.total}</p>
          </div>
          <div className="bg-white rounded-2xl px-5 py-5 border border-slate-100">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Média</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{metricas.media || '—'}</p>
          </div>
          <div className="bg-white rounded-2xl px-5 py-5 border border-slate-100">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Positivas</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600 tabular-nums">{metricas.positivas}</p>
          </div>
          <div className="bg-white rounded-2xl px-5 py-5 border border-slate-100">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Críticas</p>
            <p className="mt-2 text-3xl font-bold text-red-600 tabular-nums">{metricas.negativas}</p>
          </div>
        </section>

        {/* Gráficos — todos os planos veem básico; Pro+ mais análise */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl px-6 py-6 border border-slate-100">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-4">
              Distribuição de notas
            </p>
            <BarChart values={dist} />
          </div>

          <div className="bg-white rounded-2xl px-6 py-6 border border-slate-100">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-4">
              Positivas vs críticas
            </p>
            <Donut positive={metricas.positivas} negative={metricas.negativas} />
            {dashboard?.mostrar_crise && metricas.alerta_crise && (
              <p className="mt-4 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                Alerta: {metricas.crises_24h} notas ≤2★ nas últimas 24h
              </p>
            )}
            {(nivel === 'basico') && (
              <p className="mt-4 text-xs text-slate-400">
                Upgrade para Pro/Ultra libera relatório PDF e análises mais profundas.
              </p>
            )}
          </div>
        </section>

        {/* Tags — Ultra / Corporativo / Rei */}
        {dashboard?.mostrar_tags && (metricas.top_tags?.length || 0) > 0 && (
          <section className="bg-white rounded-2xl px-6 py-6 border border-slate-100">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-4">
              Tags mais frequentes (IA)
            </p>
            <div className="flex flex-wrap gap-2">
              {metricas.top_tags!.map((t) => (
                <span
                  key={t.tag}
                  className="text-xs px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-100"
                >
                  {t.tag} · {t.count}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* WhatsApp */}
        <section className="bg-white rounded-2xl px-6 py-6 border border-slate-100 space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            WhatsApp de suporte
          </p>
          <p className="text-sm text-slate-500">
            Clientes com nota baixa são redirecionados para este número.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="tel"
              value={whatsappInput}
              onChange={(e) => setWhatsappInput(e.target.value)}
              placeholder="11999998888"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              disabled={salvandoWpp}
              onClick={salvarWhatsapp}
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
            >
              {salvandoWpp ? 'Salvando…' : 'Salvar WhatsApp'}
            </button>
            {temWpp && (
              <a
                href={empresa.whatsapp_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-[#25D366] text-white text-sm font-medium text-center"
              >
                Abrir WhatsApp
              </a>
            )}
          </div>
          {msgWpp && <p className="text-xs text-slate-500">{msgWpp}</p>}
        </section>

        {/* Link + QR */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl px-6 py-6 border border-slate-100">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-4">
              Link de avaliação
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 min-w-0 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm font-mono break-all text-slate-600">
                {linkAvaliacao}
              </div>
              <button
                type="button"
                onClick={copiarLink}
                className="px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium"
              >
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl px-6 py-6 border border-slate-100 flex flex-col items-center">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-4 self-start">
              QR Code
            </p>
            {qrUrl ? (
              <>
                <img src={qrUrl} alt="QR" className="w-40 h-40 rounded-lg" />
                <button type="button" onClick={baixarQr} className="mt-3 text-sm text-slate-500">
                  Baixar
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-400 py-8">Gerando…</p>
            )}
          </div>
        </section>

        {/* Feedbacks */}
        <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Feedbacks privados</h2>
          </div>
          {criticas.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">Nenhuma crítica privada.</div>
          ) : (
            <ul>
              {criticas.map((r, index) => (
                <li
                  key={r.id}
                  className={`px-6 py-6 ${index !== criticas.length - 1 ? 'border-b border-slate-100' : ''}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{r.name}</span>
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
                  {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
                  {r.ai_reply && (
                    <div className="mt-3 pl-3 border-l-2 border-slate-200">
                      <p className="text-[11px] uppercase text-slate-400 mb-1">Resposta IA</p>
                      <p className="text-sm text-slate-600">{r.ai_reply}</p>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => copiarFeedback(r)}
                      className="text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-600"
                    >
                      {copiadoId === r.id ? 'Copiado!' : 'Copiar feedback'}
                    </button>
                    {temWpp && (
                      <button
                        type="button"
                        onClick={() => abrirWhatsappFeedback(r)}
                        className="text-xs px-3 py-2 rounded-lg bg-[#25D366] text-white"
                      >
                        Abrir no WhatsApp
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
