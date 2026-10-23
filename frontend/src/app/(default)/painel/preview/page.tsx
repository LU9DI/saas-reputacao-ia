import Link from 'next/link';
import { BrandMark } from '../../../components/BrandMark';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';

const distribution = [
  { label: '5★', value: 58 },
  { label: '4★', value: 22 },
  { label: '3★', value: 9 },
  { label: '2★', value: 6 },
  { label: '1★', value: 5 },
];

export default function PainelPreviewPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/80">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <BrandMark size="sm" href="/" subtitle="Preview" />
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <Link href="/" className="text-sm px-4 py-2 rounded-xl bg-indigo-600 text-white">Começar teste</Link>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 px-5 py-4 text-sm text-indigo-200">
          Esta é uma demonstração pública do painel. Os números abaixo são ilustrativos e não representam uma conta real.
        </div>
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">Painel de reputação</p>
            <h1 className="text-3xl font-bold mt-2">Hotel Exemplo</h1>
            <p className="text-sm text-zinc-500 mt-1">Plano TRIAL · ativo</p>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold">REPUTAÇÃO SAUDÁVEL</span>
        </section>
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ['Avaliações', '1.248', '+12%'],
            ['Nota média', '4,6★', '+0,2'],
            ['Positivas', '80%', '+8%'],
            ['Crises 24h', '2', 'monitoradas'],
          ].map(([title, value, detail]) => (
            <div key={title} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">{title}</p>
              <p className="text-2xl font-bold mt-3">{value}</p>
              <p className="text-xs text-zinc-500 mt-2">{detail}</p>
            </div>
          ))}
        </section>
        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <h2 className="font-semibold">Distribuição das avaliações</h2>
            <div className="mt-5 space-y-4">
              {distribution.map((item) => (
                <div key={item.label} className="grid grid-cols-[40px_1fr_45px] items-center gap-3 text-sm">
                  <span className="text-zinc-400">{item.label}</span>
                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: item.value + '%' }} />
                  </div>
                  <span className="text-right text-zinc-500">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <h2 className="font-semibold">Padrões identificados pela IA</h2>
            <div className="mt-5 space-y-3">
              <p className="rounded-xl border border-zinc-800 p-4 text-sm text-zinc-300">✓ Atendimento elogiado nas avaliações recentes.</p>
              <p className="rounded-xl border border-zinc-800 p-4 text-sm text-zinc-300">⚠ Tempo de resposta aparece como ponto de atenção.</p>
              <p className="rounded-xl border border-zinc-800 p-4 text-sm text-zinc-300">✓ Experiência do quarto mantém tendência positiva.</p>
            </div>
          </div>
        </section>
        <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Feedback recente</h2>
              <p className="text-xs text-zinc-500 mt-1">Exemplo de como o painel organiza sinais de experiência.</p>
            </div>
            <Link href="/" className="text-sm text-indigo-400">Ativar no meu negócio →</Link>
          </div>
          <div className="mt-5 grid gap-3">
            {[
              ['5★', '“Atendimento excelente e equipe muito atenciosa.”'],
              ['2★', '“O quarto estava bom, mas demoraram para resolver um pedido.”'],
              ['4★', '“Boa experiência geral. Voltaria novamente.”'],
            ].map(([rating, text]) => (
              <div key={text} className="rounded-xl border border-zinc-800 p-4 flex gap-4">
                <span className="text-sm font-semibold text-amber-400">{rating}</span>
                <p className="text-sm text-zinc-300">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-zinc-900 py-8 text-center text-xs text-zinc-600">
        Filtra.AI · demonstração pública · <Link href="/privacidade" className="underline">Privacidade</Link>
      </footer>
    </div>
  );
}
