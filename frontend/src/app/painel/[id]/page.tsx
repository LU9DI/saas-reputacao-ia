'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { getEnv } from '../../utils/env';
import { DashboardCharts } from '../../components/DashboardCharts';
import { currentMonthYYYYMM, validateReportMonth } from '../../utils/dateValidation';
import { PlanSwitcher } from '../../components/PlanSwitcher';
import { PushEnable } from '../../components/PushEnable';
import { UsageBars } from '../../components/UsageBars';

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
  client_whatsapp?: string | null;
  client_whatsapp_url?: string | null;
  client_whatsapp_anon?: boolean;
  treated?: boolean;
  treated_at?: string | null;
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
    tratadas?: number;
    pendentes_tratamento?: number;
    alerta_crise: boolean;
    crises_24h: number;
    distribuicao?: number[];
    top_tags?: { tag: string; count: number }[];
    serie_14d?: any[];
    feedback_usados?: number;
    feedback_limite?: number;
    tokens_usados?: number;
    tokens_limite?: number;
    tokens_pct?: number;
  };
  dashboard?: {
    nivel: string;
    pdf_disponivel: boolean;
    plan_switch?: boolean;
    mostrar_crise?: boolean;
    tem_ia?: boolean;
    trial_completo?: boolean;
    mostrar_whatsapp_cliente?: boolean;
    mostrar_copiar_resposta?: boolean;
    mostrar_ia_respostas?: boolean;
    mostrar_tratar?: boolean;
    mostrar_tendencia?: boolean;
    mostrar_tags?: boolean;
  };
  links?: { avaliacao: string; relatorio_pdf?: string | null; login?: string };
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
  const nome = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-400 text-[13px]" aria-hidden>
      {'★'.repeat(Math.min(5, Math.max(0, n)))}
      <span className="text-zinc-700">{'★'.repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

function authHeaders(json = true): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  try {
    const t = localStorage.getItem('filtra_token');
    if (t) h.Authorization = `Bearer ${t}`;
  } catch {
    /* */
  }
  return h;
}

const card = 'bg-zinc-900 border border-zinc-800 rounded-2xl';
const label = 'text-[11px] uppercase tracking-wide text-zinc-500';

export default function PainelEmpresa() {
  const params = useParams();
  const empresaId = String(params?.id || '');
  const [data, setData] = useState<PainelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [precisaLogin, setPrecisaLogin] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [whatsappInput, setWhatsappInput] = useState('');
  const [salvandoWpp, setSalvandoWpp] = useState(false);
  const [msgWpp, setMsgWpp] = useState('');
  const [baixandoPdf, setBaixandoPdf] = useState(false);
  const [msgPdf, setMsgPdf] = useState('');
  const [mesPdf, setMesPdf] = useState(currentMonthYYYYMM);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [tratandoId, setTratandoId] = useState<number | null>(null);
  const mesesOpcoes = useMemo(() => listarMesesOpcoes(18), []);
  const mesMax = currentMonthYYYYMM();
  const api = getEnv('NEXT_PUBLIC_API_URL');
  const appOrigin =
    typeof window !== 'undefined' ? window.location.origin : getEnv('NEXT_PUBLIC_APP_URL');
  const linkAvaliacao = data?.links?.avaliacao || `${appOrigin}/avaliacao/${empresaId}`;
  const loginUrl = data?.links?.login || `${appOrigin}/login`;

  const carregar = async () => {
    if (!empresaId) {
      setErro('Identificador inválido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErro('');
    setPrecisaLogin(false);
    try {
      const res = await fetch(`${api}/api/empresa/${empresaId}/painel`, {
        credentials: 'include',
        headers: authHeaders(false),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        setPrecisaLogin(true);
        throw new Error(
          json.error || 'Faça login com a conta da empresa para acessar o painel.'
        );
      }
      if (!res.ok) throw new Error(json.error || `Erro ${res.status}`);
      setData(json);
      setWhatsappInput(json.empresa?.whatsapp || '');
      const nextDrafts: Record<number, string> = {};
      for (const r of json.reviews || []) {
        if (r.rating <= 3) {
          nextDrafts[r.id] =
            r.ai_reply ||
            `Olá${r.name && r.name !== 'Anônimo' ? ` ${r.name}` : ''}, obrigado pelo feedback. Vamos analisar e retornar o mais breve possível.`;
        }
      }
      setDrafts(nextDrafts);
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
      color: { dark: '#e4e4e7', light: '#18181b' },
    })
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
        `${api}/api/empresa/${empresaId}/relatorio.pdf?mes=${encodeURIComponent(mes)}`,
        { credentials: 'include', headers: authHeaders(false) }
      );
      if (res.status === 401 || res.status === 403) {
        throw new Error('Faça login para baixar o PDF.');
      }
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
      const cache = res.headers.get('X-PDF-Cache');
      setMsgPdf(
        cache === 'HIT'
          ? `PDF de ${labelMes(mes)} baixado (cache — sem tokens).`
          : `PDF de ${labelMes(mes)} gerado e baixado (sem tokens de IA).`
      );
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
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ whatsapp: whatsappInput }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Faça login em /login para alterar o WhatsApp da empresa.');
        }
        throw new Error(json.error || 'Falha ao salvar');
      }
      setMsgWpp('WhatsApp salvo.');
      await carregar();
    } catch (e: any) {
      setMsgWpp(e.message || 'Erro');
    } finally {
      setSalvandoWpp(false);
    }
  };

  const marcarTratada = async (id: number, undo = false) => {
    setTratandoId(id);
    try {
      const res = await fetch(`${api}/api/reviews/${id}/tratar`, {
        method: 'PATCH',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ undo }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Falha ao atualizar');
      await carregar();
    } catch (e: any) {
      alert(e.message || 'Erro ao marcar como tratada');
    } finally {
      setTratandoId(null);
    }
  };

  const marcarCopiado = (key: string) => {
    setCopiadoId(key);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-sm text-zinc-500">Carregando…</p>
      </div>
    );
  }

  if (erro || !data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-zinc-400 text-sm text-center max-w-md">{erro || 'Painel indisponível.'}</p>
        {precisaLogin && (
          <a
            href={`/login?next=${encodeURIComponent(`/painel/${empresaId}`)}`}
            className="text-sm px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500"
          >
            Ir para login
          </a>
        )}
        <button type="button" onClick={carregar} className="text-sm underline text-indigo-400">
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
  const showWppCliente = dashboard?.mostrar_whatsapp_cliente !== false;
  const showCopiar = dashboard?.mostrar_copiar_resposta !== false;
  const showTratar = dashboard?.mostrar_tratar !== false;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">{empresa.nome_empresa}</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Dashboard · Plano <span className="font-semibold text-indigo-400">{planLabel}</span>
              {dashboard?.trial_completo ? (
                <span className="ml-2 text-emerald-400 font-medium">· Trial completo</span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pdfOk && (
              <>
                <select
                  value={mesPdf}
                  onChange={(e) => setMesPdf(e.target.value)}
                  className="text-sm px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100"
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
                  className="text-sm px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50"
                >
                  {baixandoPdf ? 'Gerando PDF…' : 'Baixar PDF'}
                </button>
              </>
            )}
            <button type="button" onClick={carregar} className="text-sm text-zinc-400 hover:text-zinc-100 px-3 py-2">
              Atualizar
            </button>
          </div>
        </div>
        {msgPdf && (
          <p
            className={`text-center text-xs pb-3 ${
              msgPdf.includes('baixado') || msgPdf.includes('gerado')
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}
          >
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
          <section className={`${card} px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
            <div>
              <p className={label}>Relatório mensal</p>
              <p className="text-sm text-zinc-400 mt-1">
                PDF do plano <strong className="text-zinc-200">{planLabel}</strong> — {labelMes(mesPdf)}.
                Pode baixar quantas vezes quiser — sem gastar tokens de IA.
              </p>
            </div>
            <button
              type="button"
              disabled={baixandoPdf}
              onClick={baixarPdf}
              className="text-sm px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50"
            >
              {baixandoPdf ? 'Gerando…' : 'Baixar relatório PDF'}
            </button>
          </section>
        )}

        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { t: 'Volume', v: metricas.total, c: '' },
            { t: 'Média', v: metricas.media || '—', c: '' },
            { t: 'Positivas', v: metricas.positivas, c: 'text-emerald-400' },
            { t: 'Críticas', v: metricas.negativas, c: 'text-red-400' },
            {
              t: 'Pendentes',
              v: metricas.pendentes_tratamento ?? metricas.negativas,
              c: 'text-amber-400',
            },
          ].map((k) => (
            <div key={k.t} className={`${card} px-5 py-5`}>
              <p className={label}>{k.t}</p>
              <p className={`mt-2 text-3xl font-bold tabular-nums ${k.c}`}>{k.v}</p>
            </div>
          ))}
        </section>

        <UsageBars
          feedbackUsados={metricas.feedback_usados}
          feedbackLimite={metricas.feedback_limite}
          tokensUsados={metricas.tokens_usados}
          tokensLimite={metricas.tokens_limite}
          temIa={Boolean(dashboard?.tem_ia)}
        />

        <DashboardCharts
          distribuicao={dist}
          positivas={metricas.positivas}
          negativas={metricas.negativas}
          serie={metricas.serie_14d || []}
          topTags={metricas.top_tags || []}
          nivel={nivel}
          crises24h={metricas.crises_24h}
          alertaCrise={Boolean(dashboard?.mostrar_crise && metricas.alerta_crise)}
          mostrarTendencia={dashboard?.mostrar_tendencia}
          mostrarTags={dashboard?.mostrar_tags}
        />

        <section className={`${card} px-6 py-6 space-y-3`}>
          <p className={label}>WhatsApp de suporte (empresa)</p>
          <p className="text-xs text-zinc-500">
            Número que aparece no formulário público de feedback (botão &quot;falar no WhatsApp&quot;).
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="tel"
              value={whatsappInput}
              onChange={(e) => setWhatsappInput(e.target.value)}
              placeholder="11999998888"
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              disabled={salvandoWpp}
              onClick={salvarWhatsapp}
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
            >
              {salvandoWpp ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
          {msgWpp && <p className="text-xs text-zinc-500">{msgWpp}</p>}
          {empresa.whatsapp_url && (
            <a
              href={empresa.whatsapp_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-sm text-emerald-400 hover:underline"
            >
              Testar link WhatsApp da empresa →
            </a>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className={`${card} px-6 py-6`}>
            <p className={`${label} mb-4`}>Link de avaliação</p>
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm font-mono break-all text-zinc-400">
                {linkAvaliacao}
              </div>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(linkAvaliacao);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 2000);
                }}
                className="px-5 py-3 rounded-xl bg-zinc-100 text-zinc-900 text-sm font-medium"
              >
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
          <div className={`${card} px-6 py-6 flex flex-col items-center`}>
            <p className={`${label} mb-4 self-start`}>QR Code</p>
            {qrUrl ? (
              <img src={qrUrl} alt="QR" className="w-40 h-40 rounded-xl" />
            ) : (
              <p className="text-sm text-zinc-500">Gerando…</p>
            )}
          </div>
        </section>

        <section className={`${card} overflow-hidden`}>
          <div className="px-6 py-5 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-200">Feedbacks privados</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Edite a resposta da IA, copie e marque como tratada após responder no WhatsApp
            </p>
          </div>
          {criticas.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-zinc-500">Nenhuma crítica no momento.</div>
          ) : (
            <ul>
              {criticas.map((r, i) => {
                const keyCopy = `copy-${r.id}`;
                const keyWa = `wa-${r.id}`;
                const waCliente = r.client_whatsapp_url;
                const draft =
                  drafts[r.id] ??
                  r.ai_reply ??
                  `Olá${r.name && r.name !== 'Anônimo' ? ` ${r.name}` : ''}, obrigado pelo feedback.`;
                return (
                  <li
                    key={r.id}
                    className={`px-6 py-6 ${i < criticas.length - 1 ? 'border-b border-zinc-800' : ''} ${
                      r.treated ? 'opacity-75' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-zinc-200">{r.name}</span>
                      <Stars n={r.rating} />
                      {r.treated && (
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Tratada
                        </span>
                      )}
                    </div>
                    {r.comment && <p className="text-sm text-zinc-400">{r.comment}</p>}

                    {(r.ai_reply || showCopiar) && (
                      <div className="mt-3 pl-3 border-l-2 border-indigo-500/40 space-y-2">
                        <p className="text-[11px] uppercase text-zinc-500">
                          {r.ai_reply ? 'Resposta IA (editável)' : 'Resposta sugerida (editável)'}
                        </p>
                        <textarea
                          value={draft}
                          onChange={(e) => setDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          rows={3}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {showCopiar && (
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await copiarTexto(draft);
                              if (ok) marcarCopiado(keyCopy);
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700"
                          >
                            {copiadoId === keyCopy ? 'Copiado!' : 'Copiar resposta'}
                          </button>
                        )}
                      </div>
                    )}

                    {showWppCliente && (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {waCliente ? (
                          <>
                            <a
                              href={waCliente}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500"
                            >
                              WhatsApp do cliente
                            </a>
                            <button
                              type="button"
                              onClick={async () => {
                                const ok = await copiarTexto(r.client_whatsapp || '');
                                if (ok) marcarCopiado(keyWa);
                              }}
                              className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700"
                            >
                              {copiadoId === keyWa ? 'Número copiado!' : 'Copiar número'}
                            </button>
                            <span className="text-xs text-zinc-500 font-mono">{r.client_whatsapp}</span>
                          </>
                        ) : r.client_whatsapp_anon ? (
                          <span className="text-xs text-zinc-500">WhatsApp anonimizado (LGPD)</span>
                        ) : (
                          <span className="text-xs text-amber-600/80">
                            WhatsApp do cliente não informado neste feedback
                          </span>
                        )}

                        {showTratar && (
                          <button
                            type="button"
                            disabled={tratandoId === r.id}
                            onClick={() => marcarTratada(r.id, Boolean(r.treated))}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium border ${
                              r.treated
                                ? 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
                                : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500'
                            } disabled:opacity-50`}
                          >
                            {tratandoId === r.id
                              ? '…'
                              : r.treated
                                ? 'Desfazer tratada'
                                : 'Marcar como tratada'}
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="text-center text-[11px] text-zinc-600">
          Sessão protegida ·{' '}
          <a href={loginUrl} className="underline hover:text-zinc-400">
            trocar conta
          </a>
        </p>
      </main>
    </div>
  );
}
