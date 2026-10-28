import { createHash } from 'node:crypto';

const h8 = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8);

/** JSON com chaves ordenadas: o hash não pode depender da ordem de inserção. */
function estavel(v) {
  if (Array.isArray(v)) return `[${v.map(estavel).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${estavel(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}

/**
 * Calcula o lastmod por página. Uma página só ganha data nova quando o conteúdo
 * (as estatísticas que ela exibe) mudou; senão herda a data anterior.
 *
 * @param stats  { UF: { municipio: { segmento: registro } } }
 * @param previo { caminho: "hash|AAAA-MM-DD" } (lastmod.json anterior, ou {})
 * @param hoje   "AAAA-MM-DD"
 * @returns      { caminho: "hash|AAAA-MM-DD" }
 */
export function calcularLastmod(stats, previo, hoje) {
  const saida = {};
  const marcar = (caminho, hash) => {
    const ant = previo[caminho];
    const [hAnt, dAnt] = ant ? ant.split('|') : [];
    saida[caminho] = `${hash}|${hAnt === hash ? dAnt : hoje}`;
  };
  for (const uf of Object.keys(stats).sort()) {
    const ufSlug = uf.toLowerCase();
    const hashesMun = [];
    for (const mun of Object.keys(stats[uf]).sort()) {
      const hashesSeg = [];
      for (const seg of Object.keys(stats[uf][mun]).sort()) {
        const hash = h8(estavel(stats[uf][mun][seg]));
        marcar(`/${ufSlug}/${mun}/${seg}`, hash);
        hashesSeg.push(`${seg}:${hash}`);
      }
      const hMun = h8(hashesSeg.join('|'));
      marcar(`/${ufSlug}/${mun}`, hMun);
      hashesMun.push(`${mun}:${hMun}`);
    }
    marcar(`/${ufSlug}`, h8(hashesMun.join('|')));
  }
  return saida;
}

/** Extrai só a data de uma entrada "hash|AAAA-MM-DD". */
export const dataDeEntrada = (e) => (e ? e.split('|')[1] : undefined);
