'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Download, FileText, Loader2, RefreshCw } from 'lucide-react';

type Props = {
  empresa: { id?: string; nome_empresa?: string; plan?: string };
  monthlyReports?: any[];
  lang?: string;
  gerando?: boolean;
  erro?: string;
  onGerar?: () => void;
};

const COPY: Record<string, Record<string, string>> = {
  pt: {
    title: 'Relatório Mensal',
    subtitle: 'Relatório profissional consolidado do mês selecionado.',
    period: 'Mês de referência',
    reviews: 'Avaliações',
    average: 'Nota média',
    positive: 'Positivas',
    critical: 'Críticas (1–3 estrelas)',
    summary: 'Resumo executivo',
    attention: 'Pontos de atenção',
    action: 'Plano de ação recomendado',
    units: 'Desempenho por unidade',
    priorities: 'Prioridades operacionais',
    themes: 'Temas recorrentes',
    sentiment: 'Sentimento',
    neutral: 'Neutras',
    negative: 'Negativas',
    strategicRadar: 'Radar estratégico',
    growth: 'Oportunidades de crescimento',
    noTags: 'Sem temas identificados nos dados deste período.',
    noRecommendations: 'Sem recomendações registradas.',
    noRadar: 'Sem sinais estratégicos adicionais neste ciclo.',
    download: 'Baixar PDF',
    generating: 'Gerando o relatório deste mês…',
    generate: 'Gerar relatório do mês',
    retry: 'Tentar novamente',
    savedNote: 'Relatório salvo · reaberturas e downloads ilimitados, sem novo consumo de IA.',
    aiMode: 'Análise profissional por IA',
    detMode: 'Análise baseada nos dados do período',
    noHistory: 'Ainda não há um relatório do mês de referência.',
  },
  en: {
    title: 'Monthly Report',
    subtitle: 'Consolidated professional report for the selected month.',
    period: 'Reporting month',
    reviews: 'Reviews',
    average: 'Average rating',
    positive: 'Positive',
    critical: 'Critical (1–3 stars)',
    summary: 'Executive summary',
    attention: 'Points to address',
    action: 'Recommended action plan',
    units: 'Performance by location',
    priorities: 'Operational priorities',
    themes: 'Recurring themes',
    sentiment: 'Sentiment',
    neutral: 'Neutral',
    negative: 'Negative',
    strategicRadar: 'Strategic radar',
    growth: 'Growth opportunities',
    noTags: 'No themes were identified in this period.',
    noRecommendations: 'No recommendations recorded.',
    noRadar: 'No additional strategic signals this cycle.',
    download: 'Download PDF',
    generating: 'Generating this month’s report…',
    generate: 'Generate this month’s report',
    retry: 'Try again',
    savedNote: 'Report saved · unlimited reopens and downloads, no additional AI usage.',
    aiMode: 'Professional AI analysis',
    detMode: 'Analysis based on period data',
    noHistory: 'There is no report for the reference month yet.',
  },
  es: {
    title: 'Informe mensual',
    subtitle: 'Informe profesional consolidado del mes seleccionado.',
    period: 'Mes de referencia',
    reviews: 'Reseñas',
    average: 'Calificación media',
    positive: 'Positivas',
    critical: 'Críticas (1–3 estrellas)',
    summary: 'Resumen ejecutivo',
    attention: 'Puntos de atención',
    action: 'Plan de acción recomendado',
    units: 'Rendimiento por unidad',
    priorities: 'Prioridades operativas',
    themes: 'Temas recurrentes',
    sentiment: 'Sentimiento',
    neutral: 'Neutras',
    negative: 'Negativas',
    strategicRadar: 'Radar estratégico',
    growth: 'Oportunidades de crecimiento',
    noTags: 'No se identificaron temas en este período.',
    noRecommendations: 'Sin recomendaciones registradas.',
    noRadar: 'Sin señales estratégicas adicionales en este ciclo.',
    download: 'Descargar PDF',
    generating: 'Generando el informe de este mes…',
    generate: 'Generar informe del mes',
    retry: 'Intentar de nuevo',
    savedNote: 'Informe guardado · reaperturas y descargas ilimitadas, sin nuevo consumo de IA.',
    aiMode: 'Análisis profesional por IA',
    detMode: 'Análisis basado en los datos del período',
    noHistory: 'Aún no hay un informe del mes de referencia.',
  },
  zh: {
    title: '月度报告',
    subtitle: '所选月份的专业汇总报告。',
    period: '报告月份',
    reviews: '评价数',
    average: '平均评分',
    positive: '好评',
    critical: '需关注（1–3 星）',
    summary: '执行摘要',
    attention: '关注事项',
    action: '建议行动计划',
    units: '各门店表现',
    priorities: '运营优先级',
    themes: '重复主题',
    sentiment: '情绪',
    neutral: '中性',
    negative: '消极',
    strategicRadar: '战略雷达',
    growth: '增长机会',
    noTags: '此期间未识别到主题。',
    noRecommendations: '暂无建议记录。',
    noRadar: '本周期暂无更多战略信号。',
    download: '下载 PDF',
    generating: '正在生成本月报告…',
    generate: '生成本月报告',
    retry: '重试',
    savedNote: '报告已保存 · 可无限次重新打开和下载，不再消耗 AI。',
    aiMode: 'AI 专业分析',
    detMode: '基于期间数据的分析',
    noHistory: '参考月份暂无报告。',
  },
};

function languageOf(name: unknown): string {
  const value = String(name || '').toLowerCase();
  if (value.includes('english') || value === 'en') return 'en';
  if (value.includes('español') || value.includes('espanol') || value === 'es') return 'es';
  if (value.includes('中文') || value.includes('chinese') || value === 'zh') return 'zh';
  return 'pt';
}

export function RelatorioProfissionalMensalPanel({ empresa, monthlyReports = [], lang: languageName, gerando = false, erro = '', onGerar }: Props) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const lang = languageOf(languageName);
  const t = COPY[lang] || COPY.pt;
  // A interface exibe apenas snapshots persistidos recebidos no payload do painel
  // (ou recém-gerados pelo endpoint de cache). O conteúdo não varia por plano.
  const savedReports = useMemo(
    () => monthlyReports
      .filter((r) => typeof r?.periodo === 'string' && r?.kpis && r?.empresa?.id === String(empresa.id || ''))
      .sort((a, b) => b.periodo.localeCompare(a.periodo)),
    [monthlyReports, empresa.id],
  );
  const availableMonths = savedReports.map((r) => r.periodo);
  const activeMonth = selectedMonth && availableMonths.includes(selectedMonth) ? selectedMonth : (availableMonths[0] || '');
  const activeReport = savedReports.find((r) => r.periodo === activeMonth) || null;
  const growthOpportunities = activeReport?.oportunidades_crescimento || [];
  const strategicRadar = activeReport?.radar_estrategico || [];
  const hasRadarSection = strategicRadar.length > 0 || growthOpportunities.length > 0;

  const baixarPdf = () => {
    const html = activeReport?.canais?.email?.html;
    if (!html || typeof window === 'undefined') return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(`${String(html)}<script>setTimeout(function(){window.print();},450);</script>`);
      win.document.close();
      return;
    }
    // Fallback (pop-up bloqueado): baixa o HTML pronto para impressão.
    const blob = new Blob([String(html)], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-mensal-${activeReport.periodo}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  return (
    <section id="professional-report" className="scroll-mt-28 rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/[0.08] via-zinc-950 to-zinc-950 p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <span className="rounded-xl border border-indigo-300/20 bg-indigo-400/10 p-3 text-indigo-200"><FileText size={22} /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-indigo-300">Filtra.AI</p>
            <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{t.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {activeReport && (
            <button type="button" onClick={baixarPdf} className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-200 hover:bg-indigo-500/20">
              <Download size={15} /> {t.download}
            </button>
          )}
          {availableMonths.length > 0 && (
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-300">
              <CalendarDays size={15} />
              <span className="sr-only">{t.period}</span>
              <select aria-label={t.period} value={activeMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="max-w-40 bg-transparent text-sm outline-none">
                {availableMonths.map((m) => <option key={m} value={m} className="bg-zinc-900">{m}</option>)}
              </select>
            </label>
          )}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="rounded-full border border-white/10 px-3 py-1.5">{empresa.nome_empresa || 'Empresa'}</span>
        <span className="rounded-full border border-white/10 px-3 py-1.5">{activeMonth || '—'}</span>
      </div>
      {gerando && !activeReport ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-indigo-400/15 bg-indigo-500/[0.05] px-4 py-5 text-sm text-indigo-100">
          <Loader2 size={18} className="animate-spin" />
          {t.generating}
        </div>
      ) : activeReport ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] px-4 py-3 text-xs text-emerald-200">
            <span>{t.savedNote}</span>
            <span>{activeReport.geracao?.modo === 'ia' ? t.aiMode : t.detMode}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[[String(activeReport.kpis.avaliacoes || 0), t.reviews], [activeReport.kpis.avaliacoes ? Number(activeReport.kpis.nota_media).toFixed(1) + '/5' : '—', t.average], [String(activeReport.kpis.percentual_positivas || 0) + '%', t.positive], [String(activeReport.kpis.criticas || 0), t.critical]].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-2xl font-semibold text-white">{value}</div>
                <div className="mt-1 text-xs text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
          <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-sm font-semibold text-white">{t.summary}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{activeReport.resumo_executivo || '—'}</p>
            {activeReport.narrativa?.por_que_importa && <p className="mt-3 text-sm leading-6 text-zinc-400">{activeReport.narrativa.por_que_importa}</p>}
          </article>
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-sm font-semibold text-white">{t.sentiment}</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[[t.positive, activeReport.sentimento?.positivo || 0], [t.neutral, activeReport.sentimento?.neutro || 0], [t.negative, activeReport.sentimento?.negativo || 0]].map(([name, count]) => (
                  <div key={String(name)} className="rounded-xl border border-white/5 px-3 py-2">
                    <div className="text-lg font-semibold text-white">{count}</div>
                    <div className="text-xs text-zinc-500">{name}</div>
                  </div>
                ))}
              </div>
              <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.themes}</h4>
              {[...(activeReport.temas?.atencao || []), ...(activeReport.temas?.positivos || [])].slice(0, 8).length ? (
                <ul className="mt-2 space-y-2">
                  {[...(activeReport.temas?.atencao || []), ...(activeReport.temas?.positivos || [])].slice(0, 8).map((theme: any, index: number) => (
                    <li key={String(theme.tema) + index} className="flex justify-between gap-3 rounded-xl border border-white/5 px-3 py-2 text-sm">
                      <span className="text-zinc-300">{theme.tema}</span>
                      <span className="text-zinc-500">{theme.volume}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-zinc-500">{t.noTags}</p>}
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-sm font-semibold text-white">{t.action}</h3>
              {activeReport.recomendacoes?.length ? (
                <ul className="mt-3 space-y-2">
                  {activeReport.recomendacoes.map((item: string, index: number) => (
                    <li key={index} className="rounded-xl border border-white/5 px-3 py-2 text-sm leading-5 text-zinc-300">{item}</li>
                  ))}
                </ul>
              ) : <p className="mt-3 text-sm text-zinc-400">{t.noRecommendations}</p>}
              {(activeReport.riscos?.length || 0) > 0 && (
                <>
                  <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-amber-300">{t.attention}</h4>
                  <ul className="mt-2 space-y-2">
                    {activeReport.riscos.map((item: any, index: number) => (
                      <li key={index} className="rounded-xl border border-amber-400/10 px-3 py-2 text-sm text-zinc-300">
                        <span className="font-medium">{item.titulo}</span>
                        <p className="mt-1 text-zinc-400">{item.evidencias}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </div>
          {(activeReport.ranking_unidades?.length || 0) > 0 && (
            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-sm font-semibold text-white">{t.units}</h3>
              <div className="mt-3 space-y-2">
                {activeReport.ranking_unidades.map((unit: any) => (
                  <div key={String(unit.id)} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 px-3 py-3">
                    <span className="text-sm text-zinc-300">{unit.posicao}. {unit.nome}</span>
                    <span className="text-xs text-zinc-500">{unit.avaliacoes} · {t.reviews}</span>
                    <span className="text-sm font-semibold text-white">{Number(unit.nota_media).toFixed(1)}/5</span>
                  </div>
                ))}
              </div>
            </article>
          )}
          {(activeReport.prioridades_operacionais?.length || 0) > 0 && (
            <article className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.02] p-5">
              <h3 className="text-sm font-semibold text-white">{t.priorities}</h3>
              <div className="mt-3 space-y-3">
                {activeReport.prioridades_operacionais.map((item: any, index: number) => (
                  <div key={index} className="rounded-xl border border-white/5 p-3">
                    <div className="text-sm font-semibold text-white">{String(item.prioridade || '').toUpperCase()} · {item.unidade}</div>
                    <p className="mt-1 text-sm text-zinc-400">{item.evidencia}</p>
                    <p className="mt-2 text-sm text-amber-100">{item.acao_recomendada}</p>
                  </div>
                ))}
              </div>
            </article>
          )}
          {hasRadarSection && (
            <article className="rounded-2xl border border-violet-400/15 bg-violet-400/[0.03] p-5">
              <h3 className="text-sm font-semibold text-white">{t.strategicRadar}</h3>
              {strategicRadar.length ? (
                <div className="mt-3 space-y-3">
                  {strategicRadar.map((item: any, index: number) => (
                    <div key={index} className="rounded-xl border border-white/5 p-3">
                      <div className="text-sm font-semibold text-white">{item.sinal}</div>
                      <p className="mt-1 text-sm text-zinc-400">{item.evidencia}</p>
                      <p className="mt-2 text-sm text-violet-100">{item.acao}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-2 text-sm text-zinc-400">{t.noRadar}</p>}
              {growthOpportunities.length > 0 && (
                <>
                  <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-emerald-300">{t.growth}</h4>
                  <div className="mt-2 space-y-2">
                    {growthOpportunities.map((item: any, index: number) => (
                      <div key={index} className="rounded-xl border border-white/5 p-3">
                        <div className="text-sm font-medium text-white">{item.titulo}</div>
                        <p className="mt-1 text-sm text-zinc-400">{item.evidencias}</p>
                        <p className="mt-2 text-sm text-zinc-300">{item.acao_recomendada}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </article>
          )}
        </div>
      ) : erro ? (
        <div className="mt-6 rounded-2xl border border-red-400/15 bg-red-500/[0.05] px-4 py-5 text-sm text-red-200">
          <p>{erro}</p>
          {onGerar && (
            <button type="button" onClick={onGerar} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-100 hover:bg-red-500/20">
              <RefreshCw size={14} /> {t.retry}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-zinc-400">
          <p>{gerando ? t.generating : t.noHistory}</p>
          {!gerando && onGerar && (
            <button type="button" onClick={onGerar} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-200 hover:bg-indigo-500/20">
              <FileText size={14} /> {t.generate}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
