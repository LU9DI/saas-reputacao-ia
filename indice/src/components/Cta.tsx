type Props = { campanha: string; texto: string; botao?: string; destino?: string; compacto?: boolean };

export function Cta({ campanha, texto, botao = 'Fazer auditoria gratuita da reputação', destino = 'https://filtraai.com/auditoria-gratuita', compacto = false }: Props) {
  const href = `${destino}?utm_source=indice&utm_medium=seo&utm_campaign=${encodeURIComponent(campanha)}`;
  return (
    <aside className={compacto ? 'cta cta-topo' : 'cta'}>
      <p>{texto}</p>
      <a className="botao" href={href}>{botao}</a>
    </aside>
  );
}
