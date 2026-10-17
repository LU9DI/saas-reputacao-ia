'use client';

import { useEffect, useState } from 'react';
import { Bell, Bot, FileText, LayoutDashboard, LogOut, MessageSquare, RefreshCw, Settings, ShieldCheck, Star, TrendingUp } from 'lucide-react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { getEnv } from '../../utils/env';
import { apiFetch } from '../../utils/apiFailover';
import { DashboardCharts } from '../../components/DashboardCharts';
import { PushEnable } from '../../components/PushEnable';
import { UsageBars } from '../../components/UsageBars';
import { SubscriptionActions } from '../../components/SubscriptionActions';
import { UnidadesPanel } from '../../components/UnidadesPanel';
import { WebAuthnSetup } from '../../components/WebAuthnSetup';
import { ReviewsList } from '../../components/ReviewsList';
import { BrandMark } from '../../components/BrandMark';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { RelatorioInteligentePanel } from '../../components/RelatorioInteligentePanel';
import { RelatorioProfissionalMensalPanel } from '../../../components/RelatorioProfissionalMensalPanel';
import { useLanguage } from '../../Contexts/LanguageContext';

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

/** Relatório inteligente: Trial e Pro+ (não no Inicial pago). */
function planAllowsReport(plan?: string, status?: string, dashboard?: any): boolean {
  if (dashboard?.pdf_disponivel || dashboard?.relatorio_disponivel) return true;
  if (dashboard?.trial_completo) return true;
  const p = String(plan || '').toLowerCase();
  const s = String(status || '').toLowerCase();
  if (p === 'trial' || p === 'teste' || p === 'test') return true;
  if (s === 'trial' || s === 'teste') return true;
  if (['pro', 'ultra', 'corporativo', 'rei'].includes(p)) return true;
  return false;
}

const card = 'bg-zinc-900 border border-zinc-800 rounded-2xl';
const label = 'text-[11px] uppercase tracking-wide text-zinc-500';

function LocalPreviewPanel() {
  const { t } = useLanguage();
  const cards = [
    ['4,8', 'Nota média', '↗ 0,3'],
    ['1.284', 'Avaliações', '↗ 12%'],
    ['91%', 'Positivas', '↗ 6,2%'],
    ['37', 'Pontos de atenção', '3 novos'],
  ];
  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100">
      <header className="border-b border-white/10 bg-zinc-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <BrandMark size="sm" href="/preview" subtitle="Reputação" />
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-zinc-500 sm:block">Modo demonstração · localhost</span>
            <LanguageSwitcher compact />
            <a href="/" className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white">{t.panel_start_trial || "Começar 7 dias"}</a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[.22em] text-indigo-400">Painel do cliente</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Hotel Aurora</h1>
            <p className="mt-2 text-sm text-zinc-500">Visão geral da reputação e dos sinais encontrados pela IA.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs text-emerald-300">TRIAL · ATIVO</span>
            <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-400">Atualizar</button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([value, title, trend]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-start justify-between"><div className="text-2xl font-semibold text-white">{value}</div><span className="text-[11px] text-emerald-400">{trend}</span></div><div className="mt-2 text-xs text-zinc-500">{title}</div></div>)}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="flex items-center justify-between"><div><div className="text-sm font-medium text-white">Evolução da reputação</div><div className="mt-1 text-xs text-zinc-500">Últimos 14 dias</div></div><TrendingUp size={18} className="text-emerald-400"/></div>
            <div className="mt-6 h-48 rounded-2xl bg-gradient-to-b from-indigo-500/15 to-transparent p-3">
              <svg viewBox="0 0 700 180" className="h-full w-full" role="img" aria-label="Evolução ilustrativa da reputação"><path d="M0 145 C70 132 90 142 145 116 S230 128 285 91 S380 104 430 69 S520 82 580 42 S640 53 700 20" fill="none" stroke="currentColor" strokeWidth="5" className="text-indigo-400"/></svg>
            </div>
          </section>
          <section className="rounded-3xl border border-indigo-400/15 bg-indigo-500/[0.06] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold"><Bot size={17} className="text-indigo-300"/> IA encontrou 3 temas</div>
            <div className="mt-5 space-y-4">
              {[['Atendimento',82],['Tempo de espera',64],['Equipe',91]].map(([name,value]) => <div key={String(name)}><div className="flex justify-between text-xs text-zinc-400"><span>{name}</span><span>{value}%</span></div><div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-indigo-400" style={{width: value + '%'}}/></div></div>)}
            </div>
            <div className="mt-6 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3 text-xs text-emerald-300">✓ Relatório inteligente atualizado</div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-center gap-2 text-sm font-medium"><Bell size={16} className="text-amber-300"/> Alertas</div><div className="mt-4 text-3xl font-semibold">3</div><p className="mt-1 text-xs text-zinc-500">precisam de atenção hoje</p></section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-center gap-2 text-sm font-medium"><MessageSquare size={16} className="text-indigo-300"/> Feedbacks recentes</div><p className="mt-4 text-sm text-zinc-300">“Atendimento excelente, equipe muito atenciosa.”</p><p className="mt-2 text-xs text-zinc-600">há 2 horas · Google</p></section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-center gap-2 text-sm font-medium"><Star size={16} className="text-amber-300"/> {t.panel_quick_actions}</div><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-lg border border-white/10 px-3 py-2 text-zinc-400">{t.panel_qr}</span><span className="rounded-lg border border-white/10 px-3 py-2 text-zinc-400">WhatsApp</span><span className="rounded-lg border border-white/10 px-3 py-2 text-zinc-400">Google</span></div></section>
        </div>

        <section className="mt-4 rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-semibold">{t.panel_shortcuts}</div><div className="mt-1 text-xs text-zinc-500">{t.panel_shortcuts_desc}</div></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-white/10 px-3 py-1.5">{t.panel_overview}</span><span className="rounded-full border border-white/10 px-3 py-1.5">{t.panel_reviews}</span><span className="rounded-full border border-white/10 px-3 py-1.5">{t.panel_ai_report}</span><span className="rounded-full border border-white/10 px-3 py-1.5">{t.panel_alerts}</span><span className="rounded-full border border-white/10 px-3 py-1.5">{t.panel_settings}</span></div></div>
        </section>
      </main>
    </div>
  );
}


export default function PainelEmpresa() {
  const params = useParams();
  const { t } = useLanguage();
  const empresaId = String(params?.id || '');
  const isLocalPreview = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && empresaId === 'preview';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [precisaLogin, setPrecisaLogin] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [whatsappInput, setWhatsappInput] = useState('');
  const [googleInput, setGoogleInput] = useState('');
  const [msgWpp, setMsgWpp] = useState('');
  const [msgGoogle, setMsgGoogle] = useState('');
  const api = getEnv('NEXT_PUBLIC_API_URL');
  const appOrigin =
    typeof window !== 'undefined' ? window.location.origin : getEnv('NEXT_PUBLIC_APP_URL');
  const linkAvaliacao = data?.links?.avaliacao || `${appOrigin}/avaliacao/${empresaId}`;

  const carregar = async () => {
    if (!empresaId) {
      setErro(t.panel_invalid_id || 'Identificador inválido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErro('');
    setPrecisaLogin(false);
    try {
      const res = await apiFetch(`/api/empresa/${empresaId}/painel`, {
        credentials: 'include',
        headers: authHeaders(false),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        setPrecisaLogin(true);
        throw new Error(json.error || t.panel_need_login || 'Faça login com a conta da empresa.');
      }
      if (!res.ok) throw new Error(json.error || `Erro ${res.status}`);
      setData(json);
      setWhatsappInput(json.empresa?.whatsapp || '');
      setGoogleInput(json.empresa?.google_review_url || '');
    } catch (e: any) {
      setErro(
        e.message === 'Failed to fetch'
          ? t.panel_offline || 'Não foi possível conectar ao servidor.'
          : e.message
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLocalPreview) return;
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

  const sair = async () => {
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(false),
      });
    } catch {
      /* */
    }
    try {
      localStorage.removeItem('filtra_token');
    } catch {
      /* */
    }
    window.location.href = '/login';
  };

  const salvarWhatsapp = async () => {
    setMsgWpp('');
    try {
      const res = await apiFetch(`/api/empresa/${empresaId}/whatsapp`, {
        method: 'PATCH',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ whatsapp: whatsappInput }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Falha');
      setMsgWpp(t.panel_wpp_saved || 'WhatsApp salvo.');
      await carregar();
    } catch (e: any) {
      setMsgWpp(e.message || 'Erro');
    }
  };

  const salvarGoogle = async () => {
    setMsgGoogle('');
    try {
      const res = await apiFetch(`/api/empresa/${empresaId}/google`, {
        method: 'PATCH',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ google_review_url: googleInput }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Falha');
      setMsgGoogle(t.panel_google_saved || 'Link Google salvo.');
      await carregar();
    } catch (e: any) {
      setMsgGoogle(e.message || 'Erro');
    }
  };

  if (isLocalPreview) return <LocalPreviewPanel />;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-zinc-500 text-sm">
        <BrandMark size="sm" href="/" />
        <span>{t.loading || 'Carregando…'}</span>
      </div>
    );
  }

  if (erro || !data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 px-6">
        <BrandMark size="sm" href="/" />
        <p className="text-zinc-400 text-sm text-center max-w-md">
          {erro || t.panel_unavailable || 'Painel indisponível.'}
        </p>
        {precisaLogin && (
          <a
            href={`/login?next=${encodeURIComponent(`/painel/${empresaId}`)}`}
            className="text-sm px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium"
          >
            {t.panel_go_login || 'Ir para login'}
          </a>
        )}
        <button type="button" onClick={carregar} className="text-sm underline text-indigo-400">
          {t.panel_retry || 'Tentar novamente'}
        </button>
      </div>
    );
  }

  const { empresa, metricas, dashboard } = data;
  const dist = metricas.distribuicao || [0, 0, 0, 0, 0];
  const nivel = dashboard?.nivel || 'basico';
  const reportOk = planAllowsReport(empresa.plan, empresa.status, dashboard);
  const reportMensalOk = ['pro', 'ultra', 'corporativo', 'corporate', 'corp', 'rei'].includes(String(empresa.plan || '').toLowerCase());
  const planLabel = String(empresa.plan || 'trial').toUpperCase();
  const status = empresa.status_acesso || String(empresa.status || '').toUpperCase();
  const reviews = Array.isArray(data.reviews) ? data.reviews : [];

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/10 bg-zinc-950/80 lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <BrandMark size="sm" href="/" subtitle="Online Reputation" />
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Navegação do painel">
            <a href="#overview" className="flex items-center gap-3 rounded-xl bg-indigo-500/10 px-3 py-2.5 text-sm font-medium text-indigo-200">
              <LayoutDashboard size={17} /> {t.panel_overview || 'Visão geral'}
            </a>
            {['corporativo', 'rei'].includes(String(empresa.plan || '').toLowerCase()) && (
              <a href="/dot" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
                <Bot size={17} /> Filtra Dot
              </a>
            )}
            <a href="#reviews" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
              <MessageSquare size={17} /> {t.panel_reviews || 'Avaliações'}
            </a>
            {reportMensalOk && <a href="#professional-report" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
              <FileText size={17} /> Relatório profissional
            </a>}
            <a href="#ai-report" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
              <Bot size={17} /> {t.panel_ai_report || 'Relatório IA'}
            </a>
            <a href="#alerts" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
              <Bell size={17} /> {t.panel_alerts || 'Alertas'}
            </a>
            <a href="#settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
              <Settings size={17} /> {t.panel_settings || 'Configurações'}
            </a>
          </nav>
          <div className="border-t border-white/10 p-3">
            <button type="button" onClick={sair} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
              <LogOut size={17} /> {t.panel_logout || 'Sair'}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050507]/95 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-[.18em] text-indigo-400">
                  Filtra.AI · {t.panel_overview || 'Painel'}
                </p>
                <h1 className="truncate text-lg font-semibold text-white sm:text-xl">{empresa.nome_empresa}</h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <LanguageSwitcher compact />
                <button type="button" onClick={carregar} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5" title={t.panel_refresh || 'Atualizar'}>
                  <RefreshCw size={15} /> <span className="hidden sm:inline">{t.panel_refresh || 'Atualizar'}</span>
                </button>
                <button type="button" onClick={sair} className="hidden items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 sm:inline-flex">
                  <LogOut size={15} /> {t.panel_logout || 'Sair'}
                </button>
              </div>
            </div>
            <div className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 lg:hidden">
              {[
                ['#overview', t.panel_overview || 'Visão geral'],
                ...(['corporativo', 'rei'].includes(String(empresa.plan || '').toLowerCase()) ? [['/dot', 'Filtra Dot']] : []),
                ['#reviews', t.panel_reviews || 'Avaliações'],
                ['#professional-report', 'Relatório profissional'],
                ['#ai-report', t.panel_ai_report || 'Relatório IA'],
                ['#alerts', t.panel_alerts || 'Alertas'],
                ['#settings', t.panel_settings || 'Configurações'],
              ].filter(([href]) => href !== '#professional-report' || reportMensalOk).map(([href, text]) => (
                <a key={href} href={href} className="shrink-0 rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5 hover:text-white">
                  {text}
                </a>
              ))}
            </div>
          </header>

          <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <section id="overview" className="scroll-mt-28">
              <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.2em] text-indigo-400">
                    {t.panel_dashboard || 'Painel do cliente'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{empresa.nome_empresa}</h2>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                      {planLabel} · {status}
                    </span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm text-zinc-500">
                    {t.panel_subtitle || 'Visão geral da reputação e dos sinais encontrados pela IA.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {dashboard?.tem_ia && <span className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-200"><Bot size={14} /> {t.panel_ai_active}</span>}
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400"><ShieldCheck size={14} /> {status}</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  [String(metricas.media ?? '—'), t.panel_average_rating || 'Nota média', '★'],
                  [String(metricas.total ?? reviews.length ?? 0), t.panel_reviews_total || 'Avaliações', ''],
                  [String(metricas.positivas ?? 0), t.panel_positive || 'Positivas', ''],
                  [String(metricas.crises_24h ?? 0), t.panel_attention || 'Pontos de atenção', '24h'],
                ].map(([value, title, suffix]) => (
                  <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-2xl font-semibold tracking-tight text-white">{value}{suffix === '★' ? '★' : ''}</div>
                      {suffix && suffix !== '★' && <span className="text-[11px] text-amber-300">{suffix}</span>}
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">{title}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <UsageBars
                  feedbackUsados={metricas.feedback_usados}
                  feedbackLimite={metricas.feedback_limite}
                  tokensUsados={metricas.tokens_usados}
                  tokensLimite={metricas.tokens_limite}
                  temIa={Boolean(dashboard?.tem_ia)}
                />
              </div>

              <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.025] p-1 sm:p-2">
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
              </div>

              {nivel === 'executivo' && Array.isArray(metricas.unidades_ranking) && metricas.unidades_ranking.length > 0 && (
                <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
                  {String(empresa.plan || '').toLowerCase() === 'corporativo' && metricas.unidades_resumo && (
                    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        ['Melhor unidade', metricas.unidades_resumo.melhor_unidade?.nome || '—', metricas.unidades_resumo.melhor_unidade?.nota ? String(metricas.unidades_resumo.melhor_unidade.nota) + '★' : ''],
                        ['Unidade em atenção', metricas.unidades_resumo.unidade_atencao?.nome || '—', metricas.unidades_resumo.unidade_atencao?.nota ? String(metricas.unidades_resumo.unidade_atencao.nota) + '★' : ''],
                        ['Maior evolução', metricas.unidades_resumo.maior_evolucao?.nome || '—', metricas.unidades_resumo.maior_evolucao?.delta ? '+' + String(metricas.unidades_resumo.maior_evolucao.delta) : ''],
                        ['Maior queda', metricas.unidades_resumo.maior_queda?.nome || '—', metricas.unidades_resumo.maior_queda?.delta ? String(metricas.unidades_resumo.maior_queda.delta) : ''],
                      ].map(([title, value, detail]) => (
                        <div key={String(title)} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="text-[10px] uppercase tracking-wide text-zinc-500">{title}</div>
                          <div className="mt-2 truncate text-sm font-semibold text-white">{value}</div>
                          {detail ? <div className="mt-1 text-xs text-zinc-500">{detail}</div> : null}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-400">Operação multi-unidades</p>
                      <h3 className="mt-1 text-lg font-semibold text-white">Ranking das unidades</h3>
                    </div>
                    <p className="text-xs text-zinc-500">Baseado nos feedbacks reais disponíveis no painel</p>
                  </div>
                  {String(empresa.plan || '').toLowerCase() === 'corporativo' && Array.isArray(metricas.unidades_insights) && metricas.unidades_insights.length > 0 && (
                    <div className="mb-5 grid gap-3 lg:grid-cols-2">
                      {metricas.unidades_insights.filter((u: any) => u.pontos_fortes?.length || u.pontos_atencao?.length).map((u: any) => (
                        <div key={u.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="text-sm font-semibold text-white">{u.nome}</div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div>
                              <div className="text-[10px] uppercase tracking-wide text-emerald-400">Pontos fortes</div>
                              <div className="mt-2 flex flex-wrap gap-1.5">{(u.pontos_fortes || []).map((x: any) => <span key={x.tag} className="rounded-lg border border-emerald-400/15 bg-emerald-400/5 px-2 py-1 text-[11px] text-emerald-200">{x.tag} · {x.count}</span>)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-wide text-amber-400">Pontos de atenção</div>
                              <div className="mt-2 flex flex-wrap gap-1.5">{(u.pontos_atencao || []).map((x: any) => <span key={x.tag} className="rounded-lg border border-amber-400/15 bg-amber-400/5 px-2 py-1 text-[11px] text-amber-200">{x.tag} · {x.count}</span>)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {String(empresa.plan || '').toLowerCase() === 'corporativo' && Array.isArray(metricas.prioridades_operacionais) && metricas.prioridades_operacionais.length > 0 && (
                    <div className="mb-5 rounded-2xl border border-indigo-400/15 bg-indigo-500/[0.04] p-4 sm:p-5">
                      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-indigo-400">Prioridades operacionais</div>
                          <h4 className="mt-1 text-base font-semibold text-white">O que a operação deve atacar agora</h4>
                        </div>
                        <span className="text-xs text-zinc-500">{metricas.prioridades_operacionais.length} prioridades derivadas dos feedbacks</span>
                      </div>
                      <div className="grid gap-3 lg:grid-cols-2">
                        {metricas.prioridades_operacionais.map((item: any) => (
                          <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={item.prioridade === 'alta' ? 'rounded-full border border-red-400/20 bg-red-400/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-300' : item.prioridade === 'media' ? 'rounded-full border border-amber-400/20 bg-amber-400/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-300' : 'rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-300'}>
                                    {item.prioridade === 'alta' ? 'Alta' : item.prioridade === 'media' ? 'Média' : 'Oportunidade'}
                                  </span>
                                  <span className="text-[11px] text-zinc-500">{item.unidade}</span>
                                </div>
                                <div className="mt-2 text-sm font-semibold text-white">{item.titulo}</div>
                              </div>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-zinc-400">{item.problema}</p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                                <div className="text-[9px] uppercase tracking-wide text-zinc-600">Nota</div>
                                <div className="mt-1 text-xs font-semibold text-zinc-200">{item.evidencia?.nota || '—'}</div>
                              </div>
                              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                                <div className="text-[9px] uppercase tracking-wide text-zinc-600">Tema</div>
                                <div className="mt-1 truncate text-xs font-semibold text-zinc-200">{item.evidencia?.tag || 'Desempenho'}</div>
                              </div>
                              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                                <div className="text-[9px] uppercase tracking-wide text-zinc-600">Tendência</div>
                                <div className={Number(item.evidencia?.tendencia_14d || 0) < 0 ? 'mt-1 text-xs font-semibold text-red-300' : 'mt-1 text-xs font-semibold text-emerald-300'}>
                                  {Number(item.evidencia?.tendencia_14d || 0) > 0 ? '+' : ''}{item.evidencia?.tendencia_14d || '0.0'}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 rounded-xl border border-indigo-400/10 bg-indigo-400/5 p-3">
                              <div className="text-[9px] uppercase tracking-wide text-indigo-300">Ação sugerida</div>
                              <div className="mt-1 text-xs leading-5 text-indigo-100">{item.acao_sugerida}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-sm">
                      <thead><tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wide text-zinc-500">
                        <th className="px-3 py-2">#</th><th className="px-3 py-2">Unidade</th><th className="px-3 py-2">Nota</th><th className="px-3 py-2">Tendência</th><th className="px-3 py-2">Feedbacks</th><th className="px-3 py-2">Positivas</th><th className="px-3 py-2">Situação</th>
                      </tr></thead>
                      <tbody>
                        {metricas.unidades_ranking.map((u: any, i: number) => (
                          <tr key={u.id} className="border-b border-white/5 last:border-0">
                            <td className="px-3 py-3 font-semibold text-zinc-500">{i + 1}</td>
                            <td className="px-3 py-3"><div className="font-medium text-zinc-100">{u.nome}</div>{u.cidade ? <div className="text-[11px] text-zinc-600">{u.cidade}</div> : null}</td>
                            <td className="px-3 py-3 font-semibold text-white">{u.nota ? u.nota + '★' : '—'}</td>
                            <td className={u.tendencia_14d > 0 ? 'px-3 py-3 font-medium text-emerald-400' : u.tendencia_14d < 0 ? 'px-3 py-3 font-medium text-red-400' : 'px-3 py-3 font-medium text-zinc-500'}>{u.tendencia_14d > 0 ? '+' : ''}{u.tendencia_14d || '0.0'}</td>
                            <td className="px-3 py-3 text-zinc-300">{u.feedbacks}</td>
                            <td className="px-3 py-3 text-zinc-300">{u.taxa_positiva}%</td>
                            <td className="px-3 py-3 text-xs font-semibold">{u.status === 'excelente' ? 'Excelente' : u.status === 'boa' ? 'Boa' : u.status === 'atencao' ? 'Atenção' : u.status === 'critica' ? 'Crítica' : 'Sem dados'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </section>

            {String(empresa.plan || '').toLowerCase() === 'rei' && metricas.radar_estrategico && (
              <section className="scroll-mt-28 rounded-3xl border border-violet-400/15 bg-violet-500/[0.04] p-5 sm:p-6">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-violet-300">REI · Inteligência estratégica</p>
                    <h3 className="mt-1 text-xl font-semibold text-white">Radar de crescimento, risco e demanda</h3>
                    <p className="mt-1 text-sm text-zinc-500">Sinais derivados dos feedbacks e da operação, sem gerar uma nova camada de análise duplicada.</p>
                  </div>
                  <span className="rounded-full border border-violet-400/15 bg-violet-400/5 px-3 py-1.5 text-[11px] text-violet-200">
                    {metricas.radar_estrategico.crescimento?.feedbacks_analisados || 0} feedbacks analisados
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-[10px] uppercase tracking-wide text-zinc-500">Clientes em risco</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{metricas.radar_estrategico.risco?.clientes_em_risco || 0}</div>
                    <div className="mt-1 text-xs text-zinc-500">sinais negativos fortes</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-[10px] uppercase tracking-wide text-zinc-500">Negativas 14d</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{metricas.radar_estrategico.risco?.negativas_14d || 0}</div>
                    <div className={Number(metricas.radar_estrategico.risco?.variacao_negativas_14d || 0) > 0 ? 'mt-1 text-xs text-red-300' : 'mt-1 text-xs text-emerald-300'}>
                      {Number(metricas.radar_estrategico.risco?.variacao_negativas_14d || 0) > 0 ? '+' : ''}{metricas.radar_estrategico.risco?.variacao_negativas_14d || 0} vs. 14d anteriores
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-[10px] uppercase tracking-wide text-zinc-500">Unidade referência</div>
                    <div className="mt-2 truncate text-sm font-semibold text-white">{metricas.radar_estrategico.crescimento?.unidade_referencia?.nome || '—'}</div>
                    <div className="mt-1 text-xs text-zinc-500">{metricas.radar_estrategico.crescimento?.unidade_referencia?.nota ? metricas.radar_estrategico.crescimento.unidade_referencia.nota + '★' : 'Sem dados'}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-[10px] uppercase tracking-wide text-zinc-500">Unidade crítica</div>
                    <div className="mt-2 truncate text-sm font-semibold text-white">{metricas.radar_estrategico.risco?.unidade_critica?.nome || '—'}</div>
                    <div className="mt-1 text-xs text-zinc-500">{metricas.radar_estrategico.risco?.unidade_critica?.nota ? metricas.radar_estrategico.risco.unidade_critica.nota + '★' : 'Sem dados'}</div>
                  </div>
                </div>

                {Array.isArray(metricas.oportunidades_estrategicas) && metricas.oportunidades_estrategicas.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-violet-400/10 bg-violet-400/[0.03] p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white">Top oportunidades estratégicas</div>
                        <div className="mt-1 text-xs text-zinc-500">Prioridade calculada por recorrência, abrangência, tendência, demanda e impacto percebido.</div>
                      </div>
                      <span className="text-[10px] uppercase tracking-wide text-violet-300">REI · 0–100</span>
                    </div>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      {metricas.oportunidades_estrategicas.slice(0, 10).map((item: any) => (
                        <div key={item.id} className="rounded-2xl border border-white/5 bg-black/20 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-violet-400/15 bg-violet-400/5 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-violet-200">
                                  {item.tipo || 'oportunidade'}
                                </span>
                                <span className={Number(item.score || 0) >= 70 ? 'text-xs font-semibold text-emerald-300' : Number(item.score || 0) >= 45 ? 'text-xs font-semibold text-amber-300' : 'text-xs font-semibold text-zinc-400'}>
                                  Score {item.score || 0}
                                </span>
                              </div>
                              <div className="mt-2 text-sm font-semibold text-white">{item.titulo}</div>
                            </div>
                            <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[9px] uppercase text-zinc-500">
                              {item.potencial === 'alto' ? 'Alto' : item.potencial === 'medio' ? 'Médio' : 'Baixo'}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-4">
                            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                              <div className="text-[9px] uppercase tracking-wide text-zinc-600">Ocorrências</div>
                              <div className="mt-1 text-xs font-semibold text-zinc-200">{item.evidencias?.ocorrencias || 0}</div>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                              <div className="text-[9px] uppercase tracking-wide text-zinc-600">Unidades</div>
                              <div className="mt-1 text-xs font-semibold text-zinc-200">{item.evidencias?.unidades_afetadas || 0}</div>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                              <div className="text-[9px] uppercase tracking-wide text-zinc-600">Tendência</div>
                              <div className={Number(item.evidencias?.tendencia_14d || 0) > 0 ? 'mt-1 text-xs font-semibold text-red-300' : 'mt-1 text-xs font-semibold text-zinc-300'}>
                                {Number(item.evidencias?.tendencia_14d || 0) > 0 ? '+' : ''}{item.evidencias?.tendencia_14d || 0}
                              </div>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                              <div className="text-[9px] uppercase tracking-wide text-zinc-600">Nota média</div>
                              <div className="mt-1 text-xs font-semibold text-zinc-200">{item.evidencias?.media_nota || '—'}</div>
                            </div>
                          </div>
                          <div className="mt-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.03] p-3">
                            <div className="text-[9px] uppercase tracking-wide text-emerald-300">Impacto no negócio</div>
                            <div className="mt-1 text-xs leading-5 text-zinc-300">{item.impacto_negocio}</div>
                          </div>
                          <div className="mt-2 rounded-xl border border-indigo-400/10 bg-indigo-400/[0.03] p-3">
                            <div className="text-[9px] uppercase tracking-wide text-indigo-300">Ação recomendada</div>
                            <div className="mt-1 text-xs leading-5 text-indigo-100">{item.acao_recomendada}</div>
                          </div>
                          {Array.isArray(item.unidades_afetadas) && item.unidades_afetadas.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {item.unidades_afetadas.slice(0, 6).map((u: any) => (
                                <span key={u.id} className="rounded-lg border border-white/5 bg-white/[0.02] px-2 py-1 text-[10px] text-zinc-500">
                                  {u.nome}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(metricas.radar_estrategico.sinais_crescimento) && metricas.radar_estrategico.sinais_crescimento.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.03] p-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">Sinais de crescimento</div>
                        <div className="mt-1 text-xs text-zinc-500">Demandas recorrentes que podem virar produto, expansão ou melhoria comercial.</div>
                      </div>
                      <span className="text-[10px] uppercase tracking-wide text-emerald-300">REI</span>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                      {metricas.radar_estrategico.sinais_crescimento.slice(0, 8).map((item: any) => (
                        <div key={item.tema} className="rounded-xl border border-white/5 bg-black/20 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="min-w-0 truncate text-xs font-semibold text-zinc-200">{item.tema}</span>
                            <span className="shrink-0 text-xs font-semibold text-emerald-300">{item.ocorrencias}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
                            <span>{item.tipo === 'demanda' ? 'Demanda' : item.tipo === 'expansao' ? 'Expansão' : 'Melhoria'}</span>
                            <span>{item.potencial === 'alto' ? 'Potencial alto' : item.potencial === 'medio' ? 'Potencial médio' : 'Sinal inicial'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  {[
                    ['Oportunidades percebidas', metricas.radar_estrategico.oportunidades, 'emerald'],
                    ['Temas críticos', metricas.radar_estrategico.temas_criticos, 'amber'],
                    ['Pedidos dos clientes', metricas.radar_estrategico.pedidos_clientes, 'violet'],
                  ].map(([title, items, tone]) => (
                    <div key={String(title)} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-sm font-semibold text-white">{title}</div>
                      <div className="mt-3 space-y-2">
                        {(Array.isArray(items) ? items : []).slice(0, 5).map((item: any) => (
                          <div key={item.tema} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                            <span className="min-w-0 truncate text-xs text-zinc-300">{item.tema}</span>
                            <span className={tone === 'emerald' ? 'shrink-0 text-xs font-semibold text-emerald-300' : tone === 'amber' ? 'shrink-0 text-xs font-semibold text-amber-300' : 'shrink-0 text-xs font-semibold text-violet-300'}>{item.ocorrencias}</span>
                          </div>
                        ))}
                        {(!Array.isArray(items) || items.length === 0) && <div className="py-4 text-xs text-zinc-600">Ainda não há sinal suficiente.</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {reportMensalOk && <RelatorioProfissionalMensalPanel empresa={empresa} monthlyReports={Array.isArray(data?.relatorios_profissionais_mensais) ? data.relatorios_profissionais_mensais : []} unidades={Array.isArray(metricas.unidades_ranking) ? metricas.unidades_ranking : []} lang={t.lang_name} />}

            <section id="ai-report" className="scroll-mt-28">
              {reportOk ? (
                <RelatorioInteligentePanel
                  empresaId={empresaId}
                  api={api}
                  authHeaders={authHeaders}
                  panelData={data}
                />
              ) : (
                <div className="rounded-3xl border border-indigo-400/15 bg-indigo-500/[0.05] p-6">
                  <div className="flex items-start gap-3">
                    <Bot className="mt-0.5 text-indigo-300" size={20} />
                    <div>
                      <h3 className="font-semibold text-white">{t.panel_ai_report || 'Relatório inteligente'}</h3>
                      <p className="mt-1 text-sm text-zinc-400">{t.panel_report_unavailable || 'Relatório inteligente disponível nos planos Trial e Pro+.'}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section id="reviews" className="scroll-mt-28">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.18em] text-indigo-400">{t.panel_reviews || 'Avaliações'}</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">{t.panel_feedback || 'Feedback dos clientes'}</h3>
                </div>
                <span className="text-xs text-zinc-500">{reviews.length} registros carregados</span>
              </div>
              <ReviewsList
                reviews={reviews}
                showCopiar={Boolean(dashboard?.mostrar_copiar_resposta ?? true)}
                showTratar={Boolean(dashboard?.mostrar_tratar ?? true)}
                apiBase={api}
                authHeaders={authHeaders}
                onRefresh={carregar}
              />
            </section>

            <section id="alerts" className="scroll-mt-28">
              <div className="rounded-3xl border border-amber-400/15 bg-amber-500/[0.04] p-6">
                <div className="flex items-start gap-3">
                  <Bell className="mt-0.5 text-amber-300" size={20} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white">{t.panel_alerts || 'Alertas'}</h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      {metricas.alerta_crise
                        ? (t.panel_crisis_alert || 'Há sinais de atenção nas avaliações recentes.')
                        : (t.panel_no_alerts || 'Nenhum alerta crítico identificado nas métricas disponíveis.')}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-2xl font-semibold text-white">{metricas.crises_24h ?? 0}</div>
                        <div className="mt-1 text-xs text-zinc-500">{t.panel_crises_24h}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-2xl font-semibold text-white">{metricas.negativas ?? 0}</div>
                        <div className="mt-1 text-xs text-zinc-500">{t.panel_critical_reviews}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-2xl font-semibold text-white">{metricas.positivas ?? 0}</div>
                        <div className="mt-1 text-xs text-zinc-500">{t.panel_positive_reviews}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="settings" className="scroll-mt-28 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-indigo-400">{t.panel_settings || 'Configurações'}</p>
                <h3 className="mt-1 text-xl font-semibold text-white">{t.panel_account_operation}</h3>
              </div>

              <WebAuthnSetup />
              <PushEnable />

              <SubscriptionActions
                empresaRef={empresaId}
                cancelAtPeriodEnd={Boolean(empresa.cancel_at_period_end)}
                expiraEm={empresa.expira_em}
                status={empresa.status}
              />

              <UnidadesPanel
                empresaRef={empresaId}
                enabled={
                  Boolean(dashboard?.trial_completo) ||
                  ['corporativo', 'rei'].includes(String(empresa.plan || '').toLowerCase())
                }
              />

              <div className="grid gap-4 lg:grid-cols-2">
                <section className={`${card} px-6 py-6 space-y-3`}>
                  <p className={label}>{t.panel_wpp_label || 'WhatsApp da empresa'}</p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="tel"
                      value={whatsappInput}
                      onChange={(e) => setWhatsappInput(e.target.value)}
                      placeholder="11999998888"
                      className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm"
                    />
                    <button type="button" onClick={salvarWhatsapp} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-500">
                      {t.panel_wpp_save || 'Salvar WhatsApp'}
                    </button>
                  </div>
                  {msgWpp && <p className="text-xs text-zinc-500">{msgWpp}</p>}
                </section>

                <section className={`${card} px-6 py-6 space-y-3`}>
                  <p className={label}>{t.panel_google_label || 'Link Google Maps / Reviews'}</p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="url"
                      value={googleInput}
                      onChange={(e) => setGoogleInput(e.target.value)}
                      placeholder="https://maps.google.com/..."
                      className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm"
                    />
                    <button type="button" onClick={salvarGoogle} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-500">
                      {t.panel_google_save || 'Salvar Google'}
                    </button>
                  </div>
                  {msgGoogle && <p className="text-xs text-zinc-500">{msgGoogle}</p>}
                </section>
              </div>

              <section className={`${card} px-6 py-6`}>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <BrandMark size="sm" href="/" subtitle="Online Reputation" />
                    <p className={`${label} mt-4`}>{t.panel_review_link || 'Link de avaliação'}</p>
                    <p className="mt-2 break-all font-mono text-sm text-zinc-400">{linkAvaliacao}</p>
                  </div>
                  {qrUrl && (
                    <div className="flex shrink-0 flex-col items-center gap-2">
                      <BrandMark size="sm" href={null} iconOnly subtitle={null} />
                      <img src={qrUrl} alt="QR code — Filtra.AI" className="h-36 w-36 rounded-lg border border-zinc-700" />
                      <p className="text-[10px] uppercase tracking-wider text-zinc-600">{t.panel_qr_hint || 'Escaneie para avaliar'}</p>
                    </div>
                  )}
                </div>
              </section>
            </section>
          </main>

          <footer className="border-t border-white/10 py-8 text-center">
            <BrandMark size="sm" href="/" centered subtitle="Online Reputation" className="opacity-80" />
          </footer>
        </div>
      </div>
    </div>
  );
}
