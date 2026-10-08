'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Lightbulb, Mail, MessageCircle, Send, TrendingUp } from 'lucide-react';
import { useLanguage } from '../Contexts/LanguageContext';

type Props = {
  empresaId: string;
  api: string;
  authHeaders: (json?: boolean) => HeadersInit;
  panelData?: any | null;
};

type Lang = 'pt' | 'en' | 'es' | 'zh';

const COPY: Record<Lang, any> = {
  pt: {
    title: 'Relatório profissional',
    subtitle: 'Um relatório estruturado para entender o que aconteceu, o que merece atenção e o que fazer agora.',
    month: 'Período',
    refresh: 'Atualizar',
    executive: 'Resumo executivo',
    why: 'Por que isso importa',
    where: 'Onde atuar agora',
    kpis: 'Indicadores principais',
    sentiment: 'Sentimento',
    themes: 'Temas recorrentes',
    positive: 'Pontos positivos',
    attention: 'Pontos de atenção',
    risks: 'Riscos',
    opportunities: 'Oportunidades',
    actions: 'Recomendações',
    plan: 'Seu plano',
    benefits: 'Benefícios incluídos',
    comparison: 'Como os planos evoluem',
    channels: 'Distribuir relatório',
    channelsHint: 'A mesma informação é adaptada para cada canal. A estrutura também fica pronta para automações e IA.',
    email: 'E-mail',
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    wechat: 'WeChat',
    send: 'Enviar relatório',
    sending: 'Enviando…',
    sent: 'Relatório encaminhado para distribuição.',
    sendError: 'Não foi possível distribuir agora. O relatório continua disponível no painel.',
    noData: 'Ainda não há avaliações válidas neste período.',
    noRisk: 'Nenhum risco prioritário identificado pelos dados disponíveis.',
    noOpportunity: 'Nenhuma oportunidade clara identificada pelos dados disponíveis.',
    all: 'Tudo do plano anterior',
    evaluations: 'avaliações',
    average: 'nota média',
    positiveRate: 'positivas',
    critical: 'críticas',
    unit: 'Unidades',
    next: 'Próximo plano',
  },
  en: {
    title: 'Professional report',
    subtitle: 'A structured report to understand what happened, what needs attention, and what to do next.',
    month: 'Period', refresh: 'Refresh', executive: 'Executive summary', kpis: 'Key indicators',
    sentiment: 'Sentiment', themes: 'Recurring themes', positive: 'Positive points', attention: 'Points of attention',
    risks: 'Risks', opportunities: 'Opportunities', actions: 'Recommendations', plan: 'Your plan',
    benefits: 'Included benefits', comparison: 'How plans evolve', channels: 'Distribute report',
    channelsHint: 'The same information is adapted to each channel. The structure is also ready for automation and AI.',
    email: 'Email', whatsapp: 'WhatsApp', sms: 'SMS', wechat: 'WeChat', send: 'Send report',
    sending: 'Sending…', sent: 'Report sent for distribution.', sendError: 'Distribution failed. The report remains available in the dashboard.',
    noData: 'There are no valid reviews for this period.', noRisk: 'No priority risk identified from available data.',
    noOpportunity: 'No clear opportunity identified from available data.', all: 'Everything from the previous plan',
    evaluations: 'reviews', average: 'average rating', positiveRate: 'positive', critical: 'critical',
    unit: 'Units', next: 'Next plan',
  },
  es: {
    title: 'Informe profesional',
    subtitle: 'Un informe estructurado para entender qué ocurrió, qué requiere atención y qué hacer ahora.',
    month: 'Período', refresh: 'Actualizar', executive: 'Resumen ejecutivo', kpis: 'Indicadores principales',
    sentiment: 'Sentimiento', themes: 'Temas recurrentes', positive: 'Puntos positivos', attention: 'Puntos de atención',
    risks: 'Riesgos', opportunities: 'Oportunidades', actions: 'Recomendaciones', plan: 'Tu plan',
    benefits: 'Beneficios incluidos', comparison: 'Cómo evolucionan los planes', channels: 'Distribuir informe',
    channelsHint: 'La misma información se adapta a cada canal. La estructura también está lista para automatización e IA.',
    email: 'Correo', whatsapp: 'WhatsApp', sms: 'SMS', wechat: 'WeChat', send: 'Enviar informe',
    sending: 'Enviando…', sent: 'Informe enviado para distribución.', sendError: 'No fue posible distribuirlo. El informe sigue disponible en el panel.',
    noData: 'Todavía no hay reseñas válidas en este período.', noRisk: 'No se identificaron riesgos prioritarios.',
    noOpportunity: 'No se identificaron oportunidades claras.', all: 'Todo lo del plan anterior',
    evaluations: 'reseñas', average: 'calificación media', positiveRate: 'positivas', critical: 'críticas',
    unit: 'Unidades', next: 'Siguiente plan',
  },
  zh: {
    title: '专业报告',
    subtitle: '用结构化信息说明发生了什么、哪里需要关注以及下一步应该做什么。',
    month: '期间', refresh: '刷新', executive: '执行摘要', kpis: '核心指标',
    sentiment: '情绪', themes: '重复主题', positive: '积极点', attention: '关注点',
    risks: '风险', opportunities: '机会', actions: '建议', plan: '当前方案',
    benefits: '包含的权益', comparison: '方案如何升级', channels: '分发报告',
    channelsHint: '同一份信息会适配不同渠道，结构也适合自动化和 AI 处理。',
    email: '邮箱', whatsapp: 'WhatsApp', sms: '短信', wechat: '微信', send: '发送报告',
    sending: '发送中…', sent: '报告已提交分发。', sendError: '暂时无法分发，报告仍可在面板查看。',
    noData: '本期间暂无有效评价。', noRisk: '根据现有数据未发现优先风险。',
    noOpportunity: '根据现有数据未发现明确机会。', all: '包含上一级方案全部权益',
    evaluations: '评价', average: '平均评分', positiveRate: '积极', critical: '需关注',
    unit: '单位', next: '下一方案',
  },
};

function langOf(value: string): Lang {
  return value === 'en' || value === 'es' || value === 'zh' ? value : 'pt';
}

function monthOptions(): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < 12; i += 1) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

function monthLabel(value: string, lang: Lang): string {
  const [year, month] = value.split('-');
  const names: Record<string, string[]> = {
    pt: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  };
  return `${names[lang][Number(month) - 1]}/${year}`;
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function RelatorioInteligentePanel({ empresaId, api, authHeaders }: Props) {
  const { language } = useLanguage();
  const lang = langOf(language);
  const t = COPY[lang];
  const months = useMemo(monthOptions, []);
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [destinations, setDestinations] = useState({ email: '', whatsapp: '', sms: '', wechat: '' });
  const [sending, setSending] = useState(false);
  const [sendMessage, setSendMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const base = String(api || '').replace(/\/+$/, '');
      const response = await fetch(
        `${base}/api/empresa/${encodeURIComponent(empresaId)}/relatorio?mes=${encodeURIComponent(month)}`,
        { credentials: 'include', headers: authHeaders(false), cache: 'no-store' },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(data?.error || `HTTP ${response.status}`));
      setReport(data);
    } catch (e) {
      setReport(null);
      setError(e instanceof Error ? e.message : 'Report unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [empresaId, api, month]);

  const send = async () => {
    const active = Object.entries(destinations).filter(([, value]) => String(value).trim());
    if (!active.length) {
      setSendMessage(t.channelsHint);
      return;
    }
    setSending(true);
    setSendMessage('');
    try {
      const base = String(api || '').replace(/\/+$/, '');
      const response = await fetch(
        `${base}/api/empresa/${encodeURIComponent(empresaId)}/relatorio/enviar`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { ...authHeaders(true), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mes: month,
            destinatarios: active.map(([canal, destino]) => ({ canal, destino })),
          }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(data?.error || t.sendError));
      setSendMessage(t.sent);
    } catch (e) {
      setSendMessage(e instanceof Error ? e.message : t.sendError);
    } finally {
      setSending(false);
    }
  };

  if (loading && !report) {
    return <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-400">{t.title}…</section>;
  }

  if (error && !report) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="text-lg font-bold text-white">{t.title}</h2><p className="mt-1 text-sm text-red-400">{error}</p></div>
          <button type="button" onClick={() => void load()} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200">{t.refresh}</button>
        </div>
      </section>
    );
  }

  const k = report?.kpis || {};
  const sentiment = report?.sentimento || {};
  const plan = report?.plano || {};
  const themes = report?.temas || {};
  const risks = Array.isArray(report?.riscos) ? report.riscos : [];
  const opportunities = Array.isArray(report?.oportunidades) ? report.oportunidades : [];
  const recommendations = Array.isArray(report?.recomendacoes) ? report.recomendacoes : [];
  const units = Array.isArray(report?.unidades) ? report.unidades : [];
  const comparison = Array.isArray(plan?.comparativo) ? plan.comparativo : [];
  const channels = report?.canais || {};

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-zinc-800 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-50"><FileText className="h-5 w-5 text-blue-400" />{t.title}</h2>
          <p className="mt-1 max-w-3xl text-sm text-zinc-400">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500">{t.month}
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="ml-2 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100">
              {months.map((m) => <option key={m} value={m}>{monthLabel(m, lang)}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => void load()} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200">{t.refresh}</button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-200">{t.executive}</h3>
          <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-200">{plan.nome || '—'}</span>
        </div>
        <p className="mt-3 text-base leading-7 text-zinc-200">{report?.resumo_executivo || t.noData}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">{t.why}</div>
            <p className="mt-1 text-sm leading-6 text-zinc-300">{report?.narrativa?.por_que_importa || '—'}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">{t.where}</div>
            <p className="mt-1 text-sm leading-6 text-zinc-300">{report?.narrativa?.onde_atuar || '—'}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [t.evaluations, k.avaliacoes ?? 0, 'text-zinc-50'],
          [t.average, Number(k.nota_media || 0).toFixed(1), 'text-zinc-50'],
          [t.positiveRate, `${k.percentual_positivas ?? 0}%`, 'text-emerald-400'],
          [t.critical, k.criticas ?? 0, 'text-red-400'],
        ].map(([label, value, color]) => (
          <div key={String(label)} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
            <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200"><TrendingUp className="h-4 w-4" />{t.sentiment}</h3>
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-zinc-400">
            <span>+ {sentiment.positivo ?? 0}</span><span>• {sentiment.neutro ?? 0}</span><span>− {sentiment.negativo ?? 0}</span>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">{t.themes}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {(themes.atencao || []).slice(0, 6).map((x: any) => <span key={x.tema} className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-zinc-300">{x.tema} · {x.volume}</span>)}
            {!(themes.atencao || []).length && <span className="text-sm text-zinc-500">—</span>}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-400"><CheckCircle2 className="h-4 w-4" />{t.positive}</h3>
          <div className="mt-3 space-y-2 text-sm text-zinc-400">
            {(themes.positivos || []).slice(0, 5).map((x: any) => <div key={x.tema} className="flex justify-between gap-4"><span>{x.tema}</span><b>{x.volume}</b></div>)}
            {!(themes.positivos || []).length && <span>—</span>}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-400"><AlertTriangle className="h-4 w-4" />{t.attention}</h3>
          <div className="mt-3 space-y-2 text-sm text-zinc-400">
            {risks.length ? risks.map((x: any, i: number) => <div key={`${x.titulo}-${i}`}><b className="text-zinc-200">{x.titulo}</b><p>{x.evidencias}</p></div>) : <span>{t.noRisk}</span>}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">{t.opportunities}</h3>
          <div className="mt-3 space-y-2 text-sm text-zinc-400">{opportunities.length ? opportunities.map((x: any, i: number) => <div key={`${x.titulo}-${i}`}><b className="text-zinc-200">{x.titulo}</b><p>{x.evidencias}</p></div>) : <span>{t.noOpportunity}</span>}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200"><Lightbulb className="h-4 w-4 text-yellow-400" />{t.actions}</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">{recommendations.map((x: string, i: number) => <li key={i}>• {x}</li>)}</ul>
        </div>
      </div>

      {units.length > 0 && (
        <div className="mt-5 rounded-xl border border-zinc-800 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">{t.unit}</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((u: any) => <div key={u.id} className="rounded-lg bg-zinc-900 p-3"><div className="font-medium text-zinc-200">{u.nome}</div><div className="mt-1 text-xs text-zinc-500">{u.avaliacoes} {t.evaluations} · {u.nota_media.toFixed(1)} {t.average}</div></div>)}
          </div>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-200">{t.plan}: {plan.nome || '—'}</h3><p className="mt-1 text-xs text-zinc-500">{plan.proximo_plano ? `${t.next}: ${plan.next_plan}` : ''}</p></div>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {(plan.beneficios_incluidos || []).map((x: string) => <li key={x} className="flex gap-2 text-sm text-zinc-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />{x}</li>)}
        </ul>
        <div className="mt-5 border-t border-indigo-500/10 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.comparison}</h4>
          <div className="mt-3 grid gap-2 md:grid-cols-5">
            {comparison.map((p: any) => <div key={p.codigo} className={`rounded-xl border p-3 ${p.codigo === plan.codigo ? 'border-indigo-400/50 bg-indigo-400/10' : 'border-zinc-800 bg-zinc-900/60'}`}><div className="text-sm font-semibold text-zinc-100">{p.nome}</div><div className="mt-2 text-xs leading-5 text-zinc-500">{p.beneficios.slice(-3).join(' · ')}</div></div>)}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-800 p-5">
        <div className="flex items-center gap-2"><Send className="h-4 w-4 text-blue-400" /><h3 className="text-sm font-semibold text-zinc-200">{t.channels}</h3></div>
        <p className="mt-1 text-xs text-zinc-500">{t.channelsHint}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {([
            ['email', t.email, Mail, 'email@empresa.com'],
            ['whatsapp', t.whatsapp, MessageCircle, '+55 62 99999-9999'],
            ['sms', t.sms, MessageCircle, '+55 62 99999-9999'],
            ['wechat', t.wechat, MessageCircle, 'ID / número'],
          ] as const).map(([key, label, Icon, placeholder]) => (
            <label key={key} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
              <span className="w-20 text-xs text-zinc-500">{label}</span>
              <input value={destinations[key]} onChange={(e) => setDestinations((prev) => ({ ...prev, [key]: e.target.value }))} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-700" />
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void send()} disabled={sending} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"><Send className="h-4 w-4" />{sending ? t.sending : t.send}</button>
          {sendMessage ? <span className="text-sm text-zinc-400">{sendMessage}</span> : null}
        </div>
      </div>

      <div className="mt-4 text-[11px] text-zinc-600">Filtra.AI · {report?.geracao?.modo === 'deterministico' ? 'dados estruturados do painel' : 'IA'}</div>
    </section>
  );
}
