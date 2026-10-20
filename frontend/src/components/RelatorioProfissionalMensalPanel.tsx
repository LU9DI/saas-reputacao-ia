'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Download, ExternalLink, FileText } from 'lucide-react';
import { buildRelatorioMensalHtml, type RelatorioMensalSnapshot } from '../lib/relatorioMensalHtml';

type Props = {
  empresa: { id?: string; nome_empresa?: string; plan?: string };
  monthlyReports?: RelatorioMensalSnapshot[];
  lang?: string;
};

const COPY: Record<string, Record<string, string>> = {
  pt: {
    title: 'Relatório Inteligente Mensal',
    subtitle: 'Relatório profissional e didático do período. O conteúdo completo abre em uma nova aba.',
    period: 'Mês de referência',
    plan: 'Plano',
    companyFallback: 'Empresa',
    savedNote: 'Relatório salvo · abrir, baixar e reabrir são ilimitados e não consomem tokens.',
    aiMode: 'Análise profissional por IA',
    detMode: 'Análise baseada nos dados do período',
    noHistory: 'Ainda não há um relatório do mês de referência.',
    noHistoryDetail: 'O relatório é gerado automaticamente uma vez por mês, no dia da assinatura do plano. O painel usa apenas relatórios já salvos; este componente não solicita geração nem consome IA.',
    openReport: 'Abrir relatório em nova aba',
    openHint: 'A nova aba é montada no navegador a partir do snapshot já carregado. Nenhuma chamada ao backend é feita.',
    downloadReport: 'Baixar HTML',
    downloadHint: 'O download usa o mesmo snapshot salvo. Pode ser repetido quantas vezes quiser, sem consumir tokens.',
    openBlocked: 'Não foi possível abrir a nova aba. Verifique o bloqueador de pop-ups e tente novamente.',
  },
  en: {
    title: 'Monthly Intelligent Report',
    subtitle: 'Professional, didactic report for the period. The full content opens in a new tab.',
    period: 'Reporting month',
    plan: 'Plan',
    companyFallback: 'Company',
    savedNote: 'Report saved · opening, downloading and reopening are unlimited and do not consume tokens.',
    aiMode: 'Professional AI analysis',
    detMode: 'Analysis based on period data',
    noHistory: 'There is no report for the reference month yet.',
    noHistoryDetail: 'The report is generated automatically once a month on the plan subscription day. The dashboard uses only saved reports; this component does not request generation or consume AI.',
    openReport: 'Open report in a new tab',
    openHint: 'The new tab is built in the browser from the snapshot already loaded. No backend request is made.',
    downloadReport: 'Download HTML',
    downloadHint: 'The download uses the same saved snapshot. You can repeat it as many times as you want without consuming tokens.',
    openBlocked: 'Could not open the new tab. Check your pop-up blocker and try again.',
  },
  es: {
    title: 'Informe Inteligente Mensual',
    subtitle: 'Informe profesional y didáctico del período. El contenido completo se abre en una nueva pestaña.',
    period: 'Mes de referencia',
    plan: 'Plan',
    companyFallback: 'Empresa',
    savedNote: 'Informe guardado · abrir, descargar y reabrir son ilimitados y no consumen tokens.',
    aiMode: 'Análisis profesional por IA',
    detMode: 'Análisis basado en los datos del período',
    noHistory: 'Aún no hay un informe del mes de referencia.',
    noHistoryDetail: 'El informe se genera automáticamente una vez al mes, el día de la suscripción del plan. El panel solo usa informes guardados; este componente no solicita generación ni consume IA.',
    openReport: 'Abrir informe en una nueva pestaña',
    openHint: 'La nueva pestaña se monta en el navegador a partir del snapshot ya cargado. No se hace ninguna llamada al backend.',
    downloadReport: 'Descargar HTML',
    downloadHint: 'La descarga usa el mismo snapshot guardado. Puede repetirse tantas veces como quiera, sin consumir tokens.',
    openBlocked: 'No se pudo abrir la nueva pestaña. Verifique el bloqueador de ventanas emergentes e inténtelo de nuevo.',
  },
  zh: {
    title: '月度智能报告',
    subtitle: '专业的易懂报告。完整内容将在新标签页中打开。',
    period: '报告月份',
    plan: '套餐',
    companyFallback: '公司',
    savedNote: '报告已保存 · 打开、下载和重新打开均不限次数，不消耗 tokens。',
    aiMode: 'AI 专业分析',
    detMode: '基于期间数据的分析',
    noHistory: '参考月份暂无报告。',
    noHistoryDetail: '报告每月在订阅日自动生成一次。面板仅使用已保存的报告；此组件不会请求生成，也不会消耗 AI。',
    openReport: '在新标签页打开报告',
    openHint: '新标签页由浏览器基于已加载的快照生成，不会调用后端。',
    downloadReport: '下载 HTML',
    downloadHint: '下载使用同一份已保存的快照，可不限次数重复下载，不会消耗 tokens。',
    openBlocked: '无法打开新标签页。请检查弹窗拦截设置后重试。',
  },
};

function languageOf(name: unknown): string {
  const value = String(name || '').toLowerCase();
  if (value.includes('english') || value === 'en') return 'en';
  if (value.includes('español') || value.includes('espanol') || value === 'es') return 'es';
  if (value.includes('中文') || value.includes('chinese') || value === 'zh') return 'zh';
  return 'pt';
}

function fileSlug(value: unknown): string {
  return String(value || 'empresa')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'empresa';
}

export function RelatorioProfissionalMensalPanel({ empresa, monthlyReports = [], lang: languageName }: Props) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [openError, setOpenError] = useState('');
  const lang = languageOf(languageName);
  const t = COPY[lang] || COPY.pt;

  const savedReports = useMemo(
    () => monthlyReports
      .filter((report) => report && typeof report.periodo === 'string' && report.kpis
        && (!report.empresa?.id || report.empresa.id === String(empresa.id || '')))
      .slice()
      .sort((a, b) => String(b.periodo).localeCompare(String(a.periodo))),
    [monthlyReports, empresa.id],
  );

  const availableMonths = useMemo(
    () => Array.from(new Set(savedReports.map((report) => String(report.periodo)))),
    [savedReports],
  );

  const activeMonth = selectedMonth && availableMonths.includes(selectedMonth)
    ? selectedMonth
    : (availableMonths[0] || '');
  const activeReport = savedReports.find((report) => report.periodo === activeMonth) || null;

  // Todo o relatório é montado no navegador. Não há fetch, geração ou consumo de IA.
  const createReportUrl = () => {
    const html = buildRelatorioMensalHtml(activeReport as RelatorioMensalSnapshot, { plan: empresa.plan });
    return URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  };

  const openReport = () => {
    if (!activeReport) return;
    setOpenError('');
    const url = createReportUrl();
    const win = window.open(url, '_blank');
    if (!win) {
      URL.revokeObjectURL(url);
      setOpenError(t.openBlocked);
      return;
    }
    try { win.opener = null; } catch { /* navegador pode bloquear a atribuição */ }
    window.setTimeout(() => URL.revokeObjectURL(url), 120000);
  };

  const downloadReport = () => {
    if (!activeReport) return;
    setOpenError('');
    const url = createReportUrl();
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-mensal-${fileSlug(empresa.nome_empresa)}-${activeMonth || 'periodo'}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <section id="professional-report" className="scroll-mt-28 rounded-3xl border border-indigo-400/20 bg-linear-to-br from-indigo-500/8 via-zinc-950 to-zinc-950 p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <span className="rounded-xl border border-indigo-300/20 bg-indigo-400/10 p-3 text-indigo-200"><FileText size={22} /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-indigo-300">Filtra.AI</p>
            <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{t.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{t.subtitle}</p>
          </div>
        </div>
        {availableMonths.length > 0 && (
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-300 print:hidden">
            <CalendarDays size={15} />
            <span className="sr-only">{t.period}</span>
            <select
              aria-label={t.period}
              value={activeMonth}
              onChange={(event) => { setSelectedMonth(event.target.value); setOpenError(''); }}
              className="max-w-40 bg-transparent text-sm outline-hidden"
            >
              {availableMonths.map((month) => <option key={month} value={month} className="bg-zinc-900">{month}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="rounded-full border border-white/10 px-3 py-1.5">{empresa.nome_empresa || t.companyFallback}</span>
        <span className="rounded-full border border-white/10 px-3 py-1.5">{activeMonth || '—'}</span>
        <span className="rounded-full border border-white/10 px-3 py-1.5">{t.plan}: {String(empresa.plan || '—').toUpperCase()}</span>
      </div>

      {activeReport ? (
        <div className="mt-6 rounded-2xl border border-emerald-400/15 bg-emerald-400/4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200">
            <span>{t.savedNote}</span>
            <span>{activeReport.geracao?.modo === 'ia' ? t.aiMode : t.detMode}</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-300">{t.openHint}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openReport}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
            >
              <ExternalLink size={16} /> {t.openReport}
            </button>
            <button
              type="button"
              onClick={downloadReport}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
            >
              <Download size={16} /> {t.downloadReport}
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-zinc-500">{t.downloadHint}</p>
          {openError && <p className="mt-3 text-xs text-rose-300">{openError}</p>}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-zinc-400">
          <p>{t.noHistory}</p>
          <p className="mt-2 text-xs text-zinc-500">{t.noHistoryDetail}</p>
        </div>
      )}
    </section>
  );
}
