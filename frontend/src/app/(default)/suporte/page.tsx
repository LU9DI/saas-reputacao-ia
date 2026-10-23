'use client';
import Link from 'next/link';
import { BrandMark } from '../../components/BrandMark';
import { PreviewNavigator } from '../../components/PreviewNavigator';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useLanguage, type Language } from '../../Contexts/LanguageContext';

const email = 'projetosaas1@gmail.com';
const copy: Record<Language, {title:string;intro:string;emailLabel:string;hours:string;home:string;terms:string;privacy:string}> = {
  pt:{title:'Suporte Filtra.AI',intro:'Precisa de ajuda com a conta, avaliações, relatórios, integrações ou cobrança? Fale com a equipe do Filtra.AI.',emailLabel:'E-mail de suporte',hours:'Atendimento por e-mail. Envie o contexto do problema e, quando possível, a mensagem de erro ou a página em que ocorreu.',home:'Voltar ao início',terms:'Termos de Uso',privacy:'Política de Privacidade'},
  en:{title:'Filtra.AI Support',intro:'Need help with your account, reviews, reports, integrations, or billing? Contact the Filtra.AI team.',emailLabel:'Support email',hours:'Email support. Include the problem context and, when possible, the error message or page where it occurred.',home:'Back to home',terms:'Terms of Use',privacy:'Privacy Policy'},
  es:{title:'Soporte Filtra.AI',intro:'¿Necesitas ayuda con tu cuenta, reseñas, informes, integraciones o facturación? Contacta al equipo de Filtra.AI.',emailLabel:'Correo de soporte',hours:'Soporte por correo electrónico. Incluye el contexto del problema y, cuando sea posible, el mensaje de error o la página donde ocurrió.',home:'Volver al inicio',terms:'Términos de Uso',privacy:'Política de Privacidad'},
  zh:{title:'Filtra.AI 客服',intro:'如果您需要账户、评价、报告、集成或账单方面的帮助，请联系 Filtra.AI 团队。',emailLabel:'客服邮箱',hours:'通过电子邮件提供支持。请说明问题背景，并尽可能提供错误信息或发生问题的页面。',home:'返回首页',terms:'使用条款',privacy:'隐私政策'}
};

export default function SuportePage(){
  const {language}=useLanguage(); const c=copy[language];
  return <div className="min-h-screen bg-black text-zinc-100 font-sans"><header className="mx-auto flex max-w-3xl items-center justify-between px-4 pb-4 pt-6"><BrandMark size="md" subtitle="Reputation" href="/preview"/><LanguageSwitcher/></header><PreviewNavigator/><main className="mx-auto max-w-3xl space-y-6 px-4 pb-16"><h1 className="text-2xl font-bold tracking-tight">{c.title}</h1><p className="text-sm leading-relaxed text-zinc-300">{c.intro}</p><section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5"><h2 className="text-sm font-semibold text-zinc-100">{c.emailLabel}</h2><a href={'mailto:'+email} className="mt-2 inline-block text-indigo-400 underline">{email}</a><p className="mt-4 text-sm leading-relaxed text-zinc-400">{c.hours}</p></section><div className="flex flex-wrap gap-3 text-sm"><Link href="/preview" className="text-indigo-400 underline">{c.home}</Link><Link href="/termos" className="text-zinc-400 underline">{c.terms}</Link><Link href="/privacidade" className="text-zinc-400 underline">{c.privacy}</Link></div></main></div>
}
