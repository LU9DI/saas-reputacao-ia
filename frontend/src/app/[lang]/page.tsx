import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Lang='en'|'es'|'zh';

const content={
  en:{
    title:'Filtra.AI | AI online reputation management',
    description:'Manage online reputation, Google reviews and customer feedback with AI. Turn customer voice into growth decisions.',
    h1:'Turn customer voice into growth with AI',
    intro:'Filtra.AI organizes reviews and customer feedback so businesses can identify patterns, improve experience and manage reputation as a growth discipline.',
    points:['Manage Google reviews and reputation signals','Analyze customer feedback with AI','Identify recurring themes and operational priorities','Build a continuous reputation management routine'],
    cta:'Start your 7-day free trial'
  },
  es:{
    title:'Filtra.AI | Gestión de reputación online con IA',
    description:'Gestiona reputación online, reseñas de Google y feedback de clientes con IA. Convierte la voz del cliente en decisiones de crecimiento.',
    h1:'Convierte la voz del cliente en crecimiento con IA',
    intro:'Filtra.AI organiza reseñas y feedback para identificar patrones, mejorar la experiencia y gestionar la reputación como una disciplina de crecimiento.',
    points:['Gestiona reseñas de Google y señales de reputación','Analiza feedback de clientes con IA','Identifica temas recurrentes y prioridades operativas','Construye una rutina continua de gestión de reputación'],
    cta:'Comenzar prueba gratuita de 7 días'
  },
  zh:{
    title:'Filtra.AI | AI 在线声誉管理',
    description:'使用 AI 管理在线声誉、Google 评价和客户反馈，将客户声音转化为增长决策。',
    h1:'用 AI 将客户声音转化为业务增长',
    intro:'Filtra.AI 整理评价和客户反馈，帮助企业发现模式、改善体验，并把声誉管理变成持续的增长能力。',
    points:['管理 Google 评价和声誉信号','使用 AI 分析客户反馈','发现重复主题和运营优先事项','建立持续的声誉管理流程'],
    cta:'开始 7 天免费试用'
  }
} satisfies Record<Lang,{title:string;description:string;h1:string;intro:string;points:string[];cta:string}>;

const langs:Lang[]=['en','es','zh'];
const urls={en:'https://filtraai.com/en',es:'https://filtraai.com/es',zh:'https://filtraai.com/zh',pt:'https://filtraai.com/',x:'https://filtraai.com/'};

export function generateStaticParams(){return langs.map(lang=>({lang}));}

export async function generateMetadata({params}:{params:Promise<{lang:string}>}):Promise<Metadata>{
  const {lang:raw}=await params; const lang=raw as Lang; if(!langs.includes(lang))return{};
  return {
    title:content[lang].title,
    description:content[lang].description,
    alternates:{canonical:urls[lang],languages:{'pt-BR':urls.pt,en:urls.en,es:urls.es,zh:urls.zh,'x-default':urls.pt}},
    openGraph:{type:'website',url:urls[lang],siteName:'Filtra.AI',title:content[lang].title,description:content[lang].description,locale:lang==='en'?'en_US':lang==='es'?'es_ES':'zh_CN'}
  };
}

export default async function LocalizedHome({params}:{params:Promise<{lang:string}>}){
  const {lang:raw}=await params; const lang=raw as Lang; if(!langs.includes(lang))notFound();
  const t=content[lang];
  return <main lang={lang} className="min-h-screen bg-black text-zinc-100">
    <header className="border-b border-zinc-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a href="/" className="font-semibold tracking-tight text-white">Filtra.AI</a>
        <nav aria-label="Language alternatives" className="flex gap-4 text-xs text-zinc-400">
          <a href="/" className="hover:text-white">Português</a>
          <a href="/en" className={lang==='en'?'text-white':'hover:text-white'}>English</a>
          <a href="/es" className={lang==='es'?'text-white':'hover:text-white'}>Español</a>
          <a href="/zh" className={lang==='zh'?'text-white':'hover:text-white'}>中文</a>
        </nav>
      </div>
    </header>
    <section className="mx-auto max-w-4xl px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Filtra.AI</p>
      <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">{t.h1}</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">{t.intro}</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {t.points.map(point=><div key={point} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 leading-7">{point}</div>)}
      </div>
      <a href="/teste" className="mt-10 inline-flex rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white">{t.cta}</a>
    </section>
  </main>;
}
