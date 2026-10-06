import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { BrandMark } from '../../components/BrandMark';

type Lang='en'|'es'|'zh';
type Article={slug:string;title:string;description:string};

const base='https://filtraai.com';

const content:Record<Lang,{title:string;description:string;heading:string;intro:string;articles:Article[];cta:string}>={
  en:{
    title:'Filtra.AI Blog | Reviews, Reputation and AI',
    description:'Guides about Google reviews, online reputation management, AI review analysis and local SEO.',
    heading:'Reviews, reputation and customer experience',
    intro:'Practical guides for businesses that want to turn customer feedback into better decisions, stronger reputation and sustainable local growth.',
    articles:[
      {slug:'get-google-reviews',title:'How to Get More Genuine Google Reviews',description:'How to make honest review collection easier without selecting customers by rating.'},
      {slug:'online-reputation-management-guide',title:'Online Reputation Management: A Practical Guide',description:'Build a repeatable process around reviews, feedback, analysis and action.'},
      {slug:'ai-review-analysis-guide',title:'AI Review Analysis: How to Turn Comments into Decisions',description:'Use AI to find recurring themes and prioritize operational action.'},
      {slug:'agency-reputation-management',title:'Agency Reputation Management: How to Build a Recurring Local SEO Service',description:'A practical guide for SEO agencies offering reputation management as a recurring local SEO service.'},
      {slug:'local-seo-google-reviews',title:'Local SEO and Google Reviews: What Businesses Should Monitor',description:'Connect local SEO, customer experience and reviews in one routine.'}
    ],
    cta:'Start your 7-day free trial'
  },
  es:{
    title:'Blog Filtra.AI | Reseñas, reputación e IA',
    description:'Guías sobre reseñas de Google, gestión de reputación, análisis con IA y SEO local.',
    heading:'Reseñas, reputación y experiencia del cliente',
    intro:'Guías prácticas para empresas que quieren convertir el feedback de clientes en mejores decisiones, una reputación más sólida y crecimiento local sostenible.',
    articles:[
      {slug:'conseguir-resenas-google',title:'Cómo conseguir más reseñas genuinas en Google',description:'Cómo facilitar reseñas honestas sin seleccionar clientes por valoración.'},
      {slug:'guia-gestion-reputacion-online',title:'Gestión de reputación online: guía práctica',description:'Crea un proceso repetible de reseñas, feedback, análisis y acción.'},
      {slug:'analisis-resenas-ia',title:'Análisis de reseñas con IA: de los comentarios a las decisiones',description:'Usa IA para detectar temas recurrentes y priorizar acciones.'},
      {slug:'agencia-gestion-reputacion',title:'Gestión de reputación para agencias: cómo crear un servicio recurrente de SEO local',description:'Guía práctica para agencias SEO que ofrecen gestión de reputación como servicio recurrente.'},
      {slug:'seo-local-resenas-google',title:'SEO local y reseñas de Google: qué debe monitorizar una empresa',description:'Conecta SEO local, experiencia del cliente y reputación.'}
    ],
    cta:'Comenzar prueba gratuita de 7 días'
  },
  zh:{
    title:'Filtra.AI 博客 | Google 评价、声誉与 AI',
    description:'关于 Google 评价、在线声誉管理、AI 评论分析和本地 SEO 的实用指南。',
    heading:'评价、声誉与客户体验',
    intro:'为希望把客户反馈转化为管理决策、品牌信任和可持续本地增长的企业提供实用指南。',
    articles:[
      {slug:'google-reviews-guide',title:'如何获得更多真实的 Google 评价',description:'如何让真实评价更容易发生，同时避免按评分选择客户。'},
      {slug:'online-reputation-management-guide',title:'在线声誉管理：企业实用指南',description:'围绕评价、反馈、分析和行动建立可重复流程。'},
      {slug:'ai-review-analysis-guide',title:'AI 评论分析：如何把评论转化为管理决策',description:'使用 AI 发现重复主题并确定运营优先级。'},
      {slug:'agency-reputation-management',title:'代理商声誉管理：如何建立可重复的本地 SEO 服务',description:'为 SEO 代理商提供持续性的声誉管理服务指南。'},
      {slug:'local-seo-google-reviews',title:'本地 SEO 与 Google 评价：企业应该监测什么',description:'把本地 SEO、客户体验和评价连接成持续流程。'}
    ],
    cta:'开始 7 天免费试用'
  }
};

const home={en:'/en',es:'/es',zh:'/zh'};
const blog={en:'/en/blog',es:'/es/blog',zh:'/zh/blog'};

export function generateStaticParams(){return (['en','es','zh'] as Lang[]).map(lang=>({lang}));}

export async function generateMetadata({params}:{params:Promise<{lang:string}>}):Promise<Metadata>{
  const {lang:raw}=await params;
  const lang=raw as Lang;
  if(!(lang in content))return{};
  const t=content[lang];
  return {
    title:t.title,
    description:t.description,
    alternates:{
      canonical:base+blog[lang],
      languages:{
        'pt-BR':base+'/blog',
        en:base+blog.en,
        es:base+blog.es,
        zh:base+blog.zh,
        'x-default':base+'/blog'
      }
    },
    openGraph:{type:'website',url:base+blog[lang],siteName:'Filtra.AI',title:t.title,description:t.description},
    robots:{index:true,follow:true}
  };
}

export default async function LocalizedBlogIndex({params}:{params:Promise<{lang:string}>}){
  const {lang:raw}=await params;
  const lang=raw as Lang;
  if(!(lang in content))notFound();
  const t=content[lang];

  return <main lang={lang} className="min-h-screen bg-black text-zinc-100">
    <header className="border-b border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href={home[lang]} className="font-semibold tracking-tight text-white"><BrandMark/></Link>
        <LanguageSwitcher compact/>
      </div>
    </header>
    <section className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Filtra.AI</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{t.heading}</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">{t.intro}</p>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {t.articles.map(article=><Link key={article.slug} href={blog[lang]+'/'+article.slug} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 hover:border-indigo-500">
          <h2 className="text-xl font-semibold">{article.title}</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{article.description}</p>
        </Link>)}
      </div>
      <Link href={home[lang]} className="mt-10 inline-flex rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white">{t.cta}</Link>
    </section>
  </main>;
}
