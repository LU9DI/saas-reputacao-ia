export function Cta({ campanha, texto }: { campanha: string; texto: string }) {
  const href = `https://filtraai.com/auditoria-gratuita?utm_source=indice&utm_medium=seo&utm_campaign=${encodeURIComponent(campanha)}`;
  return (
    <aside className="cta">
      <p>{texto}</p>
      <a className="botao" href={href}>Fazer auditoria gratuita da reputação</a>
    </aside>
  );
}
