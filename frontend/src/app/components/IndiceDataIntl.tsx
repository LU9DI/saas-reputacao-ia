import Link from 'next/link';
import snapshot from '../../generated/indice-snapshot.json';

type Locale = 'en' | 'es';
type SegmentoSlug = 'hoteis' | 'restaurantes' | 'clinicas';

const SEGMENT_NAME: Record<Locale, Record<SegmentoSlug, string>> = {
  en: {
    hoteis: 'hotels and similar accommodations',
    restaurantes: 'restaurants, bars and food service businesses',
    clinicas: 'medical and dental clinics',
  },
  es: {
    hoteis: 'hoteles y alojamientos similares',
    restaurantes: 'restaurantes, bares y negocios de comida',
    clinicas: 'clínicas médicas y odontológicas',
  },
};

const MONTHS: Record<Locale, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
};

function competenceLabel(locale: Locale) {
  const [year, month] = snapshot.competencia.split('-');
  return `${MONTHS[locale][Number(month) - 1]} ${year}`;
}

function dateLabel(locale: Locale) {
  const [year, month, day] = snapshot.geradoEm.slice(0, 10).split('-');
  return locale === 'en' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}

const fmt = (locale: Locale, value: number) =>
  new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-ES').format(value);

/**
 * EN/ES version of the Index data block (AEO/GEO).
 * Same numbers and source as the Portuguese block; no translated statistic is
 * hardcoded, everything comes from the generated snapshot.
 */
export function IndiceDataIntl({ locale, segmento }: { locale: Locale; segmento: SegmentoSlug }) {
  const dados = snapshot.segmentos[segmento];
  const nome = SEGMENT_NAME[locale][segmento];
  const competencia = competenceLabel(locale);
  const gerado = dateLabel(locale);
  const copy =
    locale === 'en'
      ? {
          title: `How many active ${nome} are there in Brazil?`,
          direct: 'Direct answer:',
          answer: `As of ${competencia}, the Filtra.AI Index counts ${fmt(locale, dados.ativos)} establishments with active CNPJ registration for ${nome} in Brazil, across ${fmt(locale, dados.municipiosComPagina)} municipalities with a published page and ${dados.estados} states. These are direct counts from the Brazilian federal open CNPJ registry, not estimates.`,
          state: 'State',
          active: 'Active establishments',
          caption: `States with the most active establishments for ${nome}, ${competencia}. Establishment counts, not unique companies.`,
          source: 'Source',
          generated: 'dataset generated on',
          methodology: 'Índice methodology',
          breakdown: 'state and municipality breakdowns',
          limits:
            'The Índice measures establishments with active registration status and does not measure reputation, rating, revenue or quality.',
        }
      : {
          title:
            segmento === 'clinicas'
              ? `¿Cuántas ${nome} con CNPJ activo hay en Brasil?`
              : `¿Cuántos ${nome} con CNPJ activo hay en Brasil?`,
          direct: 'Respuesta directa:',
          answer: `En la competencia ${competencia}, el Índice Filtra.AI contabiliza ${fmt(locale, dados.ativos)} establecimientos con CNPJ activo de ${nome} en Brasil, en ${fmt(locale, dados.municipiosComPagina)} municipios con página publicada y ${dados.estados} estados. Son conteos directos del registro abierto de CNPJ de la Receita Federal, no estimaciones.`,
          state: 'Estado',
          active: 'Establecimientos activos',
          caption: `Estados con más establecimientos activos de ${nome}, ${competencia}. Conteo de establecimientos, no de empresas únicas.`,
          source: 'Fuente',
          generated: 'base generada el',
          methodology: 'Metodología del Índice',
          breakdown: 'recortes por estado y municipio',
          limits:
            'El Índice mide establecimientos con situación registral activa y no mide reputación, nota, facturación ni calidad.',
        };

  return (
    <section
      aria-labelledby={`indice-data-${locale}`}
      className="mt-14 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
    >
      <h2 id={`indice-data-${locale}`} className="text-2xl font-bold tracking-tight">
        {copy.title}
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-300">
        <strong className="text-zinc-100">{copy.direct}</strong> {copy.answer}
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[22rem] border-collapse text-left text-sm">
          <caption className="pb-2 text-left text-xs text-zinc-500">{copy.caption}</caption>
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
              <th scope="col" className="py-2 pr-3 font-medium">{copy.state}</th>
              <th scope="col" className="py-2 text-right font-medium">{copy.active}</th>
            </tr>
          </thead>
          <tbody>
            {dados.topEstados.map((estado) => (
              <tr key={estado.uf} className="border-b border-zinc-900/80">
                <th scope="row" className="py-2 pr-3 font-normal text-zinc-300">
                  {estado.nome} ({estado.uf})
                </th>
                <td className="py-2 text-right tabular-nums text-zinc-100">
                  {fmt(locale, estado.ativos)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-zinc-500">
        {copy.source}:{' '}
        <a href={snapshot.fonte.url} rel="noopener" className="underline hover:text-zinc-300">
          {snapshot.fonte.nome}
        </a>
        . {competencia}, {copy.generated} {gerado}.{' '}
        <Link href="/indice/metodologia" className="underline hover:text-zinc-300">
          {copy.methodology}
        </Link>{' '}
        ·{' '}
        <Link href="/indice" className="underline hover:text-zinc-300">
          {copy.breakdown}
        </Link>
        . {copy.limits}
      </p>
    </section>
  );
}
