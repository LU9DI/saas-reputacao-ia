import type { Metadata } from 'next';
import Link from 'next/link';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { BrandMark } from '../../components/BrandMark';

type Lang='en'|'es'|'zh';
const posts=[
['gestao-reputacao-online-guia','Online reputation management: practical guide','Gestión de reputación online: guía práctica','在线声誉管理：实用指南'],
['como-responder-avaliacoes-negativas','How to respond to negative reviews','Cómo responder reseñas negativas','如何回复负面评价'],
['como-conseguir-avaliacoes-google','How to get more Google reviews','Cómo conseguir más reseñas en Google','如何获得更多 Google 评价'],
['velocity-reviews-google-maps-2026','Why review velocity matters on Google Maps','Por qué importa la velocidad de reseñas','为什么 Google Maps 的评价节奏重要'],
['review-1-estrela-primeiras-24-horas','One-star review: what to do in 24 hours','Reseña de una estrella: qué hacer en 24 horas','一星评价：24 小时应该做什么'],
['qr-code-balcao-reviews','QR code at the counter: review workflow','QR en el mostrador: flujo de reseñas','柜台二维码：评价流程'],
['seo-local-avaliacoes-local-pack','Local SEO and reviews: Local Pack','SEO local y reseñas: Local Pack','本地 SEO 与评价：Local Pack'],
['clinica-checklist-avaliacoes-google','Clinic reputation: Google review checklist','Reputación de clínicas: checklist Google','诊所声誉：Google 评价清单'],
['agencia-vender-gestao-reputacao','Agency: sell reputation management as recurring service','Agencia: vender reputación como servicio recurrente','机构：把声誉管理做成持续服务'],
['whatsapp-pedir-estrela-vs-filtrar-qr','WhatsApp review request vs QR feedback','WhatsApp vs flujo QR de feedback','WhatsApp 请求评价 vs 二维码反馈']
] as const;
const t={en:{title:'Filtra.AI Blog',desc:'Reputation, Google Reviews and local SEO for businesses.',cta:'Free 7-day trial'},es:{title:'Blog Filtra.AI',desc:'Reputación, reseñas de Google y SEO local para negocios.',cta:'Prueba gratuita de 7 días'},zh:{title:'Filtra.AI 博客',desc:'面向企业的声誉、Google 评价和本地 SEO 内容。',cta:'7 天免费试用'}} as const;
export async function generateMetadata({params}:{params:Promise<{lang:Lang}>}):Promise<Metadata>{const {lang}=await params;return{title:t[lang].title,description:t[lang].desc,alternates:{canonical:`https://filtraai.com/${lang}/blog`}}}
export default async function Page({params}:{params:Promise<{lang:Lang}>}){const {lang}=await params;const idx=lang==='en'?1:lang==='es'?2:3;return <div className="min-h-screen bg-black text-zinc-100"><header className="mx-auto flex max-w-3xl items-center justify-between px-4 pt-6 pb-4"><BrandMark size="md" subtitle="Blog" href="/" /><LanguageSwitcher compact/></header><main className="mx-auto max-w-3xl space-y-7 px-4 pb-16"><div><h1 className="text-2xl font-bold text-zinc-50">{t[lang].title}</h1><p className="mt-2 text-sm text-zinc-400">{t[lang].desc}</p></div><ul className="space-y-4">{posts.map(([slug,en,es,zh])=><li key={slug} className="rounded-xl border border-zinc-800 p-4"><Link href={`/${lang}/blog/${slug}`} className="text-base font-medium text-indigo-300 hover:text-indigo-200">{[en,es,zh][idx-1]}</Link></li>)}</ul><Link href={`/${lang}/auditoria-gratuita`} className="inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white">{t[lang].cta}</Link></main></div>}
