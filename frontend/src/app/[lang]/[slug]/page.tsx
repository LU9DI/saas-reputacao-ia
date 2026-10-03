import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { BrandMark } from '../../components/BrandMark';

type Lang='en'|'es'|'zh';
type Item={slug:string;title:string;description:string;h1:string;intro:string;bullets:string[];cta:string};
const base='https://filtraai.com';
const sourcePaths=['/ia','/feedback-de-clientes','/analise-de-avaliacoes-com-ia','/gestao-de-reputacao-online','/avaliacoes-google','/hoteis','/restaurantes','/clinicas','/agencias','/franquias','/turismo','/associacoes','/parceiros','/como-funciona','/pedir-estrela-vs-filtrar','/auditoria-gratuita'];

const pt=[
['ia','IA para avaliações e feedback','Transforme avaliações e feedback em insights acionáveis.','Transforme a voz do cliente em crescimento com IA'],
['feedback-de-clientes','Gestão de feedback de clientes','Centralize opiniões, encontre padrões e transforme feedback em ações.','Feedback de clientes que vira ação'],
['analise-de-avaliacoes-com-ia','Análise de avaliações com IA','Analise avaliações, detecte tendências e encontre prioridades.','Analise avaliações com IA'],
['gestao-de-reputacao-online','Gestão de reputação online','Organize sinais de reputação e transforme-os em ações.','Gestão de reputação online com inteligência'],
['avaliacoes-google','Gestão e análise de avaliações Google','Entenda avaliações Google e encontre oportunidades de melhoria.','Transforme avaliações Google em sinais de crescimento'],
['hoteis','Reputação para hotéis','Organize avaliações de hóspedes e padrões de experiência.','Hotéis: transforme avaliações em melhoria'],
['restaurantes','Reputação para restaurantes','Organize avaliações e feedback de salão, delivery e atendimento.','Reputação no Google para restaurantes'],
['clinicas','Reputação para clínicas','Organize feedback de pacientes e sinais de experiência.','Clínicas: organize a reputação antes do Google'],
['agencias','Reputação para agências','Acrescente gestão de reputação e feedback à oferta da agência.','Ofereça reputação operacional aos seus clientes'],
['franquias','Reputação para franquias e redes','Compare padrões de experiência entre unidades.','Franquias e redes: visão da reputação por unidade'],
['turismo','Reputação para turismo e hotelaria','Transforme avaliações de visitantes em melhoria da experiência.','Turismo: transforme avaliações em melhoria'],
['associacoes','Feedback para associações e federações','Organize feedback de associados, empresas e públicos.','Associações e federações: transforme feedback em gestão'],
['parceiros','Programa de parceiros Filtra.AI','Leve gestão de reputação para empresas atendidas por sua organização.','Leve gestão de reputação para mais empresas'],
['como-funciona','Como funciona o Filtra.AI','Veja o fluxo de feedback, avaliações e gestão de reputação.','Como funciona o Filtra.AI'],
['pedir-estrela-vs-filtrar','Pedir avaliação não basta','Entenda a diferença entre apenas pedir avaliação e organizar o feedback.','Pedir avaliação não é controlar reputação'],
['auditoria-gratuita','Auditoria gratuita','Faça um diagnóstico inicial das avaliações e da reputação da empresa.','Auditoria gratuita de reputação']
];
const data=(lang:Lang):Item[]=>{
 const labels:Record<Lang,string>={en:'Start your free audit',es:'Solicitar auditoría gratuita',zh:'开始免费审计'};
 const prefix:Record<Lang,string>={en:'Filtra.AI helps businesses understand customer feedback and reputation signals.',es:'Filtra.AI ayuda a las empresas a comprender el feedback y las señales de reputación.',zh:'Filtra.AI 帮助企业理解客户反馈和声誉信号。'};
 const maps:Record<Lang,string[]>={
  en:['AI Review Analysis','Customer Feedback Management','AI Review Analysis for Businesses','Online Reputation Management','Google Reviews Management','Hotel Reputation Management','Restaurant Reputation Management','Clinic Reputation Management','Reputation for Marketing Agencies','Franchise Reputation Management','Tourism Reputation Management','Feedback for Associations','Partner Program','How Filtra.AI Works','Asking for Reviews vs Managing Reputation','Free Reputation Audit'],
  es:['Análisis de reseñas con IA','Gestión de feedback de clientes','Análisis de reseñas con IA para empresas','Gestión de reputación online','Gestión de reseñas de Google','Reputación para hoteles','Reputación para restaurantes','Reputación para clínicas','Reputación para agencias','Reputación para franquicias','Reputación para turismo','Feedback para asociaciones','Programa de socios','Cómo funciona Filtra.AI','Pedir reseñas vs gestionar reputación','Auditoría gratuita de reputación'],
  zh:['AI 评论分析','客户反馈管理','企业 AI 评论分析','在线声誉管理','Google 评论管理','酒店声誉管理','餐厅声誉管理','诊所声誉管理','营销机构声誉服务','连锁品牌声誉管理','旅游业声誉管理','协会反馈管理','合作伙伴计划','Filtra.AI 如何工作','索取评论与管理声誉','免费声誉审计']
 };
 return pt.map((x,i)=>({slug:x[0],title:maps[lang][i],description:prefix[lang],h1:maps[lang][i],intro:prefix[lang],bullets:lang==='en'?['Organize customer feedback','Identify recurring patterns','Prioritize actions','Track reputation signals']:lang==='es'?['Organiza el feedback','Identifica patrones recurrentes','Prioriza acciones','Acompaña señales de reputación']:['整理客户反馈','发现重复模式','确定行动优先级','跟踪声誉信号'],cta:labels[lang]}));
};
const pages:Record<Lang,Item[]>={
 en:data('en'),es:data('es'),zh:data('zh')
};
export function generateStaticParams(){return (Object.entries(pages) as [Lang,Item[]][]).flatMap(([lang,items])=>items.map(x=>({lang,slug:x.slug})));}
function get(lang:string,slug:string){const items=pages[lang as Lang];if(!items)return null;const index=items.findIndex(x=>x.slug===slug);return index<0?null:{item:items[index],index};}
export async function generateMetadata({params}:{params:Promise<{lang:string;slug:string}>}):Promise<Metadata>{
 const {lang,slug}=await params;const found=get(lang,slug);if(!found)return{};
 const languages:Record<string,string>={'pt-BR':base+sourcePaths[found.index],'en':base+'/en/'+pages.en[found.index].slug,'es':base+'/es/'+pages.es[found.index].slug,'zh-CN':base+'/zh/'+pages.zh[found.index].slug,'x-default':base+sourcePaths[found.index]};
 return {title:found.item.title,description:found.item.description,alternates:{canonical:base+'/'+lang+'/'+slug,languages}};
}
export default async function Page({params}:{params:Promise<{lang:string;slug:string}>}){
 const {lang,slug}=await params;const found=get(lang,slug);if(!found)notFound();
 const href=sourcePaths[found.index];
 return <main className="min-h-screen bg-black text-zinc-100"><header className="border-b border-zinc-800"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><Link href="/"><BrandMark/></Link><LanguageSwitcher compact/></div></header><section className="mx-auto max-w-5xl px-6 py-20"><p className="mb-4 text-sm font-medium text-indigo-400">Filtra.AI</p><h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">{found.item.h1}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">{found.item.intro}</p><div className="mt-10 grid gap-4 sm:grid-cols-2">{found.item.bullets.map(x=><div key={x} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">{x}</div>)}</div><Link href={href} className="mt-10 inline-flex rounded-xl bg-indigo-500 px-6 py-3 font-semibold">{found.item.cta}</Link></section></main>;
}