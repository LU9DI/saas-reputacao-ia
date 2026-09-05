'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { getEnv } from '../../utils/env';
import { DashboardCharts } from '../../components/DashboardCharts';
import { currentMonthYYYYMM, validateReportMonth } from '../../utils/dateValidation';
import { PlanSwitcher } from '../../components/PlanSwitcher';
import { PushEnable } from '../../components/PushEnable';

interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  ai_reply: string | null;
  ai_tags: string[];
  createdAt: string;
  sentiment?: string | null;
  is_test?: boolean;
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
    serie_14d?: any[];
  };
  dashboard?: {
    nivel: string;
    pdf_disponivel: boolean;
    plan_switch?: boolean;
    mostrar_crise?: boolean;
  };
  links?: { avaliacao: string; relatorio_pdf?: string | null };
}

function listarMesesOpcoes(qtd = 18): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < qtd; i++) {
    out.push(currentMonthYYYYMM(d));
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

function labelMes(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-').map(Number);
  if (!y || !m) return yyyyMm;
  const nome = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-500 text-[13px]" aria-hidden>
      {'★'.repeat(Math.min(5, Math.max(0, n)))}
      <span className="text-slate-200">{'★'.repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

export default function PainelEmpresa() {
  const params = useParams();
  const empresaId = String(params?.id || '');
  const [data, setData] = useState<PainelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [whatsappInput, setWhatsappInput] = useState('');
  const [salvandoWpp, setSalvandoWpp] = useState(false);
  const [msgWpp, setMsgWpp] = useState('');
  const [baixandoPdf, setBaixandoPdf] = useState(false);
  const [msgPdf, setMsgPdf] = useState('');
  const [mesPdf, setMesPdf] = useState(currentMonthYYYYMM);
  const mesesOpcoes = useMemo(() => listarMesesOpcoes(18), []);
  const mesMax = currentMonthYYYYMM();
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
    QRCode.toDataURL(linkAvaliacao, { width: 220, margin: 2 })
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [linkAvaliacao, data]);

  const baixarPdf = async () => {
    const check = validateReportMonth(mesPdf, { maxMonth: mesMax, minYear: 2020 });
    if (!check.ok) {
      setMsgPdf(check.error);
      return;
    }
    setBaixandoPdf(true);
    setMsgPdf('');
    try {
      const mes = check.value;
      const res = await fetch(
        `${api}/api/empresa/${empresaId}/relatorio.pdf?mes=${encodeURIComponent(mes)}`
      );
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
      setMsgPdf(`PDF de ${labelMes(mes)} baixado.`);
    } catch (e: any) {
      setMsgPdf(e.message || 'Não foi possível baixar o PDF');
    } finally {
      setBaixandoPdf(false);
    }
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
      if (!res.ok) throw new Error(json.error || 'Falha ao salvar');
      setMsgWpp('WhatsApp salvo.');
      await carregar();
    } catch (e: any) {
      setMsgWpp(e.message || 'Erro');
    } finally {
      setSalvandoWpp(false);
    }
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
      <div className="min-h-screen bg-[#f7f7f8] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-slate-600 text-sm">{erro || 'Painel indisponível.'}</p>
        <button type="button" onClick={carregar} className="text-sm underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  const { empresa, reviews, metricas, dashboard } = data;
  const criticas = reviews.filter((r) => r.rating <= 3 && !r.is_test);
  const dist = metricas.distribuicao || [0, 0, 0, 0, 0];
  const nivel = dashboard?.nivel || 'basico';
  const pdfOk = Boolean(dashboard?.pdf_disponivel || dashboard?.plan_switch);
  const planLabel = String(empresa.plan || 'trial').toUpperCase();

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-slate-800">
      <header className="bg-white border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{empresa.nome_empresa}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Dashboard · Plano <span className="font-semibold">{planLabel}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pdfOk && (
              <>
                <select
                  value={mesPdf}
                  onChange={(e) => setMesPdf(e.target.value)}
                  className="text-sm px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {mesesOpcoes.map((m) => (
                    <option key={m} value={m}>
                      {labelMes(m)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={baixandoPdf}
                  onClick={baixarPdf}
                  className="text-sm px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-50"
                >
                  {baixandoPdf ? 'Gerando PDF…' : 'Baixar PDF'}
                </button>
              </>
            )}
            <button type="button" onClick={carregar} className="text-sm text-slate-500 px-3 py-2">
              Atualizar
            </button>
          </div>
        </div>
        {msgPdf && (
          <p className={`text-center text-xs pb-3 ${msgPdf.includes('baixado') ? 'text-emerald-600' : 'text-red-600'}`}>
            {msgPdf}
          </p>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-8">
        <PlanSwitcher
          empresaRef={empresaId}
          planAtual={empresa.plan}
          enabled={Boolean(dashboard?.plan_switch)}
          onChanged={carregar}
        />

        <PushEnable />

        {pdfOk && (
          <section className="bg-white rounded-2xl px-6 py-5 border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Relatório mensal</p>
              <p className="text-sm text-slate-600 mt-1">
                PDF do plano <strong>{planLabel}</strong> — {labelMes(mesPdf)}
              </p>
            </div>
            <button
              type="button"
              disabled={baixandoPdf}
              onClick={baixarPdf}
              className="text-sm px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-50"
            >
              {baixandoPdf ? 'Gerando…' : 'Baixar relatório PDF'}
            </button>
          </section>
        )}

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl px-5 py-5 border border-slate-100">
            <p className="text-[11px] uppercase text-slate-400">Volume</p>
            <p className="mt-2 text-3xl font-bold">{metricas.total}</p>
          </div>
          <div className="bg-white rounded-2xl px-5 py-5 border border-slate-100">
            <p className="text-[11px] uppercase text-slate-400">Média</p>
            <p className="mt-2 text-3xl font-bold">{metricas.media || '—'}</p>
          </div>
          <div className="bg-white rounded-2xl px-5 py-5 border border-slate-100">
            <p className="text-[11px] uppercase text-slate-400">Positivas</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{metricas.positivas}</p>
          </div>
          <div className="bg-white rounded-2xl px-5 py-5 border border-slate-100">
            <p className="text-[11px] uppercase text-slate-400">Críticas</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{metricas.negativas}</p>
          </div>
        </section>

        <DashboardCharts
          distribuicao={dist}
          positivas={metricas.positivas}
          negativas={metricas.negativas}
          serie={metricas.serie_14d || []}
          topTags={metricas.top_tags || []}
          nivel={nivel}
          crises24h={metricas.crises_24h}
          alertaCrise={Boolean(dashboard?.mostrar_crise && metricas.alerta_crise)}
        />

        <section className="bg-white rounded-2xl px-6 py-6 border border-slate-100 space-y-3">
          <p className="text-[11px] uppercase text-slate-400">WhatsApp de suporte</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="tel"
              value={whatsappInput}
              onChange={(e) => setWhatsappInput(e.target.value)}
              placeholder="11999998888"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <button
              type="button"
              disabled={salvandoWpp}
              onClick={salvarWhatsapp}
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
            >
              {salvandoWpp ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
          {msgWpp && <p className="text-xs text-slate-500">{msgWpp}</p>}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl px-6 py-6 border border-slate-100">
            <p className="text-[11px] uppercase text-slate-400 mb-4">Link de avaliação</p>
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl bg-slate-50 border px-4 py-3 text-sm font-mono break-all">
                {linkAvaliacao}
              </div>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(linkAvaliacao);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 2000);
                }}
                className="px-5 py-3 rounded-xl bg-slate-900 text-white text-sm"
              >
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl px-6 py-6 border border-slate-100 flex flex-col items-center">
            <p className="text-[11px] uppercase text-slate-400 mb-4 self-start">QR Code</p>
            {qrUrl ? (
              <img src={qrUrl} alt="QR" className="w-40 h-40" />
            ) : (
              <p className="text-sm text-slate-400">Gerando…</p>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-sm font-semibold">Feedbacks privados</h2>
          </div>
          {criticas.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-slate-500">Nenhuma crítica no momento.</div>
          ) : (
            <ul>
              {criticas.map((r, i) => (
                <li key={r.id} className={`px-6 py-6 ${i < criticas.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium">{r.name}</span>
                    <Stars n={r.rating} />
                  </div>
                  {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
                  {r.ai_reply && (
                    <div className="mt-3 pl-3 border-l-2 border-slate-200">
                      <p className="text-[11px] uppercase text-slate-400 mb-1">Resposta IA</p>
                      <p className="text-sm text-slate-600">{r.ai_reply}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
