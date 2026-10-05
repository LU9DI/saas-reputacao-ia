'use client';

import { usePathname } from 'next/navigation';
import { SUPPORTED_LANGUAGES, useLanguage, type Language } from '../Contexts/LanguageContext';

const LEGACY_SEO_SLUGS: Record<Language, Record<string,string>> = {
  en: { ai:'ai', 'customer-feedback':'customer-feedback', 'ai-review-analysis':'ai-review-analysis', 'online-reputation-management':'online-reputation-management', 'google-reviews':'google-reviews' },
  es: { ia:'ia', 'feedback-clientes':'feedback-clientes', 'analisis-resenas-ia':'analisis-resenas-ia', 'gestion-reputacion-online':'gestion-reputacion-online', 'resenas-google':'resenas-google' },
  zh: { ai:'ai', 'customer-feedback':'customer-feedback', 'ai-review-analysis':'ai-review-analysis', 'online-reputation-management':'online-reputation-management', 'google-reviews':'google-reviews' },
};

function legacySeoTarget(pathname: string, language: Language): string | null {
  const match = pathname.match(/^\/(en|es|zh)\/([^/]+)\/?$/);
  if (!match) return null;
  const slug = LEGACY_SEO_SLUGS[language][match[2]];
  return slug ? `/${language}/${slug}` : null;
}

export function LanguageSwitcher({className='',compact=false,variant='select'}:{className?:string;compact?:boolean;variant?:'select'|'flags'}) {
  const {language,setLanguage,tx}=useLanguage();
  const pathname=usePathname();
  const current=(['pt','en','es','zh'] as Language[]).includes(language)?language:'pt';

  const onChange=(raw:string)=>{
    const code=String(raw||'').toLowerCase().slice(0,2) as Language;
    if(!['pt','en','es','zh'].includes(code))return;
    setLanguage(code);
    if(typeof window==='undefined')return;
    // Legacy /:lang/:slug SEO pages are server-rendered and must move to the
    // equivalent localized route. The newer root SEO pages stay on the same URL
    // and update immediately from LanguageContext without a full reload.
    const target=legacySeoTarget(pathname||'',code);
    if(target && target!==pathname) window.location.assign(target);
  };

  if(variant==='flags') return <div className={`inline-flex items-center gap-1 ${className}`} role="group" aria-label={tx('language','Idioma')}>{SUPPORTED_LANGUAGES.map(l=><button key={l.code} type="button" onClick={()=>onChange(l.code)} title={l.label} aria-label={l.label} aria-pressed={current===l.code} className={`text-sm px-2 py-1 rounded-lg border ${current===l.code?'border-indigo-500 bg-indigo-500/20 text-zinc-50':'border-zinc-700 bg-zinc-900 text-zinc-400'}`}><span aria-hidden>{l.flag}</span>{!compact&&<span className="ml-1 hidden sm:inline">{l.code.toUpperCase()}</span>}</button>)}</div>;

  return <div className={`inline-flex items-center gap-1.5 ${className}`}>{!compact&&<span className="text-xs text-zinc-500 hidden sm:inline">{tx('language','Idioma')}</span>}<select aria-label={tx('language','Idioma')} value={current} onChange={e=>onChange(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">{SUPPORTED_LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}</select></div>;
}