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
import { SubscriptionActions } from '../../components/SubscriptionActions';
import { UnidadesPanel } from '../../components/UnidadesPanel';
import { WebAuthnSetup } from '../../components/WebAuthnSetup';

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

const card = 'bg-zinc-900 border border-zinc-800 rounded-2xl';
const label = 'text-[11px] uppercase tracking-wide text-zinc-500';

export default function PainelEmpresa() {
  const params = useParams();
  const empresaId = String(params?.id || '');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [precisaLogin, setPrecisaLogin] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [whatsappInput, setWhatsappInput] = useState('');
  const [googleInput, setGoogleInput] = useState('');
  const [msgWpp, setMsgWpp] = useState('');
  const [msgGoogle, setMsgGoogle] = useState('');
  const [msgPdf, setMsgPdf] = useState('');
  const [baixandoPdf, setBaixandoPdf] = useState(false);
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
    setPrecisaLogin(false);
    try {
      const res = await fetch(`${api}/api/empresa/${empresaId}/painel`, {
        credentials: 'include',
        headers: authHeaders(false),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        setPrecisaLogin(true);
        throw new Error(json.error || 'Faça login com a conta da empresa.');
      }
      if (!res.ok) throw new Error(json.error || `Erro ${res.status}`);
      setData(json);
      setWhatsappInput(json.empresa?.whatsapp || '');
      setGoogleInput(json.empresa?.google_review_url || '');
    } catch (e: any) {
      setErro(e.message === 'Failed to fetch' ? 'Não foi possível conectar ao servidor.' : e.message);
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

  const sair = async () => {
    try {
      await fetch(`${api}/api/auth/logout`, {
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
        throw new Error('Faça login e use um plano com PDF (trial/pro+).');
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
      setMsgPdf(`PDF de ${labelMes(mes)} baixado.`);
    } catch (e: any) {
      setMsgPdf(e.message || 'Falha no PDF');
    } finally {
      setBaixandoPdf(false);
    }
  };

  const salvarWhatsapp = async () => {
    setMsgWpp('');
    try {
      const res = await fetch(`${api}/api/empresa/${empresaId}/whatsapp`, {
        method: 'PATCH',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ whatsapp: whatsappInput }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Falha');
      setMsgWpp('WhatsApp salvo.');
      await carregar();
    } catch (e: any) {
      setMsgWpp(e.message || 'Erro');
    }
  };

  const salvarGoogle = async () => {
    setMsgGoogle('');
    try {
      const res = await fetch(`${api}/api/empresa/${empresaId}/google`, {
        method: 'PATCH',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ google_review_url: googleInput }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Falha');
      setMsgGoogle('Link Google salvo.');
      await carregar();
    } catch (e: any) {
      setMsgGoogle(e.message || 'Erro');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 text-sm">
        Carregando…
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
            className="text-sm px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium"
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

  const { empresa, metricas, dashboard } = data;
  const dist = metricas.distribuicao || [0, 0, 0, 0, 0];
  const nivel = dashboard?.nivel || 'basico';
  const pdfOk = Boolean(dashboard?.pdf_disponivel || dashboard?.plan_switch);
  const planLabel = String(empresa.plan || 'trial').toUpperCase();
  const status = empresa.status_acesso || String(empresa.status || '').toUpperCase();

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/80">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">{empresa.nome_empresa}</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Plano <span className="text-indigo-400 font-semibold">{planLabel}</span>
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
            {pdfOk && (
              <>
                <select
                  value={mesPdf}
                  onChange={(e) => setMesPdf(e.target.value)}
                  className="text-sm px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900"
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
                  {baixandoPdf ? 'Gerando…' : 'Baixar PDF'}
                </button>
              </>
            )}
            <button type="button" onClick={carregar} className="text-sm text-zinc-400 px-3 py-2">
              Atualizar
            </button>
            <button
              type="button"
              onClick={sair}
              className="text-sm px-3 py-2 rounded-xl border border-zinc-700 text-zinc-300"
            >
              Sair
            </button>
          </div>
        </div>
        {msgPdf && (
          <p className={`text-center text-xs pb-3 ${msgPdf.includes('baixado') ? 'text-emerald-400' : 'text-red-400'}`}>
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

        <WebAuthnSetup />
        <PushEnable />

        {data.integracoes && (
          <section className={`${card} px-5 py-4 text-xs text-zinc-500 space-y-1`}>
            <p className="text-[11px] uppercase tracking-wide font-medium text-zinc-500">Integrações</p>
            <p>
              Push:{' '}
              {data.integracoes.push
                ? '✓ VAPID ok'
                : '✗ Defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no backend/.env'}
            </p>
            <p>n8n: {data.integracoes.n8n ? '✓' : '○ opcional (N8N_WEBHOOK_URL)'}</p>
            <p>
              Stripe:{' '}
              {data.integracoes.stripe ? '✓' : '○ use troca de plano acima para testar sem Stripe'}
            </p>
            <p>
              Google:{' '}
              {data.integracoes.google_review ? '✓ cadastrado' : '✗ cole o link abaixo'}
            </p>
          </section>
        )}

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

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { t: 'Volume', v: metricas.total },
            { t: 'Média', v: metricas.media || '—' },
            { t: 'Positivas', v: metricas.positivas },
            { t: 'Críticas', v: metricas.negativas },
          ].map((k) => (
            <div key={k.t} className={`${card} px-5 py-5`}>
              <p className={label}>{k.t}</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{k.v}</p>
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
          <p className={label}>WhatsApp da empresa</p>
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
              Salvar WhatsApp
            </button>
          </div>
          {msgWpp && <p className="text-xs text-zinc-500">{msgWpp}</p>}
        </section>

        <section className={`${card} px-6 py-6 space-y-3`}>
          <p className={label}>Link Google Maps / Reviews</p>
          <p className="text-xs text-zinc-500">
            Notas 4–5★ redirecionam para este link. Não precisa de API key do Google.
          </p>
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
              Salvar Google
            </button>
          </div>
          {msgGoogle && <p className="text-xs text-zinc-500">{msgGoogle}</p>}
        </section>

        <section className={`${card} px-6 py-6`}>
          <p className={label}>Link de avaliação</p>
          <p className="mt-2 text-sm font-mono break-all text-zinc-400">{linkAvaliacao}</p>
          {qrUrl && <img src={qrUrl} alt="QR" className="mt-4 w-36 h-36 rounded-lg" />}
        </section>
      </main>
    </div>
  );
}
