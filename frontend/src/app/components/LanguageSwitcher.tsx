'use client';

import { SUPPORTED_LANGUAGES, useLanguage, type Language } from '../Contexts/LanguageContext';

const localizedSlugs: Record<Exclude<Language,'pt'>,string[]> = {
  en:['ia','feedback-de-clientes','analise-de-avaliacoes-com-ia','gestao-de-reputacao-online','avaliacoes-google','hoteis','restaurantes','clinicas','agencias','franquias','turismo','associacoes','parceiros','como-funciona','pedir-estrela-vs-filtrar','auditoria-gratuita'],
  es:['ia','feedback-de-clientes','analise-de-avaliacoes-com-ia','gestao-de-reputacao-online','avaliacoes-google','hoteis','restaurantes','clinicas','agencias','franquias','turismo','associacoes','parceiros','como-funciona','pedir-estrela-vs-filtrar','auditoria-gratuita'],
  zh:['ia','feedback-de-clientes','analise-de-avaliacoes-com-ia','gestao-de-reputacao-online','avaliacoes-google','hoteis','restaurantes','clinicas','agencias','franquias','turismo','associacoes','parceiros','como-funciona','pedir-estrela-vs-filtrar','auditoria-gratuita'],
};
const blogSlugs=['gestao-reputacao-online-guia','como-responder-avaliacoes-negativas','como-conseguir-avaliacoes-google','velocity-reviews-google-maps-2026','review-1-estrela-primeiras-24-horas','qr-code-balcao-reviews','seo-local-avaliacoes-local-pack','clinica-checklist-avaliacoes-google','agencia-vender-gestao-reputacao','whatsapp-pedir-estrela-vs-filtrar-qr'];
const sourcePaths=['/ia','/feedback-de-clientes','/analise-de-avaliacoes-com-ia','/gestao-de-reputacao-online','/avaliacoes-google','/hoteis','/restaurantes','/clinicas','/agencias','/franquias','/turismo','/associacoes','/parceiros','/como-funciona','/pedir-estrela-vs-filtrar','/auditoria-gratuita'];

export function LanguageSwitcher({className='',compact=false,variant='select'}:{className?:string;compact?:boolean;variant?:'select'|'flags'}) {
  const {language,setLanguage,tx}=useLanguage();
  const current=(['pt','en','es','zh'] as Language[]).includes(language)?language:'pt';

  const onChange=(raw:string)=>{
    const code=String(raw||'').toLowerCase().slice(0,2) as Language;
    if(!['pt','en','es','zh'].includes(code))return;
    setLanguage(code);
    if(typeof window==='undefined')return;
    const path=window.location.pathname;
    if(path==='/' || path==='/en' || path==='/es' || path==='/zh'){
      if(code==='pt'){ if(path!=='/') window.location.href='/'; }
      else if(path!=='/'+code) window.location.href='/'+code;
      return;
    }
    const sourceIndex=sourcePaths.indexOf(path);
    const blogIndex=path==='/blog' ? -1 : (path.startsWith('/blog/') ? blogSlugs.indexOf(path.slice(6)) : -2);
    if(path==='/blog'){ if(code!=='pt') window.location.href='/'+code+'/blog'; return; }
    if(blogIndex>=0){ if(code==='pt') return; window.location.href='/'+code+'/blog/'+blogSlugs[blogIndex]; return; }
    if(sourceIndex>=0){
      if(code==='pt')return;
      window.location.href='/'+code+'/'+localizedSlugs[code][sourceIndex];
      return;
    }
    const parts=path.split('/').filter(Boolean);
    const prefix=parts[0] as Language|undefined;
    const slug=parts[1];
    if(prefix && ['en','es','zh'].includes(prefix) && slug==='blog'){ const blogSlug=parts[2]; if(!blogSlug){ if(code==='pt'){window.location.href='/blog';return;} window.location.href='/'+code+'/blog';return;} const bi=blogSlugs.indexOf(blogSlug); if(bi>=0){ if(code==='pt'){window.location.href='/blog/'+blogSlugs[bi];return;} window.location.href='/'+code+'/blog/'+blogSlugs[bi];return;} }
    if(prefix && ['en','es','zh'].includes(prefix) && slug){
      const index=localizedSlugs[prefix as Exclude<Language,'pt'>].indexOf(slug);
      if(index>=0){
        if(code==='pt'){window.location.href=sourcePaths[index];return;}
        window.location.href='/'+code+'/'+localizedSlugs[code][index];
      }
    }
  };

  if(variant==='flags') return <div className={`inline-flex items-center gap-1 ${className}`} role="group" aria-label={tx('language','Idioma')}>{SUPPORTED_LANGUAGES.map(l=><button key={l.code} type="button" onClick={()=>onChange(l.code)} title={l.label} aria-label={l.label} aria-pressed={current===l.code} className={`text-sm px-2 py-1 rounded-lg border ${current===l.code?'border-indigo-500 bg-indigo-500/20 text-zinc-50':'border-zinc-700 bg-zinc-900 text-zinc-400'}`}><span aria-hidden>{l.flag}</span>{!compact&&<span className="ml-1 hidden sm:inline">{l.code.toUpperCase()}</span>}</button>)}</div>;

  return <div className={`inline-flex items-center gap-1.5 ${className}`}>{!compact&&<span className="text-xs text-zinc-500 hidden sm:inline">{tx('language','Idioma')}</span>}<select aria-label={tx('language','Idioma')} value={current} onChange={e=>onChange(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">{SUPPORTED_LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}</select></div>;
}