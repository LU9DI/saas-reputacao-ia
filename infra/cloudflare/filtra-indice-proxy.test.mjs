import test from "node:test";
import assert from "node:assert/strict";
import worker from "./filtra-indice-proxy.js";

function makeCache() {
  const entries = new Map();
  return {
    entries,
    async match(key) {
      const value = entries.get(typeof key === "string" ? key : key.url);
      return value ? value.clone() : undefined;
    },
    async put(key, value) {
      entries.set(typeof key === "string" ? key : key.url, value.clone());
    },
  };
}

function withGlobals({ fetchImpl, cache }, run) {
  const previousFetch = globalThis.fetch;
  const previousCaches = globalThis.caches;
  globalThis.fetch = fetchImpl;
  globalThis.caches = { default: cache };
  return Promise.resolve()
    .then(run)
    .finally(() => {
      globalThis.fetch = previousFetch;
      if (previousCaches === undefined) delete globalThis.caches;
      else globalThis.caches = previousCaches;
    });
}

test("retries transient sitemap 502 and caches the successful XML", async () => {
  const cache = makeCache();
  let calls = 0;

  await withGlobals({
    cache,
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) return new Response("temporary gateway error", { status: 502 });
      return new Response('<?xml version="1.0"?><sitemapindex/>', {
        status: 200,
        headers: { "content-type": "application/xml" },
      });
    },
  }, async () => {
    const first = await worker.fetch(new Request("https://filtraai.com/indice/sitemap-index.xml"));
    assert.equal(first.status, 200);
    assert.equal(first.headers.get("x-indice-cache"), "refreshed");
    assert.match(await first.text(), /sitemapindex/);
    assert.equal(calls, 2);

    const second = await worker.fetch(new Request("https://filtraai.com/indice/sitemap-index.xml"));
    assert.equal(second.status, 200);
    assert.equal(second.headers.get("x-indice-cache"), "hit");
    assert.equal(calls, 2);
  });
});

test("serves last known-good sitemap if Render keeps returning 502", async () => {
  const cache = makeCache();
  const key = "https://filtraai.com/indice/sitemap/0.xml";
  await cache.put(new Request(key), new Response("<urlset><url/></urlset>", {
    status: 200,
    headers: {
      "content-type": "application/xml",
      "cache-control": "public, max-age=3600",
      "x-indice-cached-at": String(Date.now() - 5 * 60 * 1000),
    },
  }));
  let calls = 0;

  await withGlobals({
    cache,
    fetchImpl: async () => {
      calls += 1;
      return new Response("bad gateway", { status: 502 });
    },
  }, async () => {
    const response = await worker.fetch(new Request(key));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-indice-cache"), "stale");
    assert.equal(response.headers.get("x-indice-proxy"), "render-stale-cache");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.match(await response.text(), /urlset/);
    assert.equal(calls, 5);
  });
});

test("does not cache sitemap responses with query strings or authenticated requests", async () => {
  const cache = makeCache();
  let calls = 0;
  await withGlobals({
    cache,
    fetchImpl: async () => {
      calls += 1;
      return new Response("<urlset/>", {
        status: 200,
        headers: { "content-type": "application/xml" },
      });
    },
  }, async () => {
    const response = await worker.fetch(new Request(
      "https://filtraai.com/indice/sitemap/0.xml?preview=1",
      { headers: { authorization: "Bearer test" } },
    ));
    assert.equal(response.status, 200);
    assert.equal(calls, 1);
    assert.equal(cache.entries.size, 0);
  });
});

test("caches public HTML pages for 24 hours to let the Render origin go idle", async () => {
  const cache = makeCache();
  let calls = 0;
  await withGlobals({
    cache,
    fetchImpl: async () => {
      calls += 1;
      return new Response("<!doctype html><html><body>Índice</body></html>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    },
  }, async () => {
    const url = "https://filtraai.com/indice/go/goiania";
    const first = await worker.fetch(new Request(url));
    assert.equal(first.status, 200);
    assert.equal(first.headers.get("x-indice-cache"), "refreshed");
    assert.equal(first.headers.get("cache-control"), "public, max-age=60, s-maxage=86400");
    assert.match(await first.text(), /Índice/);

    const second = await worker.fetch(new Request(url));
    assert.equal(second.status, 200);
    assert.equal(second.headers.get("x-indice-cache"), "hit");
    assert.equal(second.headers.get("x-indice-proxy"), "render-cache");
    assert.equal(calls, 1);
  });
});

test("serves a last-known-good public page when Render is unavailable", async () => {
  const cache = makeCache();
  const key = "https://filtraai.com/indice/go/goiania";
  await cache.put(new Request(key), new Response("<html>cached page</html>", {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=604800",
      "x-indice-cached-at": String(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  }));
  let calls = 0;
  await withGlobals({
    cache,
    fetchImpl: async () => {
      calls += 1;
      return new Response("bad gateway", { status: 502 });
    },
  }, async () => {
    const response = await worker.fetch(new Request(key));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-indice-cache"), "stale");
    assert.equal(response.headers.get("x-indice-proxy"), "render-stale-cache");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.match(await response.text(), /cached page/);
    assert.equal(calls, 1);
  });
});

test("does not cache public pages with query strings, cookies, or authorization", async () => {
  const cache = makeCache();
  let calls = 0;
  await withGlobals({
    cache,
    fetchImpl: async () => {
      calls += 1;
      return new Response("<html>private variation</html>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    },
  }, async () => {
    await worker.fetch(new Request("https://filtraai.com/indice/go/goiania?preview=1"));
    await worker.fetch(new Request("https://filtraai.com/indice/go/goiania", {
      headers: { cookie: "session=test" },
    }));
    await worker.fetch(new Request("https://filtraai.com/indice/go/goiania", {
      headers: { authorization: "Bearer test" },
    }));
    assert.equal(calls, 3);
    assert.equal(cache.entries.size, 0);
  });
});

test("does not cache page responses marked private or no-store", async () => {
  const cache = makeCache();
  await withGlobals({
    cache,
    fetchImpl: async () => new Response("<html>private</html>", {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "private, no-store",
      },
    }),
  }, async () => {
    await worker.fetch(new Request("https://filtraai.com/indice/go/goiania"));
    assert.equal(cache.entries.size, 0);
  });
});

test("does not cache public pages marked no-cache or Vary star", async () => {
  const cache = makeCache();
  let calls = 0;
  await withGlobals({
    cache,
    fetchImpl: async () => {
      calls += 1;
      return new Response("<html>must revalidate</html>", {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": calls === 1 ? "public, no-cache" : "public, max-age=60",
          ...(calls === 2 ? { vary: "*" } : {}),
        },
      });
    },
  }, async () => {
    await worker.fetch(new Request("https://filtraai.com/indice/go/goiania"));
    await worker.fetch(new Request("https://filtraai.com/indice/go/goiania"));
    assert.equal(calls, 2);
    assert.equal(cache.entries.size, 0);
  });
});
