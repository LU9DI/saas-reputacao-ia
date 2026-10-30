export function Cta({ campanha, texto, compacto = false }: { campanha: string; texto: string; compacto?: boolean }) {
  const href = `https://filtraai.com/auditoria-gratuita?utm_source=indice&utm_medium=seo&utm_campaign=${encodeURIComponent(campanha)}`;
  return (
    <aside className={compacto ? 'cta cta-topo' : 'cta'}>
      <p>{texto}</p>
      <a className="botao" href={href}>Fazer auditoria gratuita da reputação</a>
    </aside>
  );
}
