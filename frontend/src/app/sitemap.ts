import type { MetadataRoute } from 'next';

const base='https://filtraai.com';
const localized={
 en:['ia','feedback-de-clientes','analise-de-avaliacoes-com-ia','gestao-de-reputacao-online','avaliacoes-google','hoteis','restaurantes','clinicas','agencias','franquias','turismo','associacoes','parceiros','como-funciona','pedir-estrela-vs-filtrar','auditoria-gratuita'],
 es:['ia','feedback-de-clientes','analise-de-avaliacoes-com-ia','gestao-de-reputacao-online','avaliacoes-google','hoteis','restaurantes','clinicas','agencias','franquias','turismo','associacoes','parceiros','como-funciona','pedir-estrela-vs-filtrar','auditoria-gratuita'],
 zh:['ia','feedback-de-clientes','analise-de-avaliacoes-com-ia','gestao-de-reputacao-online','avaliacoes-google','hoteis','restaurantes','clinicas','agencias','franquias','turismo','associacoes','parceiros','como-funciona','pedir-estrela-vs-filtrar','auditoria-gratuita'],
};
const paths=['','/feedback-de-clientes','/analise-de-avaliacoes-com-ia','/gestao-de-reputacao-online','/avaliacoes-google','/como-funciona','/auditoria-gratuita','/hoteis','/parceiros','/associacoes','/turismo','/franquias','/restaurantes','/clinicas','/agencias','/pedir-estrela-vs-filtrar','/blog','/blog/gestao-reputacao-online-guia','/blog/como-responder-avaliacoes-negativas','/blog/como-conseguir-avaliacoes-google','/blog/velocity-reviews-google-maps-2026','/blog/review-1-estrela-primeiras-24-horas','/blog/qr-code-balcao-reviews','/blog/seo-local-avaliacoes-local-pack','/blog/clinica-checklist-avaliacoes-google','/blog/agencia-vender-gestao-reputacao','/blog/whatsapp-pedir-estrela-vs-filtrar-qr','/ia','/termos','/privacidade'];
const baseEntries=paths.map(path=>({url:base+path,changeFrequency:path===''||path.startsWith('/blog')?'weekly':'monthly',priority:path===''?1:['/feedback-de-clientes','/analise-de-avaliacoes-com-ia','/gestao-de-reputacao-online','/auditoria-gratuita','/ia'].includes(path)?0.95:path.startsWith('/blog')?0.8:0.7}));
const localizedEntries=(Object.entries(localized) as [keyof typeof localized,string[]][]).flatMap(([lang,slugs])=>slugs.map(slug=>({url:base+'/'+lang+'/'+slug,changeFrequency:'monthly' as const,priority:0.9})));
return [...baseEntries,...localizedEntries];
