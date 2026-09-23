'use client';

import { BrandMark } from '../../components/BrandMark';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';

const stats = [
  ['4,8', 'Nota média', '↗ 0,3'],
  ['1.284', 'Avaliações', '↗ 12%'],
  ['91%', 'Positivas', '↗ 6,2%'],
  ['37', 'Pontos de atenção', '3 novos'],
];

export default function PreviewClientPanel() {
  return (
    <main className="min-h-screen bg-[#050507] text-zinc-100">
      <header className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <BrandMark size="sm" href="/preview" subtitle="Reputação" />
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-zinc-500 sm:block">Modo demonstração · localhost</span>
            <LanguageSwitcher />
            <a href="/preview/teste" className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white">
              Começar 7 dias
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-indigo-400">Painel do cliente</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Hotel Aurora</h1>
            <p className="mt-2 text-sm text-zinc-500">Visão geral da reputação e dos sinais encontrados pela IA.</p>
          </div>
          <span className="w-fit rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs text-emerald-300">TRIAL · ATIVO</span>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([value, label, trend]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <div className="flex justify-between">
                <strong className="text-2xl">{value}</strong>
                <span className="text-xs text-emerald-400">{trend}</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">{label}</p>
            </div>
          ))}
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
            <p className="text-sm font-medium">Evolução da reputação</p>
            <p className="mt-1 text-xs text-zinc-500">Últimos 14 dias</p>
            <div className="mt-6 h-48 rounded-2xl bg-gradient-to-b from-indigo-500/15 to-transparent p-4">
              <svg viewBox="0 0 700 180" className="h-full w-full" aria-label="Evolução ilustrativa">
                <path d="M0 145 C70 132 90 142 145 116 S230 128 285 91 S380 104 430 69 S520 82 580 42 S640 53 700 20" fill="none" stroke="currentColor" strokeWidth="5" className="text-indigo-400" />
              </svg>
            </div>
          </div>

          <div className="rounded-3xl border border-indigo-400/15 bg-indigo-500/[0.06] p-6">
            <p className="text-sm font-semibold text-white">IA encontrou 3 temas</p>
            <div className="mt-6 space-y-5">
              {[
                ['Atendimento', '82%'],
                ['Tempo de espera', '64%'],
                ['Equipe', '91%'],
              ].map(([name, value]) => (
                <div key={name}>
                  <div className="flex justify-between text-xs text-zinc-400"><span>{name}</span><span>{value}</span></div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                    <div className="h-1.5 rounded-full bg-indigo-400" style={{ width: value }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-emerald-400/5 p-3 text-xs text-emerald-300">✓ Relatório inteligente atualizado</div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            ['Alertas', '3', 'precisam de atenção hoje'],
            ['Feedbacks recentes', '3', 'avaliações precisam de atenção'],
            ['Ações rápidas', 'QR · WhatsApp · Google', 'canais centralizados'],
          ].map(([title, value, text]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-4 text-2xl font-semibold">{value}</p>
              <p className="mt-1 text-xs text-zinc-500">{text}</p>
            </div>
          ))}
        </section>

        <section className="mt-4 rounded-3xl border border-white/10 bg-white/[0.025] p-6">
          <p className="text-sm font-semibold">Estrutura do painel</p>
          <p className="mt-1 text-xs text-zinc-500">Demonstração visual independente da API.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {['Visão geral', 'Avaliações', 'Relatório IA', 'Alertas', 'Configurações'].map(item => (
              <span key={item} className="rounded-full border border-white/10 px-3 py-1.5">{item}</span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
