import { n } from '@/lib/format';

/** Gráfico de barras em SVG puro, com tabela equivalente para leitores de tela e rastreadores. */
export function Barras({ serie, anoParcial, descricao }: { serie: Record<string, number>; anoParcial?: number; descricao: string }) {
  const anos = Object.keys(serie).map(Number).sort((a, b) => a - b);
  if (!anos.length) return null;
  const max = Math.max(...anos.map((a) => serie[a]), 1);
  const L = 640;
  const A = 200;
  const base = 170;
  const passo = L / anos.length;
  const largura = Math.min(36, passo * 0.62);
  return (
    <div>
      <svg className="grafico" viewBox={`0 0 ${L} ${A}`} role="img" aria-label={descricao}>
        <title>{descricao}</title>
        {anos.map((ano, i) => {
          const v = serie[ano];
          const h = Math.max(2, (v / max) * 140);
          const x = i * passo + (passo - largura) / 2;
          return (
            <g key={ano}>
              <rect className={ano === anoParcial ? 'parcial' : undefined} x={x} y={base - h} width={largura} height={h} rx={3} />
              <text x={x + largura / 2} y={base - h - 5} textAnchor="middle">{n(v)}</text>
              <text x={x + largura / 2} y={base + 16} textAnchor="middle">{ano}</text>
            </g>
          );
        })}
      </svg>
      <details>
        <summary>Ver os valores em tabela</summary>
        <table>
          <caption>{descricao} A série mostra aberturas por ano e não representa o estoque ativo.</caption>
          <thead>
            <tr><th scope="col">Ano de início</th><th scope="col" className="num">Estabelecimentos abertos<small>unidades</small></th></tr>
          </thead>
          <tbody>
            {anos.map((ano) => (
              <tr key={ano}><th scope="row">{ano}{ano === anoParcial ? ' (parcial)' : ''}</th><td className="num">{n(serie[ano])}</td></tr>
            ))}
          </tbody>
          <tfoot>
            <tr><th scope="row">Total na série</th><td className="num">{n(anos.reduce((total, ano) => total + serie[ano], 0))}</td></tr>
          </tfoot>
        </table>
      </details>
    </div>
  );
}
