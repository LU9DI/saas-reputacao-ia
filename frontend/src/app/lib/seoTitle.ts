/**
 * Títulos de SEO das páginas.
 *
 * O template do layout raiz (`%s · Filtra.AI`) já acrescenta a marca. Títulos
 * de página que também repetem "Filtra.AI" geram marca duplicada na SERP
 * ("… · Filtra.AI · Filtra.AI"), então removemos a marca do título base aqui,
 * em um só lugar, para todos os dicionários localizados.
 */
export function serpTitle(raw: string): string {
  let out = String(raw || '').trim();

  // Sufixo "| Filtra.AI" ou "· Filtra.AI".
  out = out.replace(/\s*[|·]\s*Filtra\.AI\s*$/i, '').trim();
  // Sufixo "— Filtra.AI" (e variantes – / -).
  out = out.replace(/\s+[—–-]\s+Filtra\.AI\s*$/i, '').trim();

  // Prefixo "Filtra.AI —", "Filtra.AI " (inclui títulos em chinês).
  const lead = out.match(/^Filtra\.AI\s*[—–-]?\s*(.+)$/i);
  if (lead) {
    out = lead[1].trim();
    if (/^[a-zà-öø-ÿ]/.test(out)) out = out[0].toUpperCase() + out.slice(1);
  }

  return out.replace(/\s+/g, ' ').trim();
}
