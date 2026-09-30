'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Diagnostic = {
  company: string;
  review_count: number;
  average_rating: number;
  positive_count: number;
  negative_count: number;
  summary?: string;
  strengths?: string[];
  risks?: string[];
  recurring_themes?: string[];
  actions?: string[];
  confidence?: string;
};

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function AuditoriaGratuitaPage() {
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [raw, setRaw] = useState('5 | Atendimento rápido e equipe muito atenciosa.\n4 | Quarto confortável, mas o check-in demorou.\n2 | Tive dificuldade para resolver um problema e esperei bastante.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);

  const reviews = useMemo(() => raw.split('\n').map((line) => {
    const [ratingPart, ...textParts] = line.split('|');
    return { rating: Number(ratingPart?.trim()), text: textParts.join('|').trim() };
  }).filter((r) => Number.isFinite(r.rating) && r.text.length >= 3), [raw]);

  async function registerConsent() {
    if (!consent || !email.trim()) return;
    const response = await fetch(API ? API.replace(/\/$/, '') + '/api/public/acquisition/consent' : '/api/public/acquisition/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), company: company.trim(), consent: true, source: 'auditoria-gratuita' }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || 'Não foi possível registrar o consentimento.');
    return data;
  }

  async function runDiagnostic() {
    setError('');
    setDiagnostic(null);
    if (!company.trim()) {
      setError('Informe o nome da empresa.');
      return;
    }
    if (!email.trim() || !consent) {
      setError('Informe seu e-mail e autorize o recebimento de comunicações da Filtra.AI para continuar.');
      return;
    }
    if (reviews.length < 3) {
      setError('Inclua pelo menos 3 avaliações reais, uma por linha, no formato: nota | texto.');
      return;
    }
    setLoading(true);
    try {
      const consentData = await registerConsent();
      const response = await fetch(API ? API.replace(/\/$/, '') + '/api/public/diagnostic' : '/api/public/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, locale: 'pt', reviews, lead_id: consentData?.lead_id || '' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Não foi possível gerar o diagnóstico.');
      setDiagnostic(data.diagnostic);
    } catch (e: any) {
      setError(e?.message || 'Diagnóstico indisponível no momento.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-zinc-100 px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Filtra.AI · diagnóstico gratuito</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Descubra o que suas avaliações estão dizendo.</h1>
          <p className="max-w-3xl text-lg leading-8 text-zinc-400">Cole avaliações reais da sua empresa e receba uma leitura objetiva dos pontos fortes, riscos, temas recorrentes e ações possíveis. O diagnóstico usa somente o conteúdo fornecido.</p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <label className="block text-sm font-medium">Empresa</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nome da empresa" className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-indigo-500" />

            <label className="block text-sm font-medium">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-indigo-500" />

            <label className="flex items-start gap-3 text-sm text-zinc-400">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
              <span>Autorizo a Filtra.AI a enviar informações sobre o diagnóstico, o teste de 7 dias e seus serviços. Posso cancelar a qualquer momento.</span>
            </label>

            <label className="block text-sm font-medium">Avaliações reais</label>
            <p className="text-xs text-zinc-500">Uma por linha: nota | texto. Não inclua dados pessoais de clientes.</p>
            <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={12} className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 font-mono text-sm outline-none focus:border-indigo-500" />
            <button onClick={runDiagnostic} disabled={loading || !company.trim() || !email.trim() || !consent} className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Gerando diagnóstico…' : 'Gerar diagnóstico gratuito'}
            </button>
            {error && <p className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            {!diagnostic ? (
              <div className="space-y-4 text-zinc-400">
                <h2 className="text-2xl font-semibold text-zinc-100">O que você recebe</h2>
                <ul className="space-y-3">
                  <li>• média e distribuição das notas fornecidas;</li>
                  <li>• pontos fortes identificados nas avaliações;</li>
                  <li>• riscos e temas que aparecem repetidamente;</li>
                  <li>• ações práticas baseadas no material analisado;</li>
                  <li>• indicação de confiança conforme a quantidade e clareza das evidências.</li>
                </ul>
                <p className="pt-4 text-sm">Nada é inventado: sem avaliações fornecidas, não há diagnóstico.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">{diagnostic.company}</h2>
                  <p className="mt-2 text-zinc-400">{diagnostic.review_count} avaliações · média {diagnostic.average_rating.toFixed(2)} · {diagnostic.positive_count} positivas · {diagnostic.negative_count} negativas</p>
                </div>
                <div><h3 className="font-semibold">Resumo</h3><p className="mt-2 text-zinc-300">{diagnostic.summary}</p></div>
                {diagnostic.strengths?.length ? <div><h3 className="font-semibold">Pontos fortes</h3><ul className="mt-2 space-y-2 text-zinc-300">{diagnostic.strengths.map((item) => <li key={item}>• {item}</li>)}</ul></div> : null}
                {diagnostic.risks?.length ? <div><h3 className="font-semibold">Riscos</h3><ul className="mt-2 space-y-2 text-zinc-300">{diagnostic.risks.map((item) => <li key={item}>• {item}</li>)}</ul></div> : null}
                {diagnostic.recurring_themes?.length ? <div><h3 className="font-semibold">Temas recorrentes</h3><ul className="mt-2 space-y-2 text-zinc-300">{diagnostic.recurring_themes.map((item) => <li key={item}>• {item}</li>)}</ul></div> : null}
                {diagnostic.actions?.length ? <div><h3 className="font-semibold">Ações sugeridas</h3><ul className="mt-2 space-y-2 text-zinc-300">{diagnostic.actions.map((item) => <li key={item}>• {item}</li>)}</ul></div> : null}
                <div className="rounded-xl border border-indigo-900 bg-indigo-950/30 p-4">
                  <p className="text-sm text-zinc-300">Este é um diagnóstico inicial. Para acompanhar avaliações, tendências e ações continuamente, conheça o teste de 7 dias da Filtra.AI.</p>
                  <Link href="/login?trial=7" className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-semibold">Continuar para o teste de 7 dias</Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
