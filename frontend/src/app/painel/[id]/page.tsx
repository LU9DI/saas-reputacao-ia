'use client';

import { useEffect, useState } from 'react';
import { Bell, Bot, MessageSquare, Star, TrendingUp } from 'lucide-react';
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

export function LocalPreviewPanel() {
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
            <a href="/preview/teste" className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white">Começar 7 dias</a>
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
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-center gap-2 text-sm font-medium"><Star size={16} className="text-amber-300"/> Ações rápidas</div><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-lg border border-white/10 px-3 py-2 text-zinc-400">QR Code</span><span className="rounded-lg border border-white/10 px-3 py-2 text-zinc-400">WhatsApp</span><span className="rounded-lg border border-white/10 px-3 py-2 text-zinc-400">Google</span></div></section>
        </div>

        <section className="mt-4 rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-semibold">Atalhos do painel</div><div className="mt-1 text-xs text-zinc-500">Uma estrutura mais limpa para as rotinas principais.</div></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-white/10 px-3 py-1.5">Visão geral</span><span className="rounded-full border border-white/10 px-3 py-1.5">Avaliações</span><span className="rounded-full border border-white/10 px-3 py-1.5">Relatório IA</span><span className="rounded-full border border-white/10 px-3 py-1.5">Alertas</span><span className="rounded-full border border-white/10 px-3 py-1.5">Configurações</span></div></div>
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
  const planLabel = String(empresa.plan || 'trial').toUpperCase();
  const status = empresa.status_acesso || String(empresa.status || '').toUpperCase();
  const reviews = Array.isArray(data.reviews) ? data.reviews : [];

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/80">
        <div className="max-w-5xl mx-auto px-6 md:px-10 pt-5 pb-2 flex items-center justify-between gap-3">
          <BrandMark size="sm" href="/" />
          <LanguageSwitcher compact />
        </div>
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">{empresa.nome_empresa}</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {t.panel_plan || 'Plano'}{' '}
              <span className="text-indigo-400 font-semibold">{planLabel}</span>
              <span
                className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${
                  status === 'ATIVO' || status === 'TRIAL'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {status}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!reportOk && (
              <span className="text-xs text-zinc-500">
                {t.panel_report_unavailable || 'Relatório inteligente nos planos Trial e Pro+'}
              </span>
            )}
            <button type="button" onClick={carregar} className="text-sm text-zinc-400 px-3 py-2">
              {t.panel_refresh || 'Atualizar'}
            </button>
            <button
              type="button"
              onClick={sair}
              className="text-sm px-3 py-2 rounded-xl border border-zinc-700 text-zinc-300"
            >
              {t.panel_logout || 'Sair'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-8">
        {reportOk && (
          <RelatorioInteligentePanel
            empresaId={empresaId}
            api={api}
            authHeaders={authHeaders}
            panelData={data}
          />
        )}

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

        <ReviewsList
          reviews={reviews}
          showCopiar={Boolean(dashboard?.mostrar_copiar_resposta ?? true)}
          showTratar={Boolean(dashboard?.mostrar_tratar ?? true)}
          apiBase={api}
          authHeaders={authHeaders}
          onRefresh={carregar}
        />

        <section className={`${card} px-6 py-6 space-y-3`}>
          <p className={label}>{t.panel_wpp_label || 'WhatsApp da empresa'}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="tel"
              value={whatsappInput}
              onChange={(e) => setWhatsappInput(e.target.value)}
              placeholder="11999998888"
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm"
            />
            <button
              type="button"
              onClick={salvarWhatsapp}
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium"
            >
              {t.panel_wpp_save || 'Salvar WhatsApp'}
            </button>
          </div>
          {msgWpp && <p className="text-xs text-zinc-500">{msgWpp}</p>}
        </section>

        <section className={`${card} px-6 py-6 space-y-3`}>
          <p className={label}>{t.panel_google_label || 'Link Google Maps / Reviews'}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={googleInput}
              onChange={(e) => setGoogleInput(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm"
            />
            <button
              type="button"
              onClick={salvarGoogle}
              className="px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium"
            >
              {t.panel_google_save || 'Salvar Google'}
            </button>
          </div>
          {msgGoogle && <p className="text-xs text-zinc-500">{msgGoogle}</p>}
        </section>

        <section className={`${card} px-6 py-6`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <BrandMark size="sm" href="/" subtitle="Online Reputation" />
              <p className={`${label} mt-4`}>{t.panel_review_link || 'Link de avaliação'}</p>
              <p className="mt-2 text-sm font-mono break-all text-zinc-400">{linkAvaliacao}</p>
            </div>
            {qrUrl && (
              <div className="flex flex-col items-center gap-2 shrink-0">
                <BrandMark size="sm" href={null} iconOnly subtitle={null} />
                <img
                  src={qrUrl}
                  alt="QR code — Filtra.AI"
                  className="w-36 h-36 rounded-lg border border-zinc-700"
                />
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                  {t.panel_qr_hint || 'Escaneie para avaliar'}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-900 py-8 text-center">
        <BrandMark size="sm" href="/" centered subtitle="Online Reputation" className="opacity-80" />
      </footer>
    </div>
  );
}
