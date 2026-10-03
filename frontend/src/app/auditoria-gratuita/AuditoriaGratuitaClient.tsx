'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import type { Language } from '../Contexts/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

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

const auditCopy: Record<Language, { kicker:string; title:string; intro:string; company:string; email:string; optional:string; consent:string; reviews:string; reviewHelp:string; emailHelp:string; button:string; loading:string; resultTitle:string; noData:string; strengths:string; risks:string; themes:string; actions:string; summary:string; confidence:string; trial:string; nav:string[]; errors:{company:string;email:string;reviews:string;consent:string;diagnostic:string;unavailable:string}; placeholderCompany:string; placeholderEmail:string; resultRating:string; resultConfidence:string; initial:string; }> = {
  pt: { kicker:'Filtra.AI · diagnóstico gratuito', title:'Auditoria gratuita de avaliações e reputação online', intro:'Descubra o que seus clientes estão elogiando, reclamando e repetindo. Cole avaliações reais e receba um diagnóstico inicial gratuito.', company:'Empresa', email:'E-mail', optional:'opcional', consent:'Quero receber da Filtra.AI informações sobre o diagnóstico, o teste de 7 dias e seus serviços. O consentimento é opcional e posso cancelar a qualquer momento.', reviews:'Avaliações reais', reviewHelp:'Uma por linha: nota | texto. Não inclua dados pessoais de clientes.', emailHelp:'O e-mail só é necessário se você optar por receber comunicações da Filtra.AI.', button:'Gerar meu diagnóstico gratuito', loading:'Gerando diagnóstico…', resultTitle:'O que você recebe', noData:'Nada é inventado: sem avaliações fornecidas, não há diagnóstico.', strengths:'Pontos fortes', risks:'Riscos', themes:'Temas recorrentes', actions:'Ações sugeridas', summary:'Resumo', confidence:'Confiança', trial:'Continuar para o teste de 7 dias', nav:['Feedback de clientes','Análise de avaliações com IA','Gestão de reputação online','Planos'], errors:{company:'Informe o nome da empresa.',email:'Informe seu e-mail para registrar o consentimento.',reviews:'Inclua pelo menos 3 avaliações reais, uma por linha, no formato: nota | texto.',consent:'Não foi possível registrar o consentimento.',diagnostic:'Não foi possível gerar o diagnóstico.',unavailable:'Diagnóstico indisponível no momento.'}, placeholderCompany:'Nome da empresa', placeholderEmail:'voce@empresa.com (opcional)', resultRating:'média', resultConfidence:'conforme a quantidade e clareza das evidências', initial:'Este é um diagnóstico inicial. Para acompanhar avaliações, tendências e ações continuamente, conheça o teste de 7 dias da Filtra.AI.' },
  en: { kicker:'Filtra.AI · free diagnosis', title:'Free audit of reviews and online reputation', intro:'Discover what customers praise, criticize, and repeat. Paste real reviews and receive an initial free diagnosis.', company:'Company', email:'Email', optional:'optional', consent:'I want to receive information from Filtra.AI about the diagnosis, 7-day trial, and services. Consent is optional and I can cancel at any time.', reviews:'Real reviews', reviewHelp:'One per line: rating | text. Do not include customers’ personal data.', emailHelp:'Email is only required if you choose to receive communications from Filtra.AI.', button:'Generate my free diagnosis', loading:'Generating diagnosis…', resultTitle:'What you receive', noData:'Nothing is invented: without reviews, there is no diagnosis.', strengths:'Strengths', risks:'Risks', themes:'Recurring themes', actions:'Suggested actions', summary:'Summary', confidence:'Confidence', trial:'Continue to the 7-day trial', nav:['Customer feedback','AI review analysis','Online reputation management','Plans'], errors:{company:'Enter the company name.',email:'Enter your email to register consent.',reviews:'Add at least 3 real reviews, one per line, in the format: rating | text.',consent:'We could not register your consent.',diagnostic:'We could not generate the diagnosis.',unavailable:'Diagnosis is currently unavailable.'}, placeholderCompany:'Company name', placeholderEmail:'you@company.com (optional)', resultRating:'average', resultConfidence:'based on the amount and clarity of the evidence', initial:'This is an initial diagnosis. To continuously track reviews, trends, and actions, explore Filtra.AI’s 7-day trial.' },
  es: { kicker:'Filtra.AI · diagnóstico gratuito', title:'Auditoría gratuita de reseñas y reputación online', intro:'Descubre qué elogian, critican y repiten tus clientes. Pega reseñas reales y recibe un diagnóstico inicial gratuito.', company:'Empresa', email:'Correo electrónico', optional:'opcional', consent:'Quiero recibir información de Filtra.AI sobre el diagnóstico, la prueba de 7 días y sus servicios. El consentimiento es opcional y puedo cancelarlo cuando quiera.', reviews:'Reseñas reales', reviewHelp:'Una por línea: nota | texto. No incluyas datos personales de clientes.', emailHelp:'El correo solo es necesario si eliges recibir comunicaciones de Filtra.AI.', button:'Generar mi diagnóstico gratuito', loading:'Generando diagnóstico…', resultTitle:'Qué recibes', noData:'No se inventa nada: sin reseñas proporcionadas no hay diagnóstico.', strengths:'Puntos fuertes', risks:'Riesgos', themes:'Temas recurrentes', actions:'Acciones sugeridas', summary:'Resumen', confidence:'Confianza', trial:'Continuar con la prueba de 7 días', nav:['Comentarios de clientes','Análisis de reseñas con IA','Gestión de reputación online','Planes'], errors:{company:'Indica el nombre de la empresa.',email:'Indica tu correo para registrar el consentimiento.',reviews:'Añade al menos 3 reseñas reales, una por línea, con el formato: nota | texto.',consent:'No fue posible registrar el consentimiento.',diagnostic:'No fue posible generar el diagnóstico.',unavailable:'El diagnóstico no está disponible en este momento.'}, placeholderCompany:'Nombre de la empresa', placeholderEmail:'tu@empresa.com (opcional)', resultRating:'media', resultConfidence:'según la cantidad y claridad de las evidencias', initial:'Este es un diagnóstico inicial. Para seguir reseñas, tendencias y acciones de forma continua, conoce la prueba de 7 días de Filtra.AI.' },
  zh: { kicker:'Filtra.AI · 免费诊断', title:'免费评价与在线声誉审计', intro:'了解客户在称赞、批评和反复提及什么。粘贴真实评价，即可获得免费的初步诊断。', company:'企业', email:'电子邮件', optional:'可选', consent:'我希望接收 Filtra.AI 关于诊断、7 天试用和服务的信息。授权是可选的，我可以随时取消。', reviews:'真实评价', reviewHelp:'每行一条：评分 | 文本。请勿包含客户个人数据。', emailHelp:'只有选择接收 Filtra.AI 通讯时才需要填写邮箱。', button:'生成我的免费诊断', loading:'正在生成诊断…', resultTitle:'您将获得', noData:'不会编造结果：没有提供评价就不会生成诊断。', strengths:'优势', risks:'风险', themes:'重复主题', actions:'建议行动', summary:'摘要', confidence:'置信度', trial:'继续 7 天试用', nav:['客户反馈','AI 评价分析','在线声誉管理','方案'], errors:{company:'请输入企业名称。',email:'请输入邮箱以登记授权。',reviews:'请至少添加 3 条真实评价，每行一条，格式为：评分 | 文本。',consent:'无法登记您的授权。',diagnostic:'无法生成诊断。',unavailable:'诊断目前不可用。'}, placeholderCompany:'企业名称', placeholderEmail:'you@company.com（可选）', resultRating:'平均值', resultConfidence:'取决于证据的数量和清晰度', initial:'这是初步诊断。如需持续跟踪评价、趋势和行动，请体验 Filtra.AI 的 7 天试用。' },
};


function Info({ title, children }: { title: string; children: ReactNode }) {
  return <div><h2 className="text-3xl font-bold text-zinc-100">{title}</h2><p className="mt-4 max-w-3xl leading-8">{children}</p></div>;
}
function InfoGrid({ title, items }: { title: string; items: string[][] }) {
  return <div><h2 className="text-3xl font-bold text-zinc-100">{title}</h2><div className="mt-5 grid gap-4 md:grid-cols-2">{items.map(([k,v]) => <div key={k} className="rounded-xl border border-zinc-800 p-5"><strong className="text-zinc-200">{k}:</strong> {v}</div>)}</div></div>;
}
function InfoList({ title, items }: { title: string; items: string[] }) {
  return <div><h2 className="text-3xl font-bold text-zinc-100">{title}</h2><ol className="mt-4 max-w-3xl space-y-3 leading-8">{items.map((item,i) => <li key={item}><strong className="text-zinc-200">{i+1}.</strong> {item}</li>)}</ol></div>;
}

export function AuditoriaGratuitaClient({ language = 'pt' }: { language?: Language }) {
  const c = auditCopy[language];
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [raw, setRaw] = useState(
    language === 'en' ? '5 | Fast service and very attentive team.\n4 | Comfortable room, but check-in took too long.\n2 | I had difficulty resolving an issue and waited a long time.' : language === 'es' ? '5 | Atención rápida y equipo muy atento.\n4 | Habitación cómoda, pero el check-in tardó demasiado.\n2 | Tuve dificultades para resolver un problema y esperé bastante.' : language === 'zh' ? '5 | 服务很快，团队非常热情。\n4 | 房间舒适，但办理入住花了很长时间。\n2 | 解决问题时遇到困难，而且等待时间很长。' : '5 | Atendimento rápido e equipe muito atenciosa.\n4 | Quarto confortável, mas o check-in demorou.\n2 | Tive dificuldade para resolver um problema e esperei bastante.'
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
          source: `auditoria-gratuita-${language}`,
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || auditCopy[language].errors.consent);
    return data;
  }

  async function runDiagnostic() {
    setError('');
    setDiagnostic(null);
    if (!company.trim()) {
      setError(c.errors.company);
      return;
    }
    if (consent && !email.trim()) {
      setError(c.errors.email);
      return;
    }
    if (reviews.length < 3) {
      setError(c.errors.reviews);
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
      if (!response.ok) throw new Error(data?.error || c.errors.diagnostic);
      setDiagnostic(data.diagnostic);
    } catch (e: any) {
      setError(e?.message || c.errors.unavailable);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-zinc-100 px-6 py-12">\n      <div className="mx-auto flex max-w-5xl justify-end pb-4"><LanguageSwitcher /></div>
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
            {c.kicker}
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            {c.title}
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-zinc-400">
            {c.intro}
          </p>
        </header>

        <section className="space-y-8 text-zinc-400">
          {language === 'pt' ? (
            <>
              <Info title="O que é uma auditoria de avaliações?">Uma auditoria é uma leitura estruturada da reputação apresentada pelo conjunto de avaliações analisado. Em vez de olhar somente para uma nota média, o diagnóstico procura distribuição das notas, pontos fortes, riscos e temas que se repetem. O resultado depende das evidências fornecidas e não substitui uma análise completa de todas as fontes da empresa.</Info>
              <InfoGrid items={[
                ['Experiência','Sinais de atendimento, produto, serviço, prazo e entrega.'],
                ['Reputação','Padrões de elogios, críticas e riscos percebidos.'],
                ['Recorrência','Assuntos que aparecem em várias avaliações.'],
                ['Ação','Oportunidades práticas sugeridas pelos sinais encontrados.'],
              ]} title="O que o diagnóstico verifica" />
              <Info title="Para quem serve">É útil para empresas que recebem avaliações em Google e outros canais e precisam entender rapidamente o que os clientes estão percebendo. Também pode servir como primeiro diagnóstico para hotéis, restaurantes, clínicas, agências, franquias, lojas e operações com várias unidades.</Info>
              <InfoList title="Como usar o resultado" items={['Identifique os temas mais recorrentes.','Confirme os pontos relevantes com a equipe responsável.','Escolha ações específicas para os problemas prioritários.','Acompanhe novas avaliações para verificar se a percepção mudou.']} />
              <Info title="Uma auditoria não é apenas uma nota">Uma nota média resume um conjunto, mas não explica o motivo da percepção. Duas empresas com a mesma média podem ter problemas completamente diferentes. Por isso, o diagnóstico procura contexto e recorrência.</Info>
              <Info title="Privacidade e qualidade dos dados">Use apenas conteúdo que sua empresa possa compartilhar para análise e não inclua dados pessoais desnecessários dos clientes. Quanto mais representativo for o conjunto de avaliações, mais útil tende a ser o diagnóstico.</Info>
            </>
          ) : language === 'en' ? (
            <>
              <Info title="What is a review audit?">An audit is a structured reading of the reputation represented by the review set being analyzed. Instead of looking only at an average rating, the diagnosis examines rating distribution, strengths, risks, and recurring themes. Results depend on the evidence provided and do not replace a complete analysis of every company source.</Info>
              <InfoGrid items={[['Experience','Signals about service, product, delivery, timing, and execution.'],['Reputation','Patterns of praise, criticism, and perceived risks.'],['Recurrence','Topics appearing across multiple reviews.'],['Action','Practical opportunities suggested by the signals found.']]} title="What the diagnosis checks" />
              <Info title="Who is it for?">It is useful for businesses receiving reviews on Google and other channels that need to quickly understand what customers are experiencing. It can also serve as a first diagnosis for hotels, restaurants, clinics, agencies, franchises, stores, and multi-location operations.</Info>
              <InfoList title="How to use the result" items={['Identify the most recurring themes.','Confirm relevant points with the responsible team.','Choose specific actions for priority problems.','Monitor new reviews to see whether perception changes.']} />
              <Info title="An audit is more than a rating">An average rating summarizes a set but does not explain why customers perceive the business that way. Two companies with the same average can have completely different issues. The diagnosis therefore looks for context and recurrence.</Info>
              <Info title="Privacy and data quality">Use only content your company is allowed to share for analysis and avoid unnecessary customer personal data. The more representative the review set, the more useful the diagnosis tends to be.</Info>
            </>
          ) : language === 'es' ? (
            <>
              <Info title="¿Qué es una auditoría de reseñas?">Una auditoría es una lectura estructurada de la reputación representada por el conjunto de reseñas analizado. En lugar de mirar solo la media, el diagnóstico examina la distribución de notas, puntos fuertes, riesgos y temas recurrentes. El resultado depende de las evidencias proporcionadas y no sustituye un análisis completo de todas las fuentes de la empresa.</Info>
              <InfoGrid items={[['Experiencia','Señales sobre atención, producto, servicio, plazos y entrega.'],['Reputación','Patrones de elogios, críticas y riesgos percibidos.'],['Recurrencia','Temas que aparecen en varias reseñas.'],['Acción','Oportunidades prácticas sugeridas por las señales encontradas.']]} title="Qué verifica el diagnóstico" />
              <Info title="¿Para quién sirve?">Es útil para empresas que reciben reseñas en Google y otros canales y necesitan entender rápidamente lo que perciben sus clientes. También puede servir como primer diagnóstico para hoteles, restaurantes, clínicas, agencias, franquicias, tiendas y operaciones con varias unidades.</Info>
              <InfoList title="Cómo usar el resultado" items={['Identifica los temas más recurrentes.','Confirma los puntos relevantes con el equipo responsable.','Elige acciones específicas para los problemas prioritarios.','Acompaña nuevas reseñas para comprobar si cambia la percepción.']} />
              <Info title="Una auditoría no es solo una nota">Una media resume un conjunto, pero no explica el motivo de la percepción. Dos empresas con la misma media pueden tener problemas completamente diferentes. Por eso el diagnóstico busca contexto y recurrencia.</Info>
              <Info title="Privacidad y calidad de los datos">Usa solo contenido que tu empresa pueda compartir para análisis y evita datos personales innecesarios de clientes. Cuanto más representativo sea el conjunto de reseñas, más útil será el diagnóstico.</Info>
            </>
          ) : (
            <>
              <Info title="什么是评价审计？">评价审计是对所分析评价集合所呈现的企业声誉进行结构化解读。诊断不仅查看平均评分，还会关注评分分布、优势、风险和重复出现的主题。结果取决于提供的证据，不能替代对企业所有来源的完整分析。</Info>
              <InfoGrid items={[['体验','关于服务、产品、交付、时效和执行的信号。'],['声誉','赞扬、批评和感知风险的模式。'],['重复性','在多条评价中反复出现的主题。'],['行动','根据发现的信号提出的实际机会。']]} title="诊断检查什么" />
              <Info title="适合谁？">适用于在 Google 和其他渠道收到评价、需要快速了解客户感受的企业，也适合作为酒店、餐厅、诊所、代理机构、加盟企业、商店和多门店运营的初步诊断。</Info>
              <InfoList title="如何使用结果" items={['识别最常出现的主题。','与负责团队确认相关问题。','为优先问题选择具体行动。','持续关注新评价，观察客户感知是否发生变化。']} />
              <Info title="审计不只是一个分数">平均评分可以概括一组评价，但不能解释客户为何形成这种感知。即使平均分相同，两家企业的问题也可能完全不同。因此，诊断会关注背景和重复性。</Info>
              <Info title="隐私与数据质量">仅使用企业有权提供分析的内容，并避免加入不必要的客户个人数据。评价样本越有代表性，诊断通常越有价值。</Info>
            </>
          )}
        </section>

<section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <label className="block text-sm font-medium">{c.company}</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={c.placeholderCompany}
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-indigo-500"
            />
            <label className="block text-sm font-medium">{c.email} <span className="text-zinc-500">({c.optional})</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={c.placeholderEmail}
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-indigo-500"
            />
            <label className="flex items-start gap-3 text-sm text-zinc-400">

              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
              />
              <span>{c.consent}</span>
            </label>
            <label className="block text-sm font-medium">{c.reviews}</label>
            <p className="text-xs text-zinc-500">{c.reviewHelp}</p>
            <p className="text-xs text-zinc-500">{c.emailHelp}</p>
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
              {loading ? c.loading : c.button}
            </button>
            {error && (
              <p className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            {!diagnostic ? (
              <div className="space-y-4 text-zinc-400">
                <h2 className="text-2xl font-semibold text-zinc-100">{c.resultTitle}</h2>
                <ul className="space-y-3">
                  <li>• {language === 'pt' ? 'média e distribuição das notas fornecidas' : language === 'en' ? 'average and distribution of the supplied ratings' : language === 'es' ? 'media y distribución de las notas proporcionadas' : '所提供评分的平均值与分布'};</li>
                  <li>• {c.strengths};</li>
                  <li>• {c.risks} e {c.themes};</li>
                  <li>• {c.actions};</li>
                  <li>• {c.confidence} {c.resultConfidence}.</li>
                </ul>
                <p className="pt-4 text-sm">{c.noData}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">{diagnostic.company}</h2>
                  <p className="mt-2 text-zinc-400">
                    {diagnostic.review_count} {language === 'en' ? 'reviews' : language === 'es' ? 'reseñas' : language === 'zh' ? '条评价' : 'avaliações'} · {c.resultRating} {diagnostic.average_rating.toFixed(2)} ·{' '}
                    {diagnostic.positive_count} {language === 'en' ? 'positive' : language === 'es' ? 'positivas' : language === 'zh' ? '正面' : 'positivas'} · {diagnostic.negative_count} {language === 'en' ? 'negative' : language === 'es' ? 'negativas' : language === 'zh' ? '负面' : 'negativas'}
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
                    {c.initial}
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
          <Link href={language === "pt" ? "/feedback-de-clientes" : `/${language}/feedback-de-clientes`} className="underline">
            {c.nav[0]}
          </Link>
          <Link href={language === "pt" ? "/analise-de-avaliacoes-com-ia" : `/${language}/analise-de-avaliacoes-com-ia`} className="underline">
            {c.nav[1]}
          </Link>
          <Link href={language === "pt" ? "/gestao-de-reputacao-online" : `/${language}/gestao-de-reputacao-online`} className="underline">
            {c.nav[2]}
          </Link>
          <Link href={language === "pt" ? "/planos" : `/${language}/planos`} className="underline">
            {c.nav[3]}
          </Link>
        </nav>
      </div>
    </main>
  );
}