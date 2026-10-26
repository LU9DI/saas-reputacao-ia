import data from '../../config/us-states.json';

// FIPS de estado -> sigla e nome. 50 estados + DC (o arquivo de condados do CBP não inclui territórios).
export const US_STATES = data as Record<string, { abbr: string; name: string }>;
export const stateByAbbr = (abbr: string) => Object.values(US_STATES).find((s) => s.abbr === abbr.toUpperCase()) ?? null;
