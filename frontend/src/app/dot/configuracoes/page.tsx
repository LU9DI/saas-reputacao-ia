'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
const TOKEN_KEY = 'filtra_token';

function headers() {
  const h: Record<string,string> = { 'Content-Type': 'application/json' };
  try { const t = localStorage.getItem(TOKEN_KEY); if (t) h.Authorization = `Bearer ${t}`; } catch {}
  return h;
}

export default function DotSettingsPage() {
  const [p, setP] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/dot/preferences`, { headers: headers() })
      .then(r => r.json()).then(d => setP(d.preferences)).catch(() => undefined);
  }, []);

  async function save() {
    const r = await fetch(`${API_URL}/api/dot/preferences`, {
      method: 'PUT', headers: headers(), body: JSON.stringify(p)
    });
    if (r.ok) { setP((await r.json()).preferences); setSaved(true); setTimeout(() => setSaved(false), 1800); }
  }

  if (!p) return <main className="min-h-screen bg-black p-8 text-zinc-400">Carregando configurações do Dot…</main>;

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <a href="/dot" className="text-xs text-indigo-300">← Voltar para o Dot</a>
        <h1 className="mt-6 text-3xl font-semibold">Como o Dot deve agir?</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">Você controla o nível de autonomia. O Dot nunca executa uma ação externa sem a autorização exigida pela sua política.</p>

        <section className="mt-8 rounded-3xl border border-white/10 bg-zinc-950 p-6">
          <label className="text-sm font-semibold">Nível de autonomia</label>
          <select value={p.autonomy} onChange={e => setP({...p, autonomy:e.target.value})} className="mt-3 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm">
            <option value="observador">Observador — apenas monitora e avisa</option>
            <option value="assistente">Assistente — analisa e prepara recomendações</option>
            <option value="proativo">Proativo — detecta oportunidades e prepara ações</option>
            <option value="autonomo_controlado">Autônomo controlado — executa apenas ações previamente autorizadas</option>
          </select>
        </section>

        <section className="mt-4 space-y-3 rounded-3xl border border-white/10 bg-zinc-950 p-6">
          <div><label className="text-sm">Verificar a cada</label><select value={p.checkIntervalMinutes} onChange={e=>setP({...p,checkIntervalMinutes:Number(e.target.value)})} className="ml-3 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm"><option value="15">15 min</option><option value="30">30 min</option><option value="60">1 hora</option><option value="180">3 horas</option><option value="360">6 horas</option><option value="1440">1 vez/dia</option></select></div>
          {[
            ['immediateAlerts','Alertas imediatos'],
            ['dailySummary','Resumo diário'],
            ['alertOnRatingDrop','Avisar quando a nota cair abaixo do limite'],
            ['alertOnCriticalTheme','Detectar temas críticos recorrentes'],
            ['prepareActionsAutomatically','Preparar ações automaticamente'],
          ].map(([key,label]) => <label key={key} className="flex items-center justify-between border-t border-white/5 py-3 text-sm text-zinc-300"><span>{label}</span><input type="checkbox" checked={Boolean(p[key])} onChange={e=>setP({...p,[key]:e.target.checked})} /></label>)}
          <div className="border-t border-white/5 pt-4"><label className="text-sm">Limite de nota</label><input type="number" min="1" max="5" step="0.1" value={p.ratingFloor} onChange={e=>setP({...p,ratingFloor:Number(e.target.value)})} className="ml-3 w-24 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm" /></div>
        </section>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-zinc-500">Ações externas: aprovação obrigatória.</span>
          <button onClick={()=>void save()} className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium hover:bg-indigo-400">{saved ? 'Salvo ✓' : 'Salvar configurações'}</button>
        </div>
      </div>
    </main>
  );
}