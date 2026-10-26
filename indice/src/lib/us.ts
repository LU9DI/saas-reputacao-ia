import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { US_STATES, stateByAbbr } from './us-states';

export type UsSegment = { slug: string; name: string; short: string; naics: string[] };
export type UsMeta = {
  year: number;
  generatedAt: string;
  source: { name: string; url: string; license: string };
  minimumToIndex: number;
  segments: UsSegment[];
  sizeBins: string[];
  linesRead?: number;
  linesInScope?: number;
  synthetic?: boolean;
};
export type UsCounty = { state: string; slug: string; name: string; fips: string };
export type UsRecord = { e: number; f: Record<string, number> };
type StateStats = Record<string, Record<string, UsRecord>>;

type Loja = {
  meta: UsMeta;
  counties: UsCounty[];
  byKey: Map<string, UsCounty>;
  stats: Record<string, StateStats>;
  segments: Map<string, UsSegment>;
  ranks: Map<string, { sorted: { st: string; c: string; e: number }[]; rankUS: Map<string, number>; rankState: Map<string, number>; totalState: Map<string, number> }>;
};
let cache: Loja | null = null;

const dir = () => path.resolve(/*turbopackIgnore: true*/ process.env.INDICE_US_DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), 'data-us'));
const ler = <T,>(...p: string[]): T => JSON.parse(readFileSync(path.join(dir(), ...p), 'utf8')) as T;

export const usDataExists = () => existsSync(path.join(dir(), 'meta.json'));

function carregar(): Loja {
  if (cache) return cache;
  const meta = ler<UsMeta>('meta.json');
  const counties = ler<UsCounty[]>('counties.json');
  const stats: Record<string, StateStats> = {};
  for (const { abbr } of Object.values(US_STATES)) {
    const f = path.join(dir(), 'stats', `${abbr}.json`);
    if (existsSync(f)) stats[abbr] = JSON.parse(readFileSync(f, 'utf8')) as StateStats;
  }
  const byKey = new Map(counties.map((c) => [`${c.state}/${c.slug}`, c]));
  const segments = new Map(meta.segments.map((s) => [s.slug, s]));
  const ranks: Loja['ranks'] = new Map();
  for (const s of meta.segments) {
    const sorted: { st: string; c: string; e: number }[] = [];
    for (const [st, porC] of Object.entries(stats)) for (const [c, porS] of Object.entries(porC)) {
      const r = porS[s.slug];
      if (r && r.e >= meta.minimumToIndex) sorted.push({ st, c, e: r.e });
    }
    sorted.sort((a, b) => b.e - a.e || `${a.st}/${a.c}`.localeCompare(`${b.st}/${b.c}`));
    const rankUS = new Map<string, number>();
    const rankState = new Map<string, number>();
    const totalState = new Map<string, number>();
    const seen = new Map<string, number>();
    sorted.forEach((x, i) => {
      rankUS.set(`${x.st}/${x.c}`, i + 1);
      const n = (seen.get(x.st) || 0) + 1;
      seen.set(x.st, n);
      rankState.set(`${x.st}/${x.c}`, n);
      totalState.set(x.st, n);
    });
    ranks.set(s.slug, { sorted, rankUS, rankState, totalState });
  }
  cache = { meta, counties, byKey, stats, segments, ranks };
  return cache;
}

export const usMeta = () => carregar().meta;
export const usSegments = () => carregar().meta.segments;
export const usCounty = (st: string, slug: string) => carregar().byKey.get(`${st}/${slug}`) ?? null;
export const usMin = () => carregar().meta.minimumToIndex;
export const stateSlug = (abbr: string) => abbr.toLowerCase();
export const stateFromSlug = (slug: string) => { const s = stateByAbbr(slug); return s && s.abbr.toLowerCase() === slug ? s : null; };

export function usSegmentsOfCounty(st: string, slug: string): { seg: UsSegment; reg: UsRecord }[] {
  const L = carregar();
  const porS = L.stats[st]?.[slug];
  if (!porS) return [];
  return L.meta.segments.flatMap((seg) => (porS[seg.slug] && porS[seg.slug].e >= L.meta.minimumToIndex ? [{ seg, reg: porS[seg.slug] }] : [])).sort((a, b) => b.reg.e - a.reg.e);
}

export function usCountiesOfState(st: string): { county: UsCounty; total: number; segments: number }[] {
  const L = carregar();
  const porC = L.stats[st] || {};
  return Object.keys(porC).flatMap((slug) => {
    const segs = usSegmentsOfCounty(st, slug);
    const county = L.byKey.get(`${st}/${slug}`);
    return county && segs.length ? [{ county, total: segs.reduce((t, x) => t + x.reg.e, 0), segments: segs.length }] : [];
  }).sort((a, b) => b.total - a.total);
}

export function usTopCounties(seg: string, limit: number, st?: string): { county: UsCounty; e: number }[] {
  const L = carregar();
  const r = L.ranks.get(seg);
  if (!r) return [];
  return r.sorted.filter((x) => !st || x.st === st).slice(0, limit).flatMap((x) => { const county = L.byKey.get(`${x.st}/${x.c}`); return county ? [{ county, e: x.e }] : []; });
}
export const usSegmentTotal = (seg: string, st?: string) => carregar().ranks.get(seg)?.sorted.filter((x) => !st || x.st === st).reduce((t, x) => t + x.e, 0) ?? 0;

export function usStatesWithData(): { abbr: string; name: string; counties: number }[] {
  const L = carregar();
  return Object.values(US_STATES).flatMap((s) => (L.stats[s.abbr] ? [{ abbr: s.abbr, name: s.name, counties: usCountiesOfState(s.abbr).length }] : [])).filter((s) => s.counties > 0).sort((a, b) => a.name.localeCompare(b.name));
}

export type UsPage = { county: UsCounty; seg: UsSegment; reg: UsRecord; rankState: number; totalState: number; rankUS: number; totalUS: number };
export function usPage(st: string, slug: string, segSlug: string): UsPage | null {
  const L = carregar();
  const county = L.byKey.get(`${st}/${slug}`);
  const seg = L.segments.get(segSlug);
  const reg = L.stats[st]?.[slug]?.[segSlug];
  const r = L.ranks.get(segSlug);
  if (!county || !seg || !reg || !r || reg.e < L.meta.minimumToIndex) return null;
  const k = `${st}/${slug}`;
  return { county, seg, reg, rankState: r.rankState.get(k) ?? 0, totalState: r.totalState.get(st) ?? 0, rankUS: r.rankUS.get(k) ?? 0, totalUS: r.sorted.length };
}

export function usAllPaths(): string[] {
  const L = carregar();
  const out = ['/en', '/en/methodology'];
  for (const s of usStatesWithData()) {
    out.push(`/en/${stateSlug(s.abbr)}`);
    for (const { county } of usCountiesOfState(s.abbr)) {
      out.push(`/en/${stateSlug(s.abbr)}/${county.slug}`);
      for (const { seg } of usSegmentsOfCounty(s.abbr, county.slug)) out.push(`/en/${stateSlug(s.abbr)}/${county.slug}/${seg.slug}`);
    }
  }
  void L;
  return out;
}
