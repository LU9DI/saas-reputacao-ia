'use client';

import { useLanguage } from '../Contexts/LanguageContext';

/**
 * Explicação formal do Filtra.AI — textos via i18n (pt/en/es/zh).
 */
export function ComoFunciona() {
  const { t } = useLanguage();

  return (
    <section
      aria-labelledby="como-funciona-titulo"
      className="w-full max-w-4xl mx-auto mt-10 mb-8"
    >
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden">
        <div className="bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 px-6 md:px-10 py-9 md:py-11 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-200/90 mb-2">
            {t.how_badge || 'Filtra.AI — Orientação ao cliente'}
          </p>
          <h2
            id="como-funciona-titulo"
            className="text-xl md:text-2xl font-bold tracking-tight"
          >
            {t.how_title || 'Como funciona o sistema de gestão de avaliações'}
          </h2>
          <p className="mt-4 text-sm md:text-[15px] text-slate-300 leading-relaxed max-w-3xl">
            {t.how_intro ||
              'Este documento resume o funcionamento do Filtra.AI: da coleta da opinião do cliente à proteção da reputação da empresa, passando pelo Google Reviews e pelo apoio da IA no tratamento das críticas.'}
          </p>
        </div>

        <div className="px-6 md:px-10 py-9 md:py-11 space-y-10 text-sm text-slate-600 leading-relaxed">
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              {t.how_purpose_title || 'Finalidade do serviço'}
            </h3>
            <p>
              {t.how_purpose_p1 ||
                'O Filtra.AI fortalece a presença digital positiva e trata reclamações com discrição. Avaliações favoráveis vão ao Google; insatisfações ficam sob controle interno.'}
            </p>
            <p>
              {t.how_purpose_p2 ||
                'Assim a empresa analisa, corrige processos e responde antes de qualquer exposição pública indesejada.'}
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              {t.how_steps_title || 'Funcionamento passo a passo'}
            </h3>

            <div className="space-y-5">
              {(
                [
                  ['how_s1_t', 'how_s1_p'],
                  ['how_s2_t', 'how_s2_p'],
                  ['how_s3_t', 'how_s3_p'],
                  ['how_s4_t', 'how_s4_p'],
                  ['how_s5_t', 'how_s5_p'],
                  ['how_s6_t', 'how_s6_p'],
                  ['how_s7_t', 'how_s7_p'],
                ] as const
              ).map(([tk, pk]) => (
                <div key={tk}>
                  <h4 className="font-semibold text-slate-900">{(t as any)[tk]}</h4>
                  <p className="mt-1.5">{(t as any)[pk]}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-5 md:px-6 py-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.how_summary || 'Síntese operacional'}
            </p>
            <p>
              <strong className="text-slate-900 font-semibold">{t.how_sum_high}</strong>
            </p>
            <p>
              <strong className="text-slate-900 font-semibold">{t.how_sum_low}</strong>
            </p>
          </div>

          <p className="text-xs text-slate-400 text-center leading-relaxed pt-1 max-w-2xl mx-auto">
            {t.how_footer ||
              'O Filtra.AI não substitui o Google Reviews; orienta experiências positivas para lá e protege o negócio quando há insatisfação.'}
          </p>
        </div>
      </div>
    </section>
  );
}
