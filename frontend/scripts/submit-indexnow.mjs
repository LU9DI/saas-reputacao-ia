import { readFileSync } from "node:fs";

const host = "filtraai.com";
const key = "a3d7f1c94b2e6a805d1f7c3b9e4a6d82";
const keyLocation = `https://${host}/${key}.txt`;
const sitemapIndexUrl = `https://${host}/sitemap-index.xml`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS_PER_REQUEST = 10_000;

const args = process.argv.slice(2);
const shouldSubmit = args.includes("--submit");
const allUrlsRequested = args.includes("--all");
const dryRun = args.includes("--dry-run");
const urlsFileArg = args.find((arg) => arg.startsWith("--urls-file="));
const urlsFile = urlsFileArg?.slice("--urls-file=".length);

if (shouldSubmit && !allUrlsRequested && !urlsFile) {
  throw new Error("Submission requires --urls-file=<path> for changed URLs, or --all for an explicit full-sitemap submission.");
}
if (allUrlsRequested && urlsFile) {
  throw new Error("Choose either --all or --urls-file, not both.");
}

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

function normalizeUrls(candidates) {
  const urls = new Set();
  for (const candidate of candidates) {
    if (!sameHostHttps(candidate)) continue;
    const url = new URL(candidate);
    url.hash = "";
    urls.add(url.toString());
  }
  return [...urls];
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
      url.hash = "";
      discoveredUrls.add(url.toString());
    }
  }

  return [...discoveredUrls];
}

let urlList;
if (urlsFile) {
  const fileContent = readFileSync(urlsFile, "utf8");
  urlList = normalizeUrls(fileContent.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
  if (urlList.length === 0) {
    throw new Error(`No valid https://${host} URLs found in ${urlsFile}`);
  }
} else {
  urlList = await collectSitemapUrls(sitemapIndexUrl);
  if (urlList.length === 0) {
    throw new Error(`No valid ${host} URLs found through ${sitemapIndexUrl}`);
  }
}

const batchCount = Math.ceil(urlList.length / MAX_URLS_PER_REQUEST);
if (!shouldSubmit || dryRun) {
  console.log(`IndexNow dry-run: ${urlList.length} unique canonical URLs; ${batchCount} request(s) would be needed.`);
  console.log("No submission was sent. Use --submit with --urls-file=<path>, or --submit --all for a deliberate full submission.");
  process.exit(0);
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

console.log(`IndexNow accepted ${accepted} unique URLs across ${batchCount} request(s).`);
