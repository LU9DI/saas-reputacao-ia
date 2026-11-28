export const CATALOG_URL = 'https://dados.mj.gov.br/api/3/action/package_show?id=reclamacoes-do-consumidor-gov-br';
const PACKAGE_ID = '0182f1bf-e73d-42b1-ae8c-fa94d9ce9451';
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

export function isOfficialMonthlyCsvUrl(rawUrl, month) {
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month || '')) return false;
  let url;
  try { url = new URL(rawUrl); } catch { return false; }
  return url.protocol === 'https:' && url.hostname === 'dados.mj.gov.br' &&
    !url.username && !url.password && !url.search && !url.hash &&
    new RegExp('^/dataset/' + PACKAGE_ID + '/resource/' + UUID + '/download/basecompleta' + month + '\\.csv$').test(url.pathname);
}

export function extractOfficialMonthlyResources(payload) {
  if (payload?.success !== true || payload?.result?.name !== 'reclamacoes-do-consumidor-gov-br' ||
      !Array.isArray(payload?.result?.resources)) {
    throw new Error('Official catalog response failed validation');
  }
  const resources = [];
  for (const item of payload.result.resources) {
    const name = typeof item?.name === 'string' ? item.name : '';
    const url = typeof item?.url === 'string' ? item.url : '';
    const match = name.match(/^basecompleta(20\d{2}-(?:0[1-9]|1[0-2]))\.csv$/);
    if (!match || !isOfficialMonthlyCsvUrl(url, match[1])) continue;
    resources.push({
      referenceMonth: match[1],
      name,
      url,
      format: typeof item.format === 'string' ? item.format : null,
      size: Number.isFinite(Number(item.size)) && item.size !== null && item.size !== '' ? Number(item.size) : null,
      lastModified: typeof item.last_modified === 'string' ? item.last_modified : null,
      created: typeof item.created === 'string' ? item.created : null
    });
  }
  return resources.sort((a, b) => a.referenceMonth.localeCompare(b.referenceMonth));
}
