/**
 * Google Apps Script helper — export Search Console query × page rows.
 *
 * SETUP:
 * 1. Open https://script.google.com/ and create a standalone project.
 * 2. In Services (+), add the advanced "Google Search Console API" service.
 * 3. Paste this file into Code.gs and run exportQueryPageCsv().
 * 4. Authorize access to Search Console and Google Drive when prompted.
 *
 * This reads data only. It does not change the site, publish pages, or submit URLs.
 * Search Console may omit anonymized queries and the API may return only a subset
 * of rows. A completed export is not proof that all query/page pairs were returned.
 */
const GSC_SITE_URL = 'https://filtraai.com/';
const GSC_START_DATE = '2026-07-01';
const GSC_END_DATE = '2026-09-30';
const GSC_ROW_LIMIT = 25000;

function exportQueryPageCsv() {
  const siteUrl = GSC_SITE_URL;
  const startDate = GSC_START_DATE;
  const endDate = GSC_END_DATE;
  validateIsoDate_(startDate);
  validateIsoDate_(endDate);
  if (startDate > endDate) throw new Error('GSC_START_DATE must be <= GSC_END_DATE.');

  const windows = monthWindows_(startDate, endDate);
  const outputRows = [['Query', 'Page', 'Clicks', 'Impressions', 'CTR', 'Position']];
  let apiRows = 0;
  const perWindow = [];

  windows.forEach(function(window) {
    let startRow = 0;
    let windowCount = 0;
    while (true) {
      const request = {
        startDate: window.startDate,
        endDate: window.endDate,
        dimensions: ['query', 'page'],
        rowLimit: GSC_ROW_LIMIT,
        startRow: startRow,
        type: 'web'
      };
      const response = SearchConsole.Searchanalytics.query(siteUrl, request);
      const rows = response.rows || [];
      rows.forEach(function(row) {
        const keys = row.keys || [];
        if (keys.length < 2) return;
        outputRows.push([
          keys[0], keys[1], row.clicks || 0, row.impressions || 0,
          row.ctr == null ? '' : row.ctr, row.position == null ? '' : row.position
        ]);
      });
      windowCount += rows.length;
      apiRows += rows.length;
      if (rows.length < GSC_ROW_LIMIT) break;
      startRow += rows.length;
    }
    perWindow.push(window.startDate + ' to ' + window.endDate + ': ' + windowCount + ' rows');
  });

  const csv = outputRows.map(function(row) {
    return row.map(csvCell_).join(',');
  }).join('\r\n');
  const fileName = 'filtraai-query-page-' + startDate + '-to-' + endDate + '.csv';
  const file = DriveApp.createFile(fileName, '\uFEFF' + csv, MimeType.CSV);
  Logger.log('Rows exported: ' + apiRows);
  Logger.log('Windows: ' + perWindow.join(' | '));
  Logger.log('CSV URL: ' + file.getUrl());
  Logger.log('IMPORTANT: Search Console can omit anonymized queries; API row limits mean this may not be exhaustive.');
}

function monthWindows_(startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  const windows = [];
  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  while (cursor <= end) {
    const monthStart = new Date(cursor);
    const monthEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0));
    const windowStart = monthStart < start ? start : monthStart;
    const windowEnd = monthEnd > end ? end : monthEnd;
    windows.push({ startDate: isoDate_(windowStart), endDate: isoDate_(windowEnd) });
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }
  return windows;
}

function isoDate_(date) {
  return date.toISOString().slice(0, 10);
}

function validateIsoDate_(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || isNaN(Date.parse(value)) ||
      isoDate_(new Date(value + 'T00:00:00Z')) !== value) {
    throw new Error('Invalid ISO date: ' + value);
  }
}

function csvCell_(value) {
  return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"';
}
