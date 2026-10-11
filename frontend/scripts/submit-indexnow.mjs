const host = "filtraai.com";
const key = "a3d7f1c94b2e6a805d1f7c3b9e4a6d82";
const keyLocation = `https://${host}/${key}.txt`;
const sitemapUrl = `https://${host}/sitemap.xml`;

const sitemapResponse = await fetch(sitemapUrl);
if (!sitemapResponse.ok) {
  throw new Error(`Sitemap fetch failed: HTTP ${sitemapResponse.status}`);
}
const xml = await sitemapResponse.text();
const urlList = [...xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi)]
  .map((match) => match[1].replaceAll("&amp;", "&"))
  .filter((url) => {
    try {
      return new URL(url).hostname === host;
    } catch {
      return false;
    }
  });

if (urlList.length === 0) {
  throw new Error("No valid filtraai.com URLs found in sitemap");
}
if (urlList.length > 10000) {
  throw new Error(`Too many URLs for one IndexNow request: ${urlList.length}`);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation, urlList }),
});
if (![200, 202].includes(response.status)) {
  const body = await response.text();
  throw new Error(`IndexNow rejected submission: HTTP ${response.status} ${body}`);
}
console.log(`IndexNow accepted ${urlList.length} URLs (HTTP ${response.status})`);
