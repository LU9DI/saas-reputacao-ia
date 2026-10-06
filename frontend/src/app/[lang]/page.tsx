import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

type Lang='en'|'es'|'zh';

type HomeCopy={
  title:string;
  description:string;
  h1:string;
  intro:string;
  points:string[];
  sections:{heading:string;body:string}[];
  links:{href:string;label:string}[];
  cta:string;
};

const content:Record<Lang,HomeCopy>={
  en:{
    title:'AI online reputation management',
    description:'Manage online reputation, Google reviews and customer feedback with AI. Turn customer voice into growth decisions.',
    h1:'Turn customer voice into growth with AI',
    intro:'Filtra.AI organizes reviews and customer feedback so businesses can identify patterns, improve experience and manage reputation as a growth discipline.',
    points:['Manage Google reviews and reputation signals','Analyze customer feedback with AI','Identify recurring themes and operational priorities','Build a continuous reputation management routine'],
    sections:[
      {heading:'From reviews to operational decisions',body:'Reviews are not only a public score. They are a stream of customer evidence. Filtra.AI helps teams identify recurring themes, separate urgent signals from noise and turn customer voice into actions that can be measured.'},
      {heading:'A continuous reputation workflow',body:'Strong reputation management is a process: collect feedback close to the experience, understand what customers are saying, identify repeated friction, act with the responsible team and monitor whether perception improves over time.'},
      {heading:'Built for teams, agencies and multi-location businesses',body:'The same workflow can support a local business, an agency managing client accounts, a clinic, restaurant, hotel or franchise network. The goal is to create repeatable reputation operations without losing the context behind each review.'}
    ],
    links:[
      {href:'/en/google-reviews',label:'Google Reviews management'},
      {href:'/en/online-reputation-management',label:'Online reputation management'},
      {href:'/en/ai-review-analysis',label:'AI review analysis'},
      {href:'/en/agencies',label:'Agencies'},
      {href:'/en/clinics',label:'Clinics'},
      {href:'/en/restaurants',label:'Restaurants'},
      {href:'/en/blog',label:'Reviews & reputation guides'}
    ],
    cta:'Start your 7-day free trial'
  },
  es:{
    title:'Gestión de reputación online con IA',
    description:'Gestiona reputación online, reseñas de Google y feedback de clientes con IA. Convierte la voz del cliente en decisiones de crecimiento.',
    h1:'Convierte la voz del cliente en crecimiento con IA',
    intro:'Filtra.AI organiza reseñas y feedback para identificar patrones, mejorar la experiencia y gestionar la reputación como una disciplina de crecimiento.',
    points:['Gestiona reseñas de Google y señales de reputación','Analiza feedback de clientes con IA','Identifica temas recurrentes y prioridades operativas','Construye una rutina continua de gestión de reputación'],
    sections:[
      {heading:'De las reseñas a las decisiones operativas',body:'Las reseñas no son solo una puntuación pública. Son evidencia continua de la experiencia del cliente. Filtra.AI ayuda a detectar temas recurrentes, separar señales importantes del ruido y convertir la voz del cliente en acciones medibles.'},
      {heading:'Un flujo continuo de gestión de reputación',body:'Una reputación sólida se gestiona como un proceso: recoger feedback cerca de la experiencia, entender lo que dicen los clientes, detectar fricciones repetidas, actuar con el equipo responsable y comprobar si la percepción mejora.'},
      {heading:'Para empresas, agencias y redes con varias ubicaciones',body:'El mismo flujo puede apoyar a un negocio local, una agencia que gestiona clientes, una clínica, un restaurante, un hotel o una red de franquicias. El objetivo es crear operaciones de reputación repetibles sin perder el contexto de cada reseña.'}
    ],
    links:[
      {href:'/es/resenas-google',label:'Gestión de reseñas de Google'},
      {href:'/es/gestion-reputacion-online',label:'Gestión de reputación online'},
      {href:'/es/analisis-resenas-ia',label:'Análisis de reseñas con IA'},
      {href:'/es/agencias',label:'Agencias'},
      {href:'/es/clinicas',label:'Clínicas'},
      {href:'/es/restaurantes',label:'Restaurantes'},
      {href:'/es/blog',label:'Guías de reseñas y reputación'}
    ],
    cta:'Comenzar prueba gratuita de 7 días'
  },
  zh:{
    title:'AI 在线声誉管理',
    description:'使用 AI 管理在线声誉、Google 评价和客户反馈，将客户声音转化为增长决策。',
    h1:'用 AI 将客户声音转化为业务增长',
    intro:'Filtra.AI 整理评价和客户反馈，帮助企业发现模式、改善体验，并把声誉管理变成持续的增长能力。',
    points:['管理 Google 评价和声誉信号','使用 AI 分析客户反馈','发现重复主题和运营优先事项','建立持续的声誉管理流程'],
    sections:[
      {heading:'从评价走向运营决策',body:'评价不只是公开分数，也是持续的客户体验证据。Filtra.AI 帮助团队识别重复主题、区分重要信号与噪音，并把客户声音转化为可以持续跟踪的行动。'},
      {heading:'持续的声誉管理流程',body:'稳定的声誉来自持续流程：在体验后及时收集反馈，理解客户在说什么，发现重复摩擦，交给负责团队处理，并观察客户感知是否随着改进而变化。'},
      {heading:'适用于企业、代理机构与多门店业务',body:'同一套方法可以服务本地企业、管理客户账户的代理机构、诊所、餐厅、酒店和连锁网络。重点是在保留每条评价上下文的同时，建立可重复的声誉运营流程。'}
    ],
    links:[
      {href:'/zh/google-reviews',label:'Google 评价管理'},
      {href:'/zh/online-reputation-management',label:'在线声誉管理'},
      {href:'/zh/ai-review-analysis',label:'AI 评论分析'},
      {href:'/zh/agencies',label:'代理机构'},
      {href:'/zh/clinics',label:'诊所'},
      {href:'/zh/restaurants',label:'餐厅'},
      {href:'/zh/blog',label:'评价与声誉指南'}
    ],
    cta:'开始 7 天免费试用'
  }
};

const langs:Lang[]=['en','es','zh'];
const urls={en:'https://filtraai.com/en',es:'https://filtraai.com/es',zh:'https://filtraai.com/zh',pt:'https://filtraai.com/',x:'https://filtraai.com/'};

export function generateStaticParams(){return langs.map(lang=>({lang}));}

export async function generateMetadata({params}:{params:Promise<{lang:string}>}):Promise<Metadata>{
  const {lang:raw}=await params;
  const lang=raw as Lang;
  if(!langs.includes(lang))return{};
  return {
    title:content[lang].title,
    description:content[lang].description,
    alternates:{canonical:urls[lang],languages:{'pt-BR':urls.pt,en:urls.en,es:urls.es,zh:urls.zh,'x-default':urls.pt}},
    openGraph:{type:'website',url:urls[lang],siteName:'Filtra.AI',title:content[lang].title,description:content[lang].description,locale:lang==='en'?'en_US':lang==='es'?'es_ES':'zh_CN'},
    robots:{index:true,follow:true}
  };
}

export default async function LocalizedHome({params}:{params:Promise<{lang:string}>}){
  const {lang:raw}=await params;
  const lang=raw as Lang;
  if(!langs.includes(lang))notFound();
  const t=content[lang];

  return <main lang={lang} className="min-h-screen bg-black text-zinc-100">
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html:JSON.stringify({
        '@context':'https://schema.org',
        '@type':'WebPage',
        name:t.title,
        description:t.description,
        url:urls[lang],
        inLanguage:lang,
        isPartOf:{'@type':'WebSite',name:'Filtra.AI',url:urls.pt}
      })}}
    />
    <header className="border-b border-zinc-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-semibold tracking-tight text-white">Filtra.AI</Link>
        <LanguageSwitcher compact />
      </div>
    </header>

    <section className="mx-auto max-w-5xl px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Filtra.AI</p>
      <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">{t.h1}</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">{t.intro}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {t.points.map(point=><div key={point} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 leading-7">{point}</div>)}
      </div>

      <div className="mt-16 space-y-12">
        {t.sections.map(section=>(
          <section key={section.heading}>
            <h2 className="text-2xl font-bold tracking-tight">{section.heading}</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-300">{section.body}</p>
          </section>
        ))}
      </div>

      <nav aria-label="Related topics" className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight">{lang==='en'?'Explore Filtra.AI topics':lang==='es'?'Explora los temas de Filtra.AI':'探索 Filtra.AI 主题'}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {t.links.map(link=><Link key={link.href} href={link.href} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm font-medium text-zinc-200 hover:border-indigo-500">{link.label}</Link>)}
        </div>
      </nav>

      <Link href="/teste" className="mt-10 inline-flex rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white">{t.cta}</Link>
    </section>
  </main>;
}
