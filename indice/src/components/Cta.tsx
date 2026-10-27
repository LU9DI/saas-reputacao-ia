type Props = { campanha: string; texto: string; botao?: string; destino?: string };

export function Cta({ campanha, texto, botao = 'Fazer auditoria gratuita da reputação', destino = 'https://filtraai.com/auditoria-gratuita' }: Props) {
  const href = `${destino}?utm_source=indice&utm_medium=seo&utm_campaign=${encodeURIComponent(campanha)}`;
  return (
    <aside className="cta">
      <p>{texto}</p>
      <a className="botao" href={href}>{botao}</a>
    </aside>
  );
}
