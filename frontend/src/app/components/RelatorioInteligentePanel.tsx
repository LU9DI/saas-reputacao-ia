'use client';

import { useEffect, useState } from 'react';
import { Mail, Smartphone, Send } from 'lucide-react';
import { useLanguage } from '../Contexts/LanguageContext';

type Canal = 'telegram' | 'sms' | 'email' | 'wechat';

type Props = {
  empresaId: string;
  api: string;
  authHeaders: (json?: boolean) => HeadersInit;
  mesReport: string;
  langReport: string;
  mesesOpcoes: string[];
  labelMes: (m: string) => string;
  onMesChange: (m: string) => void;
  onLangChange: (l: string) => void;
  language: string;
};

const CANAL_IDS: Canal[] = ['telegram', 'sms', 'email', 'wechat'];

export function RelatorioInteligentePanel({
  empresaId,
  api,
  authHeaders,
  mesReport,
  langReport,
  mesesOpcoes,
  labelMes,
  onMesChange,
  onLangChange,
  language,
}: Props) {
  const { t } = useLanguage();
  const [ativos, setAtivos] = useState<Record<Canal, boolean>>({
    telegram: true,
    sms: false,
    email: true,
    wechat: false,
  });
  const [destinos, setDestinos] = useState<Record<Canal, string>>({
    telegram: '',
    sms: '',
    email: '',
    wechat: '',
  });
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const canalMeta: Record<
    Canal,
    { label: string; placeholder: string; icon: typeof Mail }
  > = {
    telegram: {
      label: t.canal_telegram || 'Telegram',
      placeholder: 'chat_id do Telegram',
      icon: Send,
    },
    sms: {
      label: t.canal_sms || 'SMS',
      placeholder: '5511999998888',
      icon: Smartphone,
    },
    email: {
      label: t.canal_email || 'E-mail',
      placeholder: 'gestor@empresa.com',
      icon: Mail,
    },
    wechat: {
      label: t.canal_wechat || 'WeChat',
      placeholder: 'wechat_id',
      icon: Send,
    },
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${api}/api/empresa/${empresaId}/relatorio/destinatarios`, {
          credentials: 'include',
          headers: authHeaders(false),
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data.destinatarios) ? data.destinatarios : [];
        if (cancelled || !list.length) return;
        const nextAtivos: Record<Canal, boolean> = {
          telegram: false,
          sms: false,
          email: false,
          wechat: false,
        };
        const nextDest: Record<Canal, string> = {
          telegram: '',
          sms: '',
          email: '',
          wechat: '',
        };
        for (const row of list) {
          const c = String(row.canal || '').toLowerCase() as Canal;
          if (!CANAL_IDS.includes(c)) continue;
          nextAtivos[c] = true;
          nextDest[c] = String(row.destino || '');
        }
        setAtivos(nextAtivos);
        setDestinos(nextDest);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, api]);

  const montarLista = () =>
    CANAL_IDS.filter((id) => ativos[id] && destinos[id].trim()).map((id) => ({
      canal: id,
      destino: destinos[id].trim(),
    }));

  const salvarDestinos = async () => {
    setSaving(true);
    setMsg('');
    setOk(false);
    try {
      const res = await fetch(`${api}/api/empresa/${empresaId}/relatorio/destinatarios`, {
        method: 'PUT',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify({ destinatarios: montarLista() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.report_save_fail || 'Falha ao salvar destinos');
      setOk(true);
      setMsg(t.report_saved || 'Destinos salvos.');
    } catch (e: any) {
      setMsg(e.message || t.report_save_fail || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const ativarEnviar = async () => {
    const lista = montarLista();
    if (!lista.length) {
      setMsg(t.report_need_channel || 'Selecione ao menos um canal e informe o destino.');
      setOk(false);
      return;
    }
    setLoading(true);
    setMsg('');
    setOk(false);
    try {
      await fetch(`${api}/api/empresa/${empresaId}/relatorio/destinatarios`, {
        method: 'PUT',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify({ destinatarios: lista }),
      });
      const res = await fetch(`${api}/api/empresa/${empresaId}/relatorio/enviar`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify({
          mes: mesReport,
          lang: langReport || language || 'pt',
          destinatarios: lista,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
      setOk(true);
      setMsg(data.message || t.report_sent || 'Relatório enviado pelos canais selecionados.');
    } catch (e: any) {
      setMsg(e.message || t.report_send_fail || 'Falha no envio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
            {t.panel_report_btn || t.feat_pdf || 'Relatório inteligente'}
          </h2>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed max-w-xl">
            {t.report_subtitle ||
              'Resumo operacional do período. Envio por Telegram, SMS, e-mail ou WeChat.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={mesReport}
            onChange={(e) => onMesChange(e.target.value)}
            className="text-sm px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950"
            aria-label={t.report_month || 'Mês'}
          >
            {mesesOpcoes.map((m) => (
              <option key={m} value={m}>
                {labelMes(m)}
              </option>
            ))}
          </select>
          <select
            value={langReport}
            onChange={(e) => onLangChange(e.target.value)}
            className="text-sm px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950"
            aria-label={t.panel_report_lang || 'Idioma do relatório'}
          >
            <option value="pt">PT</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="zh">ZH</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {CANAL_IDS.map((id) => {
          const { label, placeholder, icon: Icon } = canalMeta[id];
          return (
            <label
              key={id}
              className={`flex items-start gap-3 rounded-xl border px-3 py-3 cursor-pointer transition-colors ${
                ativos[id]
                  ? 'border-indigo-500/50 bg-indigo-500/5'
                  : 'border-zinc-800 bg-zinc-950/50'
              }`}
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={ativos[id]}
                onChange={(e) => setAtivos((s) => ({ ...s, [id]: e.target.checked }))}
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Icon size={14} /> {label}
                </span>
                <input
                  type="text"
                  disabled={!ativos[id]}
                  value={destinos[id]}
                  onChange={(e) => setDestinos((s) => ({ ...s, [id]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-950 disabled:opacity-40"
                />
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={salvarDestinos}
          className="text-sm px-4 py-2.5 rounded-xl border border-zinc-600 text-zinc-200 disabled:opacity-50"
        >
          {saving ? t.report_saving || 'Salvando…' : t.report_save || 'Salvar destinos'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={ativarEnviar}
          className="text-sm px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50 inline-flex items-center gap-2"
        >
          <Send size={16} />
          {loading
            ? t.report_sending || 'Enviando…'
            : t.report_send || 'Ativar e enviar relatório'}
        </button>
      </div>

      {msg && (
        <p className={`text-xs ${ok ? 'text-emerald-400' : 'text-amber-300'}`}>{msg}</p>
      )}
    </section>
  );
}
