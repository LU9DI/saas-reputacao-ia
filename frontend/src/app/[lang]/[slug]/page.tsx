import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { BrandMark } from '../../components/BrandMark';

type Lang = 'en' | 'es' | 'zh';
type Item = { slug:string; title:string; description:string; h1:string; intro:string; bullets:string[]; cta:string };

const base='https://filtraai.com';

const pages: Record<Lang,Item[]> = {
en:[
{slug:'ai',title:'AI Review Analysis and Customer Feedback Intelligence',description:'Turn customer reviews and feedback into actionable insights for reputation, customer experience and growth with Filtra.AI.',h1:'Turn customer voice into business growth with AI',intro:'Filtra.AI analyzes reviews and customer feedback to reveal recurring problems, opportunities and priorities your team can act on.',bullets:['Analyze customer reviews with AI','Identify recurring complaints and opportunities','Turn feedback into clear action priorities','Improve online reputation and customer experience'],cta:'Start your free audit'},
{slug:'customer-feedback',title:'Customer Feedback Management with AI',description:'Centralize customer feedback, identify patterns and turn customer voice into growth opportunities.',h1:'Customer feedback that becomes action',intro:'Customer feedback is more than a collection of comments. Filtra.AI turns what customers say into decisions that improve experience and growth.',bullets:['Organize customer feedback','Detect patterns across reviews','Prioritize the issues that matter','Measure reputation and experience signals'],cta:'See how Filtra.AI works'},
{slug:'ai-review-analysis',title:'AI Review Analysis for Businesses',description:'Analyze online reviews with AI, detect trends and identify what customers value or criticize most.',h1:'Analyze reviews with AI',intro:'Understand the meaning behind your reviews without reading every comment manually.',bullets:['Find recurring themes','Detect negative experience signals','Discover customer strengths','Create actionable priorities'],cta:'Get a free audit'},
{slug:'online-reputation-management',title:'AI Online Reputation Management',description:'Monitor customer reviews and transform reputation signals into actions for visibility, trust and growth.',h1:'Manage online reputation with intelligence',intro:'Your reputation is built by customer experiences. Filtra.AI helps teams understand reputation signals and act on them.',bullets:['Monitor reputation signals','Understand negative reviews','Identify improvement opportunities','Turn reputation into a growth asset'],cta:'Explore reputation management'},
{slug:'google-reviews',title:'Google Reviews Management and Analysis',description:'Analyze Google reviews with AI and discover opportunities to improve customer experience and online reputation.',h1:'Turn Google Reviews into growth signals',intro:'Google reviews influence how customers perceive a business. Filtra.AI helps you understand what those reviews reveal.',bullets:['Analyze Google review patterns','Find recurring customer issues','Understand positive experience drivers','Build a stronger review strategy'],cta:'Start with a free audit'}],
es:[
{slug:'ia',title:'Análisis de reseñas con IA e inteligencia de clientes',description:'Convierte reseñas y comentarios de clientes en información accionable para reputación, experiencia y crecimiento.',h1:'Convierte la voz del cliente en crecimiento con IA',intro:'Filtra.AI analiza reseñas y comentarios para revelar problemas recurrentes, oportunidades y prioridades de acción.',bullets:['Analiza reseñas con IA','Detecta quejas y oportunidades','Convierte comentarios en prioridades','Mejora reputación y experiencia'],cta:'Solicitar auditoría gratuita'},
{slug:'feedback-clientes',title:'Gestión de feedback de clientes con IA',description:'Centraliza el feedback, identifica patrones y convierte la voz del cliente en oportunidades de crecimiento.',h1:'Feedback de clientes que se convierte en acción',intro:'Filtra.AI ayuda a convertir lo que dicen los clientes en decisiones que mejoran experiencia y crecimiento.',bullets:['Organiza el feedback','Detecta patrones en reseñas','Prioriza problemas importantes','Mide señales de reputación'],cta:'Cómo funciona Filtra.AI'},
{slug:'analisis-resenas-ia',title:'Análisis de reseñas con IA para empresas',description:'Analiza reseñas online con IA, detecta tendencias y descubre qué valoran o critican más tus clientes.',h1:'Analiza reseñas con IA',intro:'Comprende el significado de tus reseñas sin leer cada comentario manualmente.',bullets:['Encuentra temas recurrentes','Detecta experiencia negativa','Descubre fortalezas','Crea prioridades accionables'],cta:'Obtener auditoría gratuita'},
{slug:'gestion-reputacion-online',title:'Gestión de reputación online con IA',description:'Monitorea reseñas y convierte señales de reputación en acciones para mejorar confianza y crecimiento.',h1:'Gestiona tu reputación online con inteligencia',intro:'Filtra.AI ayuda a entender las señales de reputación y actuar sobre ellas.',bullets:['Monitorea señales','Comprende reseñas negativas','Encuentra oportunidades','Convierte reputación en crecimiento'],cta:'Explorar gestión de reputación'},
{slug:'resenas-google',title:'Gestión y análisis de reseñas de Google',description:'Analiza reseñas de Google con IA y descubre oportunidades para mejorar experiencia y reputación.',h1:'Convierte las reseñas de Google en señales de crecimiento',intro:'Filtra.AI ayuda a entender qué revelan las reseñas de Google sobre tu negocio.',bullets:['Analiza patrones','Encuentra problemas recurrentes','Comprende experiencias positivas','Construye una estrategia de reseñas'],cta:'Solicitar auditoría gratuita'}],
zh:[
{slug:'ai',title:'AI 评论分析与客户反馈智能',description:'使用 Filtra.AI 将客户评论和反馈转化为可执行洞察，改善声誉、客户体验和业务增长。',h1:'用 AI 将客户声音转化为业务增长',intro:'Filtra.AI 分析评论和客户反馈，发现重复问题、机会和行动优先级。',bullets:['使用 AI 分析客户评论','发现重复投诉和机会','将反馈转化为行动优先级','改善在线声誉和客户体验'],cta:'开始免费审计'},
{slug:'customer-feedback',title:'AI 客户反馈管理',description:'集中管理客户反馈，发现模式，并将客户声音转化为增长机会。',h1:'让客户反馈真正产生行动',intro:'Filtra.AI 帮助企业将客户声音转化为改善体验和增长的决策。',bullets:['整理客户反馈','发现评论中的模式','确定重要问题优先级','衡量声誉和体验信号'],cta:'了解 Filtra.AI'},
{slug:'ai-review-analysis',title:'企业 AI 评论分析',description:'使用 AI 分析在线评论，发现趋势并了解客户最重视或最不满意的方面。',h1:'使用 AI 分析客户评论',intro:'无需手动阅读每一条评论，也能理解评论背后的业务信号。',bullets:['发现重复主题','识别负面体验','发现客户认可的优势','建立可执行优先级'],cta:'获取免费审计'},
{slug:'online-reputation-management',title:'AI 在线声誉管理',description:'监测客户评论，将声誉信号转化为改善信任、可见度和增长的行动。',h1:'用智能管理在线声誉',intro:'Filtra.AI 帮助团队理解声誉信号并及时行动。',bullets:['监测声誉信号','理解负面评论','发现积极体验机会','将声誉转化为增长资产'],cta:'了解声誉管理'},
{slug:'google-reviews',title:'Google 评论管理与分析',description:'使用 AI 分析 Google 评论，发现改善客户体验和在线声誉的机会。',h1:'将 Google 评论转化为增长信号',intro:'Filtra.AI 帮助企业理解 Google 评论揭示的信息。',bullets:['分析 Google 评论模式','发现重复客户问题','了解积极体验驱动因素','建立更好的评论策略'],cta:'开始免费审计'}]
};

const sourcePaths=['/ia','/feedback-de-clientes','/analise-de-avaliacoes-com-ia','/gestao-de-reputacao-online','/avaliacoes-google'];

export function generateStaticParams(){return (Object.entries(pages) as [Lang,Item[]][]).flatMap(([lang,items])=>items.map(x=>({lang,slug:x.slug})));}

function get(lang:string,slug:string){const items=pages[lang as Lang];if(!items)return null;const index=items.findIndex(x=>x.slug===slug);return index<0?null:{item:items[index],index};}

export async function generateMetadata({params}:{params:Promise<{lang:string;slug:string}>}):Promise<Metadata>{
 const {lang,slug}=await params; const found=get(lang,slug); if(!found)return{};
 const languages:Record<string,string>={
   'pt-BR':base+sourcePaths[found.index],
   'en':base+'/en/'+pages.en[found.index].slug,
   'es':base+'/es/'+pages.es[found.index].slug,
   'zh-CN':base+'/zh/'+pages.zh[found.index].slug,
   'x-default':base+sourcePaths[found.index],
 };
 return {title:found.item.title,description:found.item.description,alternates:{canonical:base+'/'+lang+'/'+slug,languages}};
}

export default async function Page({params}:{params:Promise<{lang:string;slug:string}>}){
 const {lang,slug}=await params; const found=get(lang,slug); if(!found)notFound();
 const href=sourcePaths[found.index];
 return <main className="min-h-screen bg-black text-zinc-100"><header className="border-b border-zinc-800"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><Link href="/"><BrandMark/></Link><LanguageSwitcher compact/></div></header><section className="mx-auto max-w-5xl px-6 py-20"><p className="mb-4 text-sm font-medium text-indigo-400">Filtra.AI</p><h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">{found.item.h1}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">{found.item.intro}</p><div className="mt-10 grid gap-4 sm:grid-cols-2">{found.item.bullets.map(x=><div key={x} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">{x}</div>)}</div><Link href={href} className="mt-10 inline-flex rounded-xl bg-indigo-500 px-6 py-3 font-semibold">{found.item.cta}</Link></section></main>;
}