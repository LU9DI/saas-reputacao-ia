'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useLanguage, type Language } from '../Contexts/LanguageContext';
import { SeoPageHeader } from '../components/SeoPageHeader';
import { getEnv } from '../utils/env';


const COPY:Record<Language,Record<string,string>>={
pt:{ey:'Filtra.AI · diagnóstico gratuito',h1:'Auditoria gratuita de avaliações e reputação online',lead:'Descubra o que seus clientes estão elogiando, reclamando e repetindo — e transforme isso em prioridades de melhoria. Cole avaliações reais e receba um diagnóstico inicial gratuito.',s1:'O que é uma auditoria de avaliações?',p1:'Uma auditoria é uma leitura estruturada da reputação apresentada pelo conjunto de avaliações analisado. O diagnóstico procura distribuição das notas, pontos fortes, riscos e temas recorrentes.',s2:'O que o diagnóstico verifica',experience:'Experiência',reputation:'Reputação',recurrence:'Recorrência',action:'Ação',s3:'Para quem serve',s4:'Como usar o resultado',s5:'Uma auditoria não é apenas uma nota',s6:'Privacidade e qualidade dos dados',company:'Empresa',email:'E-mail',optional:'opcional',reviews:'Avaliações reais',format:'Uma por linha: nota | texto. Não inclua dados pessoais de clientes.',consent:'Quero receber da Filtra.AI informações sobre o diagnóstico, o teste de 7 dias e seus serviços. O consentimento é opcional.',run:'Gerar meu diagnóstico gratuito',loading:'Gerando diagnóstico…',receive:'O que você recebe',none:'Nada é inventado: sem avaliações fornecidas, não há diagnóstico.',trial:'Continuar para o teste de 7 dias',nav1:'Feedback de clientes',nav2:'Análise de avaliações com IA',nav3:'Gestão de reputação online',nav4:'Planos'},
en:{ey:'Filtra.AI · free diagnostic',h1:'Free review and online reputation audit',lead:'Discover what customers praise, complain about and repeat — then turn it into improvement priorities. Paste real reviews and receive an initial free diagnostic.',s1:'What is a review audit?',p1:'An audit is a structured reading of the reputation shown by the review set provided. It looks for rating distribution, strengths, risks and recurring themes.',s2:'What the diagnostic checks',experience:'Experience',reputation:'Reputation',recurrence:'Recurrence',action:'Action',s3:'Who it is for',s4:'How to use the result',s5:'An audit is more than a score',s6:'Privacy and data quality',company:'Company',email:'Email',optional:'optional',reviews:'Real reviews',format:'One per line: rating | text. Do not include customer personal data.',consent:'I want to receive Filtra.AI information about the diagnostic, 7-day trial and services. Consent is optional.',run:'Generate my free diagnostic',loading:'Generating diagnostic…',receive:'What you receive',none:'Nothing is invented: without reviews provided, there is no diagnostic.',trial:'Continue to the 7-day trial',nav1:'Customer feedback',nav2:'AI review analysis',nav3:'Online reputation',nav4:'Plans'},
es:{ey:'Filtra.AI · diagnóstico gratuito',h1:'Auditoría gratuita de reseñas y reputación online',lead:'Descubre qué elogian, critican y repiten tus clientes y conviértelo en prioridades de mejora. Pega reseñas reales y recibe un diagnóstico inicial gratuito.',s1:'¿Qué es una auditoría de reseñas?',p1:'Una auditoría es una lectura estructurada de la reputación mostrada por las reseñas proporcionadas. Busca distribución de notas, fortalezas, riesgos y temas recurrentes.',s2:'Qué verifica el diagnóstico',experience:'Experiencia',reputation:'Reputación',recurrence:'Recurrencia',action:'Acción',s3:'Para quién sirve',s4:'Cómo usar el resultado',s5:'Una auditoría es más que una nota',s6:'Privacidad y calidad de datos',company:'Empresa',email:'Correo',optional:'opcional',reviews:'Reseñas reales',format:'Una por línea: nota | texto. No incluyas datos personales de clientes.',consent:'Quiero recibir información de Filtra.AI sobre el diagnóstico, la prueba de 7 días y sus servicios. El consentimiento es opcional.',run:'Generar mi diagnóstico gratuito',loading:'Generando diagnóstico…',receive:'Qué recibes',none:'Nada se inventa: sin reseñas proporcionadas no hay diagnóstico.',trial:'Continuar a la prueba de 7 días',nav1:'Feedback de clientes',nav2:'Análisis de reseñas con IA',nav3:'Gestión de reputación',nav4:'Planes'},
zh:{ey:'Filtra.AI · 免费诊断',h1:'免费评价与在线声誉审计',lead:'发现客户赞扬、抱怨和反复提及的内容，并将其转化为改进重点。粘贴真实评价即可获得初步免费诊断。',s1:'什么是评价审计？',p1:'审计是对所提供评价集合进行结构化分析，关注评分分布、优势、风险和重复主题。',s2:'诊断检查什么',experience:'体验',reputation:'声誉',recurrence:'重复性',action:'行动',s3:'适合谁',s4:'如何使用结果',s5:'审计不只是一个分数',s6:'隐私与数据质量',company:'企业',email:'电子邮件',optional:'可选',reviews:'真实评价',format:'每行一条：评分 | 文本。请勿包含客户个人数据。',consent:'我希望接收 Filtra.AI 关于诊断、7 天试用和服务的信息。授权是可选的。',run:'生成我的免费诊断',loading:'正在生成诊断…',receive:'您将获得',none:'不虚构任何内容：没有提供评价就不会生成诊断。',trial:'继续进行 7 天试用',nav1:'客户反馈',nav2:'AI 评价分析',nav3:'在线声誉',nav4:'套餐'}};

const EXTRA:Record<Language,Record<string,string>>={
pt:{p3:'É útil para empresas que recebem avaliações em Google e outros canais e precisam entender rapidamente o que os clientes estão percebendo. Também serve como primeiro diagnóstico para hotéis, restaurantes, clínicas, agências, franquias, lojas e operações com várias unidades.',p4:'1. identifique os temas mais recorrentes; 2. confirme os pontos relevantes com a equipe responsável; 3. escolha ações específicas para os problemas prioritários; 4. acompanhe novas avaliações para verificar se a percepção mudou.',p5:'Uma nota média resume um conjunto, mas não explica o motivo da percepção. Duas empresas com a mesma média podem ter problemas diferentes. O diagnóstico procura contexto e recorrência.',p6:'Use apenas conteúdo que sua empresa possa compartilhar e não inclua dados pessoais desnecessários. Quanto mais representativo for o conjunto, mais útil tende a ser o diagnóstico.',placeholder:'Nome da empresa',emailPlaceholder:'voce@empresa.com (opcional)',consentText:'Quero receber da Filtra.AI informações sobre o diagnóstico, o teste de 7 dias e seus serviços. O consentimento é opcional e posso cancelar a qualquer momento.',emailHint:'O e-mail só é necessário se você optar por receber comunicações da Filtra.AI.',r1:'média e distribuição das notas fornecidas',r2:'pontos fortes identificados nas avaliações',r3:'riscos e temas que aparecem repetidamente',r4:'ações práticas baseadas no material analisado',r5:'indicação de confiança conforme a quantidade e clareza das evidências',summary:'Resumo',strengths:'Pontos fortes',risks:'Riscos',themes:'Temas recorrentes',actions:'Ações sugeridas',result:'Este é um diagnóstico inicial. Para acompanhar avaliações, tendências e ações continuamente, conheça o teste de 7 dias da Filtra.AI.',reviewsLabel:'avaliações',positive:'positivas',negative:'negativas'},
en:{p3:'It is useful for businesses receiving reviews on Google and other channels that need to quickly understand customer perception. It also works as an initial diagnostic for hotels, restaurants, clinics, agencies, franchises, stores and multi-location operations.',p4:'1. identify recurring themes; 2. confirm relevant points with the responsible team; 3. choose actions for priority problems; 4. track new reviews to see whether perception changes.',p5:'An average score summarizes a set but does not explain perception. Two companies with the same average can have different problems. The diagnostic looks for context and recurrence.',p6:'Use only content your company can share and avoid unnecessary personal data. A more representative review set usually produces a more useful diagnostic.',placeholder:'Company name',emailPlaceholder:'you@company.com (optional)',consentText:'I want to receive Filtra.AI information about the diagnostic, 7-day trial and services. Consent is optional and can be cancelled at any time.',emailHint:'Email is only required if you choose to receive Filtra.AI communications.',r1:'average and distribution of supplied ratings',r2:'strengths identified in the reviews',r3:'risks and recurring themes',r4:'practical actions based on the analyzed material',r5:'confidence indication based on evidence quantity and clarity',summary:'Summary',strengths:'Strengths',risks:'Risks',themes:'Recurring themes',actions:'Suggested actions',result:'This is an initial diagnostic. To continuously track reviews, trends and actions, explore the 7-day Filtra.AI trial.',reviewsLabel:'reviews',positive:'positive',negative:'negative'},
es:{p3:'Es útil para empresas que reciben reseñas en Google y otros canales y necesitan entender rápidamente la percepción del cliente. También sirve como diagnóstico inicial para hoteles, restaurantes, clínicas, agencias, franquicias, tiendas y operaciones con varias unidades.',p4:'1. identifica los temas recurrentes; 2. confirma los puntos relevantes con el equipo responsable; 3. elige acciones para los problemas prioritarios; 4. sigue nuevas reseñas para comprobar cambios.',p5:'La nota media resume un conjunto, pero no explica la percepción. Dos empresas con la misma media pueden tener problemas distintos. El diagnóstico busca contexto y recurrencia.',p6:'Usa solo contenido que tu empresa pueda compartir y evita datos personales innecesarios. Una muestra más representativa suele producir un diagnóstico más útil.',placeholder:'Nombre de la empresa',emailPlaceholder:'tu@empresa.com (opcional)',consentText:'Quiero recibir información de Filtra.AI sobre el diagnóstico, la prueba de 7 días y sus servicios. El consentimiento es opcional y puede cancelarse.',emailHint:'El correo solo es necesario si eliges recibir comunicaciones de Filtra.AI.',r1:'media y distribución de las notas proporcionadas',r2:'puntos fuertes identificados en las reseñas',r3:'riesgos y temas recurrentes',r4:'acciones prácticas basadas en el material analizado',r5:'indicación de confianza según cantidad y claridad de las evidencias',summary:'Resumen',strengths:'Puntos fuertes',risks:'Riesgos',themes:'Temas recurrentes',actions:'Acciones sugeridas',result:'Este es un diagnóstico inicial. Para seguir reseñas, tendencias y acciones, conoce la prueba de 7 días de Filtra.AI.',reviewsLabel:'reseñas',positive:'positivas',negative:'negativas'},
zh:{p3:'适用于在 Google 和其他渠道收到评价、需要快速了解客户认知的企业，也适合作为酒店、餐厅、诊所、代理机构、连锁企业和多门店业务的初步诊断。',p4:'1. 找出重复主题；2. 与负责人确认重点；3. 为优先问题选择行动；4. 跟踪新评价以验证认知变化。',p5:'平均分只能概括整体，无法解释认知原因。即使平均分相同，不同企业的问题也可能完全不同。诊断会关注上下文和重复性。',p6:'只使用企业可以分享的内容，并避免不必要的个人数据。评价样本越有代表性，诊断通常越有价值。',placeholder:'企业名称',emailPlaceholder:'you@company.com（可选）',consentText:'我希望接收 Filtra.AI 关于诊断、7 天试用和服务的信息。授权是可选的，也可以随时取消。',emailHint:'只有选择接收 Filtra.AI 通讯时才需要电子邮件。',r1:'所提供评分的平均值和分布',r2:'评价中发现的优势',r3:'风险和重复主题',r4:'基于分析材料的实际行动',r5:'根据证据数量和清晰度给出的可信度',summary:'摘要',strengths:'优势',risks:'风险',themes:'重复主题',actions:'建议行动',result:'这是初步诊断。如需持续跟踪评价、趋势和行动，请了解 Filtra.AI 的 7 天试用。',reviewsLabel:'条评价',positive:'好评',negative:'差评'}};
const cExtra = (language: Language) => EXTRA[language];

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

const API = getEnv('NEXT_PUBLIC_API_URL');

export function AuditoriaGratuitaClient() {
  const { language } = useLanguage();
  const c = { ...COPY[language], ...cExtra(language) };
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
          </p>
        </header>

        <section className="space-y-8 text-zinc-400">
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">{c.s1}</h2>
            <p className="mt-4 max-w-3xl leading-8">
              {c.p1}
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
                <strong className="text-zinc-200">{c.reputation}:</strong> {c.p3}
              </div>
              <div className="rounded-xl border border-zinc-800 p-5">
                <strong className="text-zinc-200">{c.recurrence}:</strong> {c.p3}
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
              {c.p3}
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">{c.s4}</h2>
            <ol className="mt-4 max-w-3xl space-y-3 leading-8">
              <li>{c.p4}</li>
            </ol>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">{c.s5}</h2>
            <p className="mt-4 max-w-3xl leading-8">
              {c.p5}
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">{c.s6}</h2>
            <p className="mt-4 max-w-3xl leading-8">
              {c.p6}
            </p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <label className="block text-sm font-medium">{c.company}</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={c.placeholder}
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-indigo-500"
            />
            <label className="block text-sm font-medium">{c.email} <span className="text-zinc-500">({c.optional})</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={c.emailPlaceholder}
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-indigo-500"
            />
            <label className="flex items-start gap-3 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
              />
              <span>{c.consentText}</span>
            </label>
            <p className="text-xs text-zinc-500">{c.emailHint}</p>
            <label className="block text-sm font-medium">{c.reviews}</label>
            <p className="text-xs text-zinc-500">{c.format}</p>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 font-mono text-sm outline-none focus:border-indigo-500"
            />
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="button"
              onClick={runDiagnostic}
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold disabled:opacity-60"
            >
              {loading ? c.loading : c.run}
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            {!diagnostic ? (
              <div className="space-y-4 text-zinc-400">
                <h2 className="text-xl font-semibold text-zinc-100">{c.receive}</h2>
                <ul className="space-y-2 text-sm">
                  <li>• {c.r1}</li>
                  <li>• {c.r2}</li>
                  <li>• {c.r3}</li>
                  <li>• {c.r4}</li>
                  <li>• {c.r5}</li>
                </ul>
                <p className="pt-4 text-sm">{c.none}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">{diagnostic.company}</h2>
                  <p className="mt-2 text-zinc-400">
                    {diagnostic.review_count} {c.reviewsLabel} · {c.positive} {diagnostic.positive_count} · {c.negative} {diagnostic.negative_count}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">{c.summary}</h3>
                  <p className="mt-2 text-zinc-300">{diagnostic.summary}</p>
                </div>
                {diagnostic.strengths?.length ? (
                  <div>
                    <h3 className="font-semibold">{c.strengths}</h3>
                    <ul className="mt-2 space-y-2 text-zinc-300">
                      {diagnostic.strengths.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {diagnostic.risks?.length ? (
                  <div>
                    <h3 className="font-semibold">{c.risks}</h3>
                    <ul className="mt-2 space-y-2 text-zinc-300">
                      {diagnostic.risks.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {diagnostic.recurring_themes?.length ? (
                  <div>
                    <h3 className="font-semibold">{c.themes}</h3>
                    <ul className="mt-2 space-y-2 text-zinc-300">
                      {diagnostic.recurring_themes.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {diagnostic.actions?.length ? (
                  <div>
                    <h3 className="font-semibold">{c.actions}</h3>
                    <ul className="mt-2 space-y-2 text-zinc-300">
                      {diagnostic.actions.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="rounded-xl border border-indigo-900 bg-indigo-950/30 p-4">
                  <p className="text-sm text-zinc-300">
                    {c.result}
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
          <Link href="/agencias" className="underline">
            Gestão de reputação para agências
          </Link>
          <Link href="/blog/seo-local-avaliacoes-local-pack" className="underline">
            Pacotes de SEO local
          </Link>
          <Link href="/avaliacoes-google" className="underline">
            Avaliações Google
          </Link>
        </nav>
      </div>
      </main>
    </>
  );
}
