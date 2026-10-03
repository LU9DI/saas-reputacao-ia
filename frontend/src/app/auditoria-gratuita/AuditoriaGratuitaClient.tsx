'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
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

const auditCopy: Record<Language, { kicker:string; title:string; intro:string; company:string; email:string; optional:string; consent:string; reviews:string; reviewHelp:string; emailHelp:string; button:string; loading:string; resultTitle:string; noData:string; strengths:string; risks:string; themes:string; actions:string; summary:string; confidence:string; trial:string; nav:string[]; }> = {
  pt: { kicker:'Filtra.AI · diagnóstico gratuito', title:'Auditoria gratuita de avaliações e reputação online', intro:'Descubra o que seus clientes estão elogiando, reclamando e repetindo. Cole avaliações reais e receba um diagnóstico inicial gratuito.', company:'Empresa', email:'E-mail', optional:'opcional', consent:'Quero receber da Filtra.AI informações sobre o diagnóstico, o teste de 7 dias e seus serviços. O consentimento é opcional e posso cancelar a qualquer momento.', reviews:'Avaliações reais', reviewHelp:'Uma por linha: nota | texto. Não inclua dados pessoais de clientes.', emailHelp:'O e-mail só é necessário se você optar por receber comunicações da Filtra.AI.', button:'Gerar meu diagnóstico gratuito', loading:'Gerando diagnóstico…', resultTitle:'O que você recebe', noData:'Nada é inventado: sem avaliações fornecidas, não há diagnóstico.', strengths:'Pontos fortes', risks:'Riscos', themes:'Temas recorrentes', actions:'Ações sugeridas', summary:'Resumo', confidence:'Confiança', trial:'Continuar para o teste de 7 dias', nav:['Feedback de clientes','Análise de avaliações com IA','Gestão de reputação online','Planos'] },
  en: { kicker:'Filtra.AI · free diagnosis', title:'Free audit of reviews and online reputation', intro:'Discover what customers praise, criticize, and repeat. Paste real reviews and receive an initial free diagnosis.', company:'Company', email:'Email', optional:'optional', consent:'I want to receive information from Filtra.AI about the diagnosis, 7-day trial, and services. Consent is optional and I can cancel at any time.', reviews:'Real reviews', reviewHelp:'One per line: rating | text. Do not include customers’ personal data.', emailHelp:'Email is only required if you choose to receive communications from Filtra.AI.', button:'Generate my free diagnosis', loading:'Generating diagnosis…', resultTitle:'What you receive', noData:'Nothing is invented: without reviews, there is no diagnosis.', strengths:'Strengths', risks:'Risks', themes:'Recurring themes', actions:'Suggested actions', summary:'Summary', confidence:'Confidence', trial:'Continue to the 7-day trial', nav:['Customer feedback','AI review analysis','Online reputation management','Plans'] },
  es: { kicker:'Filtra.AI · diagnóstico gratuito', title:'Auditoría gratuita de reseñas y reputación online', intro:'Descubre qué elogian, critican y repiten tus clientes. Pega reseñas reales y recibe un diagnóstico inicial gratuito.', company:'Empresa', email:'Correo electrónico', optional:'opcional', consent:'Quiero recibir información de Filtra.AI sobre el diagnóstico, la prueba de 7 días y sus servicios. El consentimiento es opcional y puedo cancelarlo cuando quiera.', reviews:'Reseñas reales', reviewHelp:'Una por línea: nota | texto. No incluyas datos personales de clientes.', emailHelp:'El correo solo es necesario si eliges recibir comunicaciones de Filtra.AI.', button:'Generar mi diagnóstico gratuito', loading:'Generando diagnóstico…', resultTitle:'Qué recibes', noData:'No se inventa nada: sin reseñas proporcionadas no hay diagnóstico.', strengths:'Puntos fuertes', risks:'Riesgos', themes:'Temas recurrentes', actions:'Acciones sugeridas', summary:'Resumen', confidence:'Confianza', trial:'Continuar con la prueba de 7 días', nav:['Comentarios de clientes','Análisis de reseñas con IA','Gestión de reputación online','Planes'] },
  zh: { kicker:'Filtra.AI · 免费诊断', title:'免费评价与在线声誉审计', intro:'了解客户在称赞、批评和反复提及什么。粘贴真实评价，即可获得免费的初步诊断。', company:'企业', email:'电子邮件', optional:'可选', consent:'我希望接收 Filtra.AI 关于诊断、7 天试用和服务的信息。授权是可选的，我可以随时取消。', reviews:'真实评价', reviewHelp:'每行一条：评分 | 文本。请勿包含客户个人数据。', emailHelp:'只有选择接收 Filtra.AI 通讯时才需要填写邮箱。', button:'生成我的免费诊断', loading:'正在生成诊断…', resultTitle:'您将获得', noData:'不会编造结果：没有提供评价就不会生成诊断。', strengths:'优势', risks:'风险', themes:'重复主题', actions:'建议行动', summary:'摘要', confidence:'置信度', trial:'继续 7 天试用', nav:['客户反馈','AI 评价分析','在线声誉管理','方案'] },
};

export function AuditoriaGratuitaClient({ language = 'pt' }: { language?: Language }) {
  const c = auditCopy[language];
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
          source: `auditoria-gratuita-${language}`,
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
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">O que é uma auditoria de avaliações?</h2>
            <p className="mt-4 max-w-3xl leading-8">
              Uma auditoria é uma leitura estruturada da reputação apresentada pelo conjunto de avaliações analisado.
              Em vez de olhar somente para uma nota média, o diagnóstico procura distribuição das notas, pontos
              fortes, riscos e temas que se repetem. O resultado depende das evidências fornecidas e não substitui uma
              análise completa de todas as fontes da empresa.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">O que o diagnóstico verifica</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 p-5">
                <strong className="text-zinc-200">Experiência:</strong> sinais de atendimento, produto, serviço, prazo
                e entrega.
              </div>
              <div className="rounded-xl border border-zinc-800 p-5">
                <strong className="text-zinc-200">Reputação:</strong> padrões de elogios, críticas e riscos percebidos.
              </div>
              <div className="rounded-xl border border-zinc-800 p-5">
                <strong className="text-zinc-200">Recorrência:</strong> assuntos que aparecem em várias avaliações.
              </div>
              <div className="rounded-xl border border-zinc-800 p-5">
                <strong className="text-zinc-200">Ação:</strong> oportunidades práticas sugeridas pelos sinais
                encontrados.
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">Para quem serve</h2>
            <p className="mt-4 max-w-3xl leading-8">
              É útil para empresas que recebem avaliações em Google e outros canais e precisam entender rapidamente o
              que os clientes estão percebendo. Também pode servir como primeiro diagnóstico para hotéis,
              restaurantes, clínicas, agências, franquias, lojas e operações com várias unidades.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">Como usar o resultado</h2>
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
            <h2 className="text-3xl font-bold text-zinc-100">Uma auditoria não é apenas uma nota</h2>
            <p className="mt-4 max-w-3xl leading-8">
              Uma nota média resume um conjunto, mas não explica o motivo da percepção. Duas empresas com a mesma
              média podem ter problemas completamente diferentes. Por isso, o diagnóstico procura contexto e
              recorrência: quais assuntos aparecem, quais pontos são elogiados e quais situações merecem
              investigação.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">Privacidade e qualidade dos dados</h2>
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
              placeholder="voce@empresa.com (opcional)"
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
                  <li>• {c.confidence} conforme a quantidade e clareza das evidências.</li>
                </ul>
                <p className="pt-4 text-sm">{c.noData}</p>
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
            {c.nav[0]}
          </Link>
          <Link href="/analise-de-avaliacoes-com-ia" className="underline">
            {c.nav[1]}
          </Link>
          <Link href="/gestao-de-reputacao-online" className="underline">
            {c.nav[2]}
          </Link>
          <Link href="/planos" className="underline">
            {c.nav[3]}
          </Link>
        </nav>
      </div>
    </main>
  );
}