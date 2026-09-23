'use client';

import { Bell, Bot, MessageSquare, Star, TrendingUp } from 'lucide-react';
import { BrandMark } from '../../components/BrandMark';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';

export default function PreviewClientPanel() {
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
            <a href="/preview/teste" className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white">
              Começar 7 dias
            </a>
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
          <span className="w-fit rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs text-emerald-300">
            TRIAL · ATIVO
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([value, title, trend]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <div className="flex items-start justify-between">
                <div className="text-2xl font-semibold text-white">{value}</div>
                <span className="text-[11px] text-emerald-400">{trend}</span>
              </div>
              <div className="mt-2 text-xs text-zinc-500">{title}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Evolução da reputação</div>
                <div className="mt-1 text-xs text-zinc-500">Últimos 14 dias</div>
              </div>
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <div className="mt-6 h-48 rounded-2xl bg-gradient-to-b from-indigo-500/15 to-transparent p-3">
              <svg viewBox="0 0 700 180" className="h-full w-full" role="img" aria-label="Evolução ilustrativa da reputação">
                <path d="M0 145 C70 132 90 142 145 116 S230 128 285 91 S380 104 430 69 S520 82 580 42 S640 53 700 20" fill="none" stroke="currentColor" strokeWidth="5" className="text-indigo-400" />
              </svg>
            </div>
          </section>

          <section className="rounded-3xl border border-indigo-400/15 bg-indigo-500/[0.06] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Bot size={17} className="text-indigo-300" /> IA encontrou 3 temas
            </div>
            <div className="mt-5 space-y-4">
              {[['Atendimento', 82], ['Tempo de espera', 64], ['Equipe', 91]].map(([name, value]) => (
                <div key={String(name)}>
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>{name}</span><span>{value}%</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                    <div className="h-1.5 rounded-full bg-indigo-400" style={{ width: String(value) + '%' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3 text-xs text-emerald-300">
              ✓ Relatório inteligente atualizado
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center gap-2 text-sm font-medium"><Bell size={16} className="text-amber-300" /> Alertas</div>
            <div className="mt-4 text-3xl font-semibold">3</div>
            <p className="mt-1 text-xs text-zinc-500">precisam de atenção hoje</p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center gap-2 text-sm font-medium"><MessageSquare size={16} className="text-indigo-300" /> Feedbacks recentes</div>
            <p className="mt-4 text-sm text-zinc-300">“Atendimento excelente, equipe muito atenciosa.”</p>
            <p className="mt-2 text-xs text-zinc-600">há 2 horas · Google</p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center gap-2 text-sm font-medium"><Star size={16} className="text-amber-300" /> Ações rápidas</div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-lg border border-white/10 px-3 py-2 text-zinc-400">QR Code</span>
              <span className="rounded-lg border border-white/10 px-3 py-2 text-zinc-400">WhatsApp</span>
              <span className="rounded-lg border border-white/10 px-3 py-2 text-zinc-400">Google</span>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Estrutura do painel</div>
              <div className="mt-1 text-xs text-zinc-500">Demonstração visual, sem conexão com a API.</div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {['Visão geral', 'Avaliações', 'Relatório IA', 'Alertas', 'Configurações'].map(item => (
                <span key={item} className="rounded-full border border-white/10 px-3 py-1.5">{item}</span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
