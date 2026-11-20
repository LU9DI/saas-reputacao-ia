import { BASE } from './seo';
import { nUS } from './format';
import { ESTADOS_US, siglaDeSlug, slugEstado } from './us-states';
import { NACOES_UK, slugNacao } from './uk-nations';
import {
  temDadosUS, usCondado, usCondadosDoEstado, usEstadosComDados, usMeta, usMinimo, usPagina, usSegmentos, usSegsDoCondado, usTotalSeg,
} from './us';
import {
  temDadosUK, ukAutoridade, ukAutoridadesDaNacao, ukMeta, ukMinimo, ukNacoesComDados, ukPagina, ukSegmentos, ukSegsDaAutoridade, ukTotalSeg,
} from './uk';

/**
 * Textos para agentes (GEO/AEO) das edições dos EUA e do Reino Unido.
 * Mesma convenção de llms.ts: derivado dos mesmos dados do site, HTML continua canônico,
 * nenhum número inventado e nenhuma promessa de indexação ou citação.
 * Sem dados (data-us/ ou data-uk/ ausentes) tudo devolve vazio / null.
 */

type Regiao = 'us' | 'uk';
type Markdown = { htmlUrl: string; corpo: string };
const html = (c: string) => `${BASE}${c}`;
const md = (c: string) => `${BASE}/md${c}`;
const tem = (r: Regiao) => (r === 'us' ? temDadosUS() : temDadosUK());

function cab(r: Regiao, caminho: string) {
  const meta = r === 'us' ? usMeta() : ukMeta();
  return `> Canonical source: ${html(caminho)} · Language: en · Updated: ${meta.geradoEm.slice(0, 10)} · Reference year: ${meta.ano}\n`;
}

function limitesIntl(r: Regiao): string[] {
  if (r === 'us') {
    return [
      `Covers only the ${usSegmentos().length} tracked categories, defined by NAICS industry codes.`,
      `Pages exist only for county × category cells with at least ${nUS(usMinimo())} establishments with paid employees; below that the route returns 404 and is left out of the sitemap.`,
      'Counts establishments with paid employees (U.S. Census Bureau County Business Patterns). Businesses with no paid employees are not counted.',
      'Does not measure reputation, ratings, revenue, quality or market share.',
      'Employment figures, where shown, are approximate: the Census Bureau adds statistical noise to protect confidentiality. Establishment counts are not noised.',
    ];
  }
  return [
    `Covers only the ${ukSegmentos().length} tracked categories, defined by UK SIC 2007 five-digit classes.`,
    `Pages exist only for local authority × category cells with at least ${nUS(ukMinimo())} business sites; below that the route returns 404 and is left out of the sitemap.`,
    'Counts local units (sites) registered for VAT and/or PAYE (ONS UK Business Counts). Unregistered businesses are not counted.',
    'ONS rounds counts to the nearest 5, so small differences between areas are not meaningful.',
    'Does not measure reputation, ratings, revenue, quality or market share.',
  ];
}

function fonteIntl(r: Regiao) {
  const meta = r === 'us' ? usMeta() : ukMeta();
  const licenca = r === 'uk' ? '\n- Licence: Open Government Licence v3.0' : '';
  return `- Source: ${meta.fonte.nome} — ${meta.fonte.url}\n- Reference year: ${meta.ano}\n- Generated: ${meta.geradoEm.slice(0, 10)}${licenca}`;
}

function comoCitar(r: Regiao) {
  const meta = r === 'us' ? usMeta() : ukMeta();
  const nome = r === 'us' ? 'US Index' : 'UK Index';
  return `Filtra.AI ${nome}, based on ${meta.fonte.nome}, reference year ${meta.ano}. Available at ${html(`/${r}`)}.`;
}

/** Seção para o llms.txt / llms-full.txt do Índice. Vazia sem dados. */
export function secaoLlmsIntl(completa: boolean): string[] {
  const out: string[] = [];
  for (const r of ['us', 'uk'] as Regiao[]) {
    if (!tem(r)) continue;
    const meta = r === 'us' ? usMeta() : ukMeta();
    const segs = r === 'us' ? usSegmentos() : ukSegmentos();
    const nome = r === 'us' ? 'US Index (United States)' : 'UK Index (United Kingdom)';
    out.push(
      `## ${nome}`,
      r === 'us'
        ? `English-language edition with counts of establishments with paid employees by county and category, from U.S. Census Bureau County Business Patterns ${meta.ano}. ${segs.length} categories.`
        : `English-language edition with counts of business sites by local authority and category, from ONS UK Business Counts ${meta.ano}, rounded to the nearest 5. ${segs.length} categories.`,
      `- Home: ${html(`/${r}`)} · Markdown: ${md(`/${r}`)}`,
      `- Methodology: ${html(`/${r}/methodology`)} · Markdown: ${md(`/${r}/methodology`)}`,
      ...(r === 'us'
        ? usEstadosComDados().map((s) => `- ${s.nome}: ${html(`/us/${s.slug}`)} · Markdown: ${md(`/us/${s.slug}`)} (${nUS(s.condados)} counties)`)
        : ukNacoesComDados().map((s) => `- ${s.nome}: ${html(`/uk/${s.slug}`)} · Markdown: ${md(`/uk/${s.slug}`)} (${nUS(s.autoridades)} local authorities)`)),
      '',
      '### Limits',
      ...limitesIntl(r).map((l) => `- ${l}`),
      '',
    );
    if (completa) {
      out.push('### Categories', ...segs.map((s) => `- ${s.nome} (${s.slug})`), '', '### How to cite', comoCitar(r), '', '### Source', fonteIntl(r), '');
    }
  }
  return out;
}

export function markdownIntl(partes: string[]): Markdown | null {
  const r = partes[0] as Regiao;
  if ((r !== 'us' && r !== 'uk') || !tem(r)) return null;
  const nome = r === 'us' ? 'US Index' : 'UK Index';
  const meta = r === 'us' ? usMeta() : ukMeta();
  const rodape = ['## Limits', ...limitesIntl(r).map((l) => `- ${l}`), '', '## Source', fonteIntl(r), '', '## How to cite', comoCitar(r), ''];

  if (partes.length === 1) {
    const segs = r === 'us' ? usSegmentos() : ukSegmentos();
    const total = (s: string) => (r === 'us' ? usTotalSeg(s) : ukTotalSeg(s));
    return {
      htmlUrl: html(`/${r}`),
      corpo: [
        cab(r, `/${r}`), '', `# Filtra.AI ${nome}`, '',
        r === 'us'
          ? `Establishments with paid employees by US county and category, from Census Bureau County Business Patterns ${meta.ano}.`
          : `Business sites by UK local authority and category, from ONS UK Business Counts ${meta.ano}, rounded to the nearest 5.`,
        '', '## Categories (published total)', ...segs.map((s) => `- ${s.nome}: ${nUS(total(s.slug))}`), '',
        '## Browse', `- Methodology: ${html(`/${r}/methodology`)}`,
        ...(r === 'us' ? usEstadosComDados().map((s) => `- ${s.nome}: ${html(`/us/${s.slug}`)}`) : ukNacoesComDados().map((s) => `- ${s.nome}: ${html(`/uk/${s.slug}`)}`)),
        '', ...rodape,
      ].join('\n'),
    };
  }

  if (partes.length === 2 && partes[1] === 'methodology') {
    return {
      htmlUrl: html(`/${r}/methodology`),
      corpo: [
        cab(r, `/${r}/methodology`), '', `# ${nome} methodology`, '',
        r === 'us'
          ? 'Counts come from the Census Bureau County Business Patterns, aggregated by county and by groups of NAICS codes. Only establishments with paid employees are counted.'
          : 'Counts come from the ONS UK Business Counts (local units by UK SIC 2007 class), aggregated by local authority and by groups of SIC classes, rounded to the nearest 5.',
        '', '## Categories and codes',
        ...(r === 'us'
          ? usSegmentos().map((s) => `- ${s.nome}: NAICS ${s.naics.map((c) => c.replace(/\//g, '')).join(', ')}`)
          : ukSegmentos().map((s) => `- ${s.nome}: SIC ${s.sic.join(', ')}`)),
        '', ...rodape,
      ].join('\n'),
    };
  }

  if (r === 'us') {
    const sigla = siglaDeSlug(partes[1]);
    if (!sigla) return null;
    const estado = ESTADOS_US[sigla];
    if (partes.length === 2) {
      const lista = usCondadosDoEstado(sigla);
      if (!lista.length) return null;
      return { htmlUrl: html(`/us/${partes[1]}`), corpo: [cab(r, `/us/${partes[1]}`), '', `# ${estado}: establishments by county and category`, '', `${nUS(lista.length)} counties with published pages.`, '', ...lista.slice(0, 100).map(({ county, total }) => `- ${county.nome}: ${nUS(total)} — ${html(`/us/${slugEstado(sigla)}/${county.slug}`)}`), '', ...rodape].join('\n') };
    }
    const county = usCondado(sigla, partes[2]);
    if (!county) return null;
    if (partes.length === 3) {
      const segs = usSegsDoCondado(sigla, partes[2]);
      if (!segs.length) return null;
      return { htmlUrl: html(`/us/${partes[1]}/${partes[2]}`), corpo: [cab(r, `/us/${partes[1]}/${partes[2]}`), '', `# ${county.nome}, ${sigla}: establishments by category`, '', '| Category | Establishments |', '| --- | ---: |', ...segs.map(({ seg, reg }) => `| ${seg.nome} (${html(`/us/${partes[1]}/${partes[2]}/${seg.slug}`)}) | ${nUS(reg.e)} |`), '', ...rodape].join('\n') };
    }
    if (partes.length === 4) {
      const p = usPagina(sigla, partes[2], partes[3]);
      if (!p) return null;
      return { htmlUrl: html(`/us/${partes[1]}/${partes[2]}/${partes[3]}`), corpo: [cab(r, `/us/${partes[1]}/${partes[2]}/${partes[3]}`), '', `# ${p.seg.nome} in ${county.nome}, ${sigla}: ${nUS(p.reg.e)} establishments`, '', `${county.nome}, ${estado} had ${nUS(p.reg.e)} ${p.seg.curto} with paid employees in ${meta.ano} (Census Bureau County Business Patterns).`, '', `- Rank in the US: ${p.rankUS} of ${nUS(p.condadosUS)} counties`, `- Rank in ${estado}: ${p.rankUF} of ${nUS(p.condadosUF)} counties`, `- Employees per establishment (under 5 / 5-9 / 10-19 / 20-49 / 50-99 / 100+): ${p.reg.sz.join(' / ')}`, '', ...rodape].join('\n') };
    }
    return null;
  }

  const nacao = slugNacao(partes[1]);
  if (!nacao) return null;
  const nomeNacao = NACOES_UK[nacao];
  if (partes.length === 2) {
    const lista = ukAutoridadesDaNacao(nacao);
    if (!lista.length) return null;
    return { htmlUrl: html(`/uk/${nacao}`), corpo: [cab(r, `/uk/${nacao}`), '', `# ${nomeNacao}: business sites by local authority and category`, '', `${nUS(lista.length)} local authorities with published pages.`, '', ...lista.slice(0, 100).map(({ auth, total }) => `- ${auth.nome}: about ${nUS(total)} — ${html(`/uk/${nacao}/${auth.slug}`)}`), '', ...rodape].join('\n') };
  }
  const auth = ukAutoridade(nacao, partes[2]);
  if (!auth) return null;
  if (partes.length === 3) {
    const segs = ukSegsDaAutoridade(nacao, partes[2]);
    if (!segs.length) return null;
    return { htmlUrl: html(`/uk/${nacao}/${partes[2]}`), corpo: [cab(r, `/uk/${nacao}/${partes[2]}`), '', `# ${auth.nome}: business sites by category`, '', '| Category | Business sites (rounded to 5) |', '| --- | ---: |', ...segs.map(({ seg, reg }) => `| ${seg.nome} (${html(`/uk/${nacao}/${partes[2]}/${seg.slug}`)}) | ${nUS(reg.e)} |`), '', ...rodape].join('\n') };
  }
  if (partes.length === 4) {
    const p = ukPagina(nacao, partes[2], partes[3]);
    if (!p) return null;
    return { htmlUrl: html(`/uk/${nacao}/${partes[2]}/${partes[3]}`), corpo: [cab(r, `/uk/${nacao}/${partes[2]}/${partes[3]}`), '', `# ${p.seg.nome} in ${auth.nome}: about ${nUS(p.reg.e)} business sites`, '', `${auth.nome}, ${nomeNacao} had about ${nUS(p.reg.e)} ${p.seg.curto} in ${meta.ano} (ONS UK Business Counts, rounded to the nearest 5).`, '', `- Rank in the UK: ${p.rankUK} of ${nUS(p.autoridadesUK)} local authorities`, `- Rank in ${nomeNacao}: ${p.rankNacao} of ${nUS(p.autoridadesNacao)} local authorities`, `- Sites by employees (0-4 / 5-9 / 10-19 / 20-49 / 50-99 / 100+): ${p.reg.sz.join(' / ')}`, '', ...rodape].join('\n') };
  }
  return null;
}
