import test from "node:test";
import assert from "node:assert/strict";
import worker, { configureOriginWindow, chaveSitemapKv } from "./filtra-indice-proxy.js";

// Os testes legados assumem origem sempre acessível; a janela tem testes próprios abaixo.
configureOriginWindow({ enabled: false });

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

const XML = '<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>';
const noFetch = async () => { throw new Error("origem não deve ser chamada"); };

test("chaveSitemapKv mapeia só os caminhos de sitemap", () => {
  assert.equal(chaveSitemapKv("/indice/sitemap-index.xml"), "sitemap-index.xml");
  assert.equal(chaveSitemapKv("/indice/sitemap/3.xml"), "sitemap/3.xml");
  assert.equal(chaveSitemapKv("/indice/metodologia"), null);
  assert.equal(chaveSitemapKv("/indice/sitemap/x.xml"), null);
});

test("sitemap no KV é servido sem tocar na origem, mesmo com a janela fechada", async () => {
  configureOriginWindow({ enabled: true, now: () => new Date("2026-11-24T12:00:00Z") });
  try {
    await withGlobals({ cache: makeCache(), fetchImpl: noFetch }, async () => {
      const env = { SITEMAPS: { get: async (k) => (k === "sitemap/0.xml" ? XML : null) } };
      const res = await worker.fetch(new Request("https://filtraai.com/indice/sitemap/0.xml"), env);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get("x-indice-proxy"), "kv-static");
      assert.equal(await res.text(), XML);
      const head = await worker.fetch(new Request("https://filtraai.com/indice/sitemap/0.xml", { method: "HEAD" }), env);
      assert.equal(head.status, 200);
      assert.equal(await head.text(), "");
    });
  } finally {
    configureOriginWindow({ enabled: false });
  }
});

test("sem binding, chave ausente ou KV com erro: cai no comportamento antigo", async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return new Response(XML, { status: 200, headers: { "content-type": "application/xml" } }); };
  for (const env of [undefined, {}, { SITEMAPS: { get: async () => null } }, { SITEMAPS: { get: async () => { throw new Error("kv"); } } }, { SITEMAPS: { get: async () => "lixo" } }]) {
    await withGlobals({ cache: makeCache(), fetchImpl }, async () => {
      const res = await worker.fetch(new Request("https://filtraai.com/indice/sitemap/1.xml"), env);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get("x-indice-proxy"), "render-origin");
    });
  }
  assert.equal(calls, 5);
});

test("fora da janela: URL nunca vista recebe 503; cache conhecido é servido", async () => {
  configureOriginWindow({ enabled: true, now: () => new Date("2026-11-24T12:00:00Z") });
  try {
    const cache = makeCache();
    await withGlobals({ cache, fetchImpl: noFetch }, async () => {
      const miss = await worker.fetch(new Request("https://filtraai.com/indice/metodologia"), {});
      assert.equal(miss.status, 503);
      assert.equal(miss.headers.get("x-indice-proxy"), "frozen-miss");
    });
  } finally {
    configureOriginWindow({ enabled: false });
  }
});

test("dentro da janela (03–05 UTC) a origem é consultada", async () => {
  configureOriginWindow({ enabled: true, now: () => new Date("2026-11-24T04:00:00Z") });
  try {
    await withGlobals({ cache: makeCache(), fetchImpl: async () => new Response("<html></html>", { status: 200, headers: { "content-type": "text/html" } }) }, async () => {
      const res = await worker.fetch(new Request("https://filtraai.com/indice/metodologia"), {});
      assert.equal(res.status, 200);
      assert.equal(res.headers.get("x-indice-proxy"), "render-origin");
    });
  } finally {
    configureOriginWindow({ enabled: false });
  }
});

test("fora da janela, sitemap sem cache tenta a origem uma vez antes do 503", async () => {
  configureOriginWindow({ enabled: true, now: () => new Date("2026-11-24T12:00:00Z") });
  try {
    const cache = makeCache();
    let calls = 0;
    await withGlobals({ cache, fetchImpl: async () => {
      calls += 1;
      return new Response('<?xml version="1.0"?><urlset></urlset>', {
        status: 200,
        headers: { "content-type": "application/xml" },
      });
    } }, async () => {
      const env = {}; // sem binding SITEMAPS
      const res = await worker.fetch(new Request("https://filtraai.com/indice/sitemap/0.xml"), env);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get("x-indice-proxy"), "render-origin");
      assert.equal(calls, 1);
      // O sitemap bem-sucedido é armazenado em cache para reuso
      assert.ok(cache.entries.size >= 1);
    });
  } finally {
    configureOriginWindow({ enabled: false });
  }
});

test("fora da janela, sitemap sem cache e origem indisponível recebe 503 após uma única tentativa", async () => {
  configureOriginWindow({ enabled: true, now: () => new Date("2026-11-24T12:00:00Z") });
  try {
    const cache = makeCache();
    let calls = 0;
    await withGlobals({ cache, fetchImpl: async () => {
      calls += 1;
      return new Response("bad gateway", { status: 502 });
    } }, async () => {
      const env = {};
      const res = await worker.fetch(new Request("https://filtraai.com/indice/sitemap/0.xml"), env);
      assert.equal(res.status, 503);
      assert.equal(res.headers.get("x-indice-proxy"), "frozen-miss");
      assert.equal(res.headers.get("cache-control"), "no-store");
      assert.equal(calls, 1, "fora da janela, o sitemap deve fazer exatamente uma tentativa à origem");
    });
  } finally {
    configureOriginWindow({ enabled: false });
  }
});

test("fora da janela, HEAD de sitemap tenta a origem uma vez e não devolve corpo", async () => {
  configureOriginWindow({ enabled: true, now: () => new Date("2026-11-24T12:00:00Z") });
  try {
    const cache = makeCache();
    let calls = 0;
    await withGlobals({ cache, fetchImpl: async (input) => {
      calls += 1;
      assert.equal(input.method, "HEAD");
      return new Response(null, {
        status: 200,
        headers: { "content-type": "application/xml" },
      });
    } }, async () => {
      const env = {};
      const res = await worker.fetch(new Request("https://filtraai.com/indice/sitemap/0.xml", { method: "HEAD" }), env);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get("x-indice-proxy"), "render-origin");
      assert.equal(await res.text(), "");
      assert.equal(calls, 1);
      assert.equal(cache.entries.size, 0, "HEAD não deve gravar sitemap no cache");
    });
  } finally {
    configureOriginWindow({ enabled: false });
  }
});


test("R2 serve HTML pré-gerado sem consultar Render", async () => {
  configureOriginWindow({ enabled: true, now: () => new Date("2026-11-26T12:00:00Z") });
  try {
    let calls = 0;
    const env = { PAGES_BUCKET: { get: async (key) => {
      assert.equal(key, "go/goiania/restaurantes.html");
      return { body: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode("<html>R2</html>")); c.close(); } }), httpMetadata: { contentType: "text/html; charset=utf-8" }, httpEtag: '"r2-etag"' };
    } } };
    await withGlobals({ cache: makeCache(), fetchImpl: async () => { calls++; throw new Error("Render não deve ser chamado"); } }, async () => {
      const res = await worker.fetch(new Request("https://filtraai.com/indice/go/goiania/restaurantes"), env);
      assert.equal(res.status, 200); assert.equal(res.headers.get("x-indice-proxy"), "r2-static");
      assert.equal(res.headers.get("etag"), '"r2-etag"'); assert.match(await res.text(), /R2/); assert.equal(calls, 0);
    });
  } finally { configureOriginWindow({ enabled: false }); }
});

test("R2 serve assets Next com cache imutável e responde HEAD", async () => {
  const keys = [];
  const env = { PAGES_BUCKET: { get: async (key) => { keys.push(key); return { body: new ReadableStream({ start(c) { c.enqueue(new Uint8Array([1,2,3])); c.close(); } }), httpMetadata: { contentType: "application/javascript" } }; } };
  await withGlobals({ cache: makeCache(), fetchImpl: noFetch }, async () => {
    const res = await worker.fetch(new Request("https://filtraai.com/indice/_next/static/chunks/app.js"), env);
    assert.equal(res.status, 200); assert.equal(res.headers.get("cache-control"), "public, max-age=31536000, immutable"); assert.equal(keys[0], "_next/static/chunks/app.js");
    const head = await worker.fetch(new Request("https://filtraai.com/indice/_next/static/chunks/app.js", { method: "HEAD" }), env);
    assert.equal(head.status, 200); assert.equal(await head.text(), "");
  });
});
