'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useLanguage, type Language } from '../Contexts/LanguageContext';
import { SeoPageHeader } from '../components/SeoPageHeader';


const COPY:Record<Language,Record<string,string>>={
pt:{ey:'{c.ey}',h1:'{c.h1}',lead:'Descubra o que seus clientes estão elogiando, reclamando e repetindo — e transforme isso em prioridades de melhoria. Cole avaliações reais e receba um diagnóstico inicial gratuito.',s1:'{c.s1}',p1:'Uma auditoria é uma leitura estruturada da reputação apresentada pelo conjunto de avaliações analisado. O diagnóstico procura distribuição das notas, pontos fortes, riscos e temas recorrentes.',s2:'{c.s2}',experience:'Experiência',reputation:'Reputação',recurrence:'Recorrência',action:'Ação',s3:'{c.s3}',s4:'{c.s4}',s5:'{c.s5}',s6:'{c.s6}',company:'{c.company}',email:'{c.email}',optional:'opcional',reviews:'{c.reviews}',format:'{c.format}',consent:'Quero receber da Filtra.AI informações sobre o diagnóstico, o teste de 7 dias e seus serviços. O consentimento é opcional.',run:'{c.run}',loading:'{c.loading}',receive:'{c.receive}',none:'{c.none}',trial:'{c.trial}',nav1:'{c.nav1}',nav2:'{c.nav2}',nav3:'{c.nav3}',nav4:'{c.nav4}'},
en:{ey:'Filtra.AI · free diagnostic',h1:'Free review and online reputation audit',lead:'Discover what customers praise, complain about and repeat — then turn it into improvement priorities. Paste real reviews and receive an initial free diagnostic.',s1:'What is a review audit?',p1:'An audit is a structured reading of the reputation shown by the review set provided. It looks for rating distribution, strengths, risks and recurring themes.',s2:'What the diagnostic checks',experience:'Experience',reputation:'Reputation',recurrence:'Recurrence',action:'Action',s3:'Who it is for',s4:'How to use the result',s5:'An audit is more than a score',s6:'Privacy and data quality',company:'Company',email:'Email',optional:'optional',reviews:'Real reviews',format:'One per line: rating | text. Do not include customer personal data.',consent:'I want to receive Filtra.AI information about the diagnostic, 7-day trial and services. Consent is optional.',run:'Generate my free diagnostic',loading:'Generating diagnostic…',receive:'What you receive',none:'Nothing is invented: without reviews provided, there is no diagnostic.',trial:'Continue to the 7-day trial',nav1:'Customer feedback',nav2:'AI review analysis',nav3:'Online reputation',nav4:'Plans'},
es:{ey:'{c.ey}',h1:'Auditoría gratuita de reseñas y reputación online',lead:'Descubre qué elogian, critican y repiten tus clientes y conviértelo en prioridades de mejora. Pega reseñas reales y recibe un diagnóstico inicial gratuito.',s1:'¿Qué es una auditoría de reseñas?',p1:'Una auditoría es una lectura estructurada de la reputación mostrada por las reseñas proporcionadas. Busca distribución de notas, fortalezas, riesgos y temas recurrentes.',s2:'Qué verifica el diagnóstico',experience:'Experiencia',reputation:'Reputación',recurrence:'Recurrencia',action:'Acción',s3:'Para quién sirve',s4:'Cómo usar el resultado',s5:'Una auditoría es más que una nota',s6:'Privacidad y calidad de datos',company:'{c.company}',email:'Correo',optional:'opcional',reviews:'Reseñas reales',format:'Una por línea: nota | texto. No incluyas datos personales de clientes.',consent:'Quiero recibir información de Filtra.AI sobre el diagnóstico, la prueba de 7 días y sus servicios. El consentimiento es opcional.',run:'Generar mi diagnóstico gratuito',loading:'Generando diagnóstico…',receive:'Qué recibes',none:'Nada se inventa: sin reseñas proporcionadas no hay diagnóstico.',trial:'Continuar a la prueba de 7 días',nav1:'{c.nav1}',nav2:'Análisis de reseñas con IA',nav3:'Gestión de reputación',nav4:'Planes'},
zh:{ey:'Filtra.AI · 免费诊断',h1:'免费评价与在线声誉审计',lead:'发现客户赞扬、抱怨和反复提及的内容，并将其转化为改进重点。粘贴真实评价即可获得初步免费诊断。',s1:'什么是评价审计？',p1:'审计是对所提供评价集合进行结构化分析，关注评分分布、优势、风险和重复主题。',s2:'诊断检查什么',experience:'体验',reputation:'声誉',recurrence:'重复性',action:'行动',s3:'适合谁',s4:'如何使用结果',s5:'审计不只是一个分数',s6:'隐私与数据质量',company:'企业',email:'电子邮件',optional:'可选',reviews:'真实评价',format:'每行一条：评分 | 文本。请勿包含客户个人数据。',consent:'我希望接收 Filtra.AI 关于诊断、7 天试用和服务的信息。授权是可选的。',run:'生成我的免费诊断',loading:'正在生成诊断…',receive:'您将获得',none:'不虚构任何内容：没有提供评价就不会生成诊断。',trial:'继续进行 7 天试用',nav1:'客户反馈',nav2:'AI 评价分析',nav3:'在线声誉',nav4:'套餐'}};
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

export function AuditoriaGratuitaClient() {
  const { language } = useLanguage();
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [raw, setRaw] = useState(
    '5 | Atendimento rápido e equipe muito atenciosa.\n4 | Quarto confortável, mas o check-in demorou.\n2 | Tive dificuldade para resolver um problema e esperei bastante.'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);

  const reviews = useMemo(
    () =>
      raw
        .split('\n')
        .map((line) => {
          const [ratingPart, ...textParts] = line.split('|');
          return { rating: Number(ratingPart?.trim()), text: textParts.join('|').trim() };
        })
        .filter((r) => Number.isFinite(r.rating) && r.text.length >= 3),
    [raw]
  );

  async function registerConsent() {
    if (!consent || !email.trim()) return;
    const response = await fetch(
      API ? API.replace(/\/$/, '') + '/api/public/acquisition/consent' : '/api/public/acquisition/consent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          company: company.trim(),
          consent: true,
          source: 'auditoria-gratuita',
        }),
      }
    );
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
    if (consent && !email.trim()) {
      setError('Informe seu e-mail para registrar o consentimento.');
      return;
    }
    if (reviews.length < 3) {
      setError('Inclua pelo menos 3 avaliações reais, uma por linha, no formato: nota | texto.');
      return;
    }
    setLoading(true);
    try {
      const consentData = consent ? await registerConsent() : null;
      const response = await fetch(
        API ? API.replace(/\/$/, '') + '/api/public/diagnostic' : '/api/public/diagnostic',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company,
            locale: language,
            reviews,
            lead_id: consentData?.lead_id || '',
          }),
        }
      );
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
    <>
      <SeoPageHeader />
      <main className="min-h-screen bg-black text-zinc-100 px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
            {c.ey}
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            {c.h1}
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-zinc-400">
            {c.lead}
            em prioridades de melhoria. Cole avaliações reais e receba um diagnóstico inicial gratuito, sem precisar
            contratar nada para ver o resultado.
          </p>
        </header>

        <section className="space-y-8 text-zinc-400">
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">{c.s1}</h2>
            <p className="mt-4 max-w-3xl leading-8">
              Uma auditoria é uma leitura estruturada da reputação apresentada pelo conjunto de avaliações analisado.
              Em vez de olhar somente para uma nota média, o diagnóstico procura distribuição das notas, pontos
              fortes, riscos e temas que se repetem. O resultado depende das evidências fornecidas e não substitui uma
              análise completa de todas as fontes da empresa.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">{c.s2}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 p-5">
                <strong className="text-zinc-200">{c.experience}:</strong> sinais de atendimento, produto, serviço, prazo
                e entrega.
              </div>
              <div className="rounded-xl border border-zinc-800 p-5">
                <strong className="text-zinc-200">{c.reputation}:</strong> padrões de elogios, críticas e riscos percebidos.
              </div>
              <div className="rounded-xl border border-zinc-800 p-5">
                <strong className="text-zinc-200">{c.recurrence}:</strong> assuntos que aparecem em várias avaliações.
              </div>
              <div className="rounded-xl border border-zinc-800 p-5">
                <strong className="text-zinc-200">{c.action}:</strong> oportunidades práticas sugeridas pelos sinais
                encontrados.
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">{c.s3}</h2>
            <p className="mt-4 max-w-3xl leading-8">
              É útil para empresas que recebem avaliações em Google e outros canais e precisam entender rapidamente o
              que os clientes estão percebendo. Também pode servir como primeiro diagnóstico para hotéis,
              restaurantes, clínicas, agências, franquias, lojas e operações com várias unidades.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">{c.s4}</h2>
            <ol className="mt-4 max-w-3xl space-y-3 leading-8">
              <li>
                <strong className="text-zinc-200">1.</strong> identifique os temas mais recorrentes;
              </li>
              <li>
                <strong className="text-zinc-200">2.</strong> confirme os pontos relevantes com a equipe responsável;
              </li>
              <li>
                <strong className="text-zinc-200">3.</strong> escolha ações específicas para os problemas prioritários;
              </li>
              <li>
                <strong className="text-zinc-200">4.</strong> acompanhe novas avaliações para verificar se a percepção
                mudou.
              </li>
            </ol>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">{c.s5}</h2>
            <p className="mt-4 max-w-3xl leading-8">
              Uma nota média resume um conjunto, mas não explica o motivo da percepção. Duas empresas com a mesma
              média podem ter problemas completamente diferentes. Por isso, o diagnóstico procura contexto e
              recorrência: quais assuntos aparecem, quais pontos são elogiados e quais situações merecem
              investigação.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">{c.s6}</h2>
            <p className="mt-4 max-w-3xl leading-8">
              Use apenas conteúdo que sua empresa possa compartilhar para análise e não inclua dados pessoais
              desnecessários dos clientes. Quanto mais representativo for o conjunto de avaliações, mais útil tende a
              ser o diagnóstico. Uma amostra pequena pode indicar sinais, mas não deve ser tratada como retrato
              completo da empresa.
            </p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <label className="block text-sm font-medium">{c.company}</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nome da empresa"
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-indigo-500"
            />
            <label className="block text-sm font-medium">{c.email} <span className="text-zinc-500">({c.optional})</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com ({c.optional})"
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-indigo-500"
            />
            <label className="flex items-start gap-3 text-sm text-zinc-400">

              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
              />
              <span>
                Quero receber da Filtra.AI informações sobre o diagnóstico, o teste de 7 dias e seus serviços. O
                consentimento é opcional e posso cancelar a qualquer momento.
              </span>
            </label>
            <label className="block text-sm font-medium">{c.reviews}</label>
            <p className="text-xs text-zinc-500">{c.format}</p>
            <p className="text-xs text-zinc-500">O e-mail só é necessário se você optar por receber comunicações da Filtra.AI.</p>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={12}
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 font-mono text-sm outline-none focus:border-indigo-500"
            />
            <button
              onClick={runDiagnostic}
              disabled={loading || !company.trim() || (consent && !email.trim())}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '{c.loading}' : '{c.run}'}
            </button>
            {error && (
              <p className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            {!diagnostic ? (
              <div className="space-y-4 text-zinc-400">
                <h2 className="text-2xl font-semibold text-zinc-100">{c.receive}</h2>
                <ul className="space-y-3">
                  <li>• média e distribuição das notas fornecidas;</li>
                  <li>• pontos fortes identificados nas avaliações;</li>
                  <li>• riscos e temas que aparecem repetidamente;</li>
                  <li>• ações práticas baseadas no material analisado;</li>
                  <li>• indicação de confiança conforme a quantidade e clareza das evidências.</li>
                </ul>
                <p className="pt-4 text-sm">{c.none}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">{diagnostic.company}</h2>
                  <p className="mt-2 text-zinc-400">
                    {diagnostic.review_count} avaliações · média {diagnostic.average_rating.toFixed(2)} ·{' '}
                    {diagnostic.positive_count} positivas · {diagnostic.negative_count} negativas
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Resumo</h3>
                  <p className="mt-2 text-zinc-300">{diagnostic.summary}</p>
                </div>
                {diagnostic.strengths?.length ? (
                  <div>
                    <h3 className="font-semibold">Pontos fortes</h3>
                    <ul className="mt-2 space-y-2 text-zinc-300">
                      {diagnostic.strengths.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {diagnostic.risks?.length ? (
                  <div>
                    <h3 className="font-semibold">Riscos</h3>
                    <ul className="mt-2 space-y-2 text-zinc-300">
                      {diagnostic.risks.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {diagnostic.recurring_themes?.length ? (
                  <div>
                    <h3 className="font-semibold">Temas recorrentes</h3>
                    <ul className="mt-2 space-y-2 text-zinc-300">
                      {diagnostic.recurring_themes.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {diagnostic.actions?.length ? (
                  <div>
                    <h3 className="font-semibold">Ações sugeridas</h3>
                    <ul className="mt-2 space-y-2 text-zinc-300">
                      {diagnostic.actions.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="rounded-xl border border-indigo-900 bg-indigo-950/30 p-4">
                  <p className="text-sm text-zinc-300">
                    Este é um diagnóstico inicial. Para acompanhar avaliações, tendências e ações continuamente,
                    conheça o teste de 7 dias da Filtra.AI.
                  </p>
                  <Link
                    href="/login?trial=7"
                    className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-semibold"
                  >
                    {c.trial}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
        <nav className="flex flex-wrap gap-4 text-sm text-zinc-400">
          <Link href="/feedback-de-clientes" className="underline">
            {c.nav1}
          </Link>
          <Link href="/analise-de-avaliacoes-com-ia" className="underline">
            {c.nav2}
          </Link>
          <Link href="/gestao-de-reputacao-online" className="underline">
            {c.nav3}
          </Link>
          <Link href="/planos" className="underline">
            {c.nav4}
          </Link>
        </nav>
      </div>
      </main>
    </>
  );
}
