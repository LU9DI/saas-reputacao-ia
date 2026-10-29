const host = "filtraai.com";
const key = "a3d7f1c94b2e6a805d1f7c3b9e4a6d82";
const keyLocation = `https://${host}/${key}.txt`;
const sitemapIndexUrl = `https://${host}/sitemap-index.xml`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS_PER_REQUEST = 10_000;

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function locations(xml) {
  return [...xml.matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi)]
    .map((match) => decodeXml(match[1].trim()))
    .filter(Boolean);
}

function sameHostHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === host;
  } catch {
    return false;
  }
}

async function fetchSitemap(url) {
  const response = await fetch(url, { headers: { accept: "application/xml,text/xml,*/*" } });
  if (!response.ok) {
    throw new Error(`Sitemap fetch failed: ${url} returned HTTP ${response.status}`);
  }
  return response.text();
}

async function collectSitemapUrls(startUrl) {
  const pending = [startUrl];
  const visitedSitemaps = new Set();
  const discoveredUrls = new Set();

  while (pending.length > 0) {
    const sitemapUrl = pending.shift();
    if (!sameHostHttps(sitemapUrl) || visitedSitemaps.has(sitemapUrl)) continue;
    visitedSitemaps.add(sitemapUrl);

    const xml = await fetchSitemap(sitemapUrl);
    if (/<sitemapindex\b/i.test(xml)) {
      for (const child of locations(xml)) {
        if (sameHostHttps(child) && !visitedSitemaps.has(child)) pending.push(child);
      }
      continue;
    }

    if (!/<urlset\b/i.test(xml)) {
      throw new Error(`Unrecognized sitemap XML root at ${sitemapUrl}`);
    }

    for (const candidate of locations(xml)) {
      if (!sameHostHttps(candidate)) continue;
      const url = new URL(candidate);
      // Only submit canonical-host URLs; fragments are not sent to search engines.
      url.hash = "";
      discoveredUrls.add(url.toString());
    }
  }

  return [...discoveredUrls];
}

const urlList = await collectSitemapUrls(sitemapIndexUrl);
if (urlList.length === 0) {
  throw new Error(`No valid ${host} URLs found through ${sitemapIndexUrl}`);
}

let accepted = 0;
for (let offset = 0; offset < urlList.length; offset += MAX_URLS_PER_REQUEST) {
  const batch = urlList.slice(offset, offset + MAX_URLS_PER_REQUEST);
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key, keyLocation, urlList: batch }),
  });

  if (![200, 202].includes(response.status)) {
    const body = await response.text();
    throw new Error(
      `IndexNow rejected batch ${Math.floor(offset / MAX_URLS_PER_REQUEST) + 1} ` +
      `(${batch.length} URLs): HTTP ${response.status} ${body}`,
    );
  }

  accepted += batch.length;
  console.log(
    `IndexNow accepted batch ${Math.floor(offset / MAX_URLS_PER_REQUEST) + 1}: ` +
    `${batch.length} URLs (HTTP ${response.status})`,
  );
}

console.log(`IndexNow accepted ${accepted} unique URLs across ${Math.ceil(urlList.length / MAX_URLS_PER_REQUEST)} request(s).`);
