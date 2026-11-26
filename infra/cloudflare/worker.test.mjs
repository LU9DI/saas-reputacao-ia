import test from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.js";

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

function makeKV(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    get: async (key) => store.get(key) || null,
    put: async (key, value) => { store.set(key, value); },
    delete: async (key) => { store.delete(key); },
  };
}

function withGlobals({ fetchImpl, cache, kv }, run) {
  const previousFetch = globalThis.fetch;
  const previousCaches = globalThis.caches;
  globalThis.fetch = fetchImpl;
  globalThis.caches = { default: cache };
  const env = {
    FAILOVER_ORIGIN: kv,
    PRIMARY_ORIGIN: "https://render.example.com",
    FALLBACK_ORIGIN: "https://vercel.example.com",
    RECOVERY_PROBE_INTERVAL_MS: "300000",
  };
  const ctx = { waitUntil: () => {} };
  return Promise.resolve()
    .then(() => run(env, ctx))
    .finally(() => {
      globalThis.fetch = previousFetch;
      if (previousCaches === undefined) delete globalThis.caches;
      else globalThis.caches = previousCaches;
    });
}

const SITEMAP_XML = '<?xml version="1.0"?><urlset><url><loc>https://filtraai.com/</loc></url></urlset>';

test("durante failover, sitemap-index.xml nao recebe 503 da janela de failover", async () => {
  const kv = makeKV();
  await kv.put("active_origin", JSON.stringify({
    origin: "fallback",
    changedAt: Date.now(),
    reason: "test-failover",
    nextProbeAt: 0,
  }));
  const cache = makeCache();
  let calls = [];
  await withGlobals({
    cache,
    kv,
    fetchImpl: async (input) => {
      const u = typeof input === "string" ? input : (input?.url ?? String(input));
      calls.push(u);
      if (u.includes("vercel.example.com")) {
        return new Response(INDEX_XML, { status: 200, headers: { "content-type": "application/xml" } });
      }
      return new Response("origin error", { status: 502 });
    },
  }, async (env) => {
    const res = await worker.fetch(new Request("https://filtraai.com/sitemap-index.xml"), env);
    assert.equal(res.status, 200);
    assert.match(await res.text(), /sitemapindex/);
    assert.ok(calls.some((u) => String(u).includes("vercel.example.com")), "Vercel deve ser consultada durante failover para sitemap-index");
  });
});

test("durante failover, sitemap.xml nao recebe 503 da janela de failover", async () => {
  const kv = makeKV();
  await kv.put("active_origin", JSON.stringify({
    origin: "fallback",
    changedAt: Date.now(),
    reason: "test-failover",
    nextProbeAt: 0,
  }));
  const cache = makeCache();
  let calls = [];
  await withGlobals({
    cache,
    kv,
    fetchImpl: async (input) => {
      const u = typeof input === "string" ? input : (input?.url ?? String(input));
      calls.push(u);
      if (u.includes("vercel.example.com")) {
        return new Response(SITEMAP_XML, { status: 200, headers: { "content-type": "application/xml" } });
      }
      return new Response("origin error", { status: 502 });
    },
  }, async (env) => {
    const res = await worker.fetch(new Request("https://filtraai.com/sitemap.xml"), env);
    assert.equal(res.status, 200);
    assert.match(await res.text(), /urlset/);
    assert.ok(calls.some((u) => String(u).includes("vercel.example.com")), "Vercel deve ser consultada durante failover para sitemap");
  });
});

test("durante failover, robots.txt nao recebe 503 da janela de failover", async () => {
  const kv = makeKV();
  await kv.put("active_origin", JSON.stringify({
    origin: "fallback",
    changedAt: Date.now(),
    reason: "test-failover",
    nextProbeAt: 0,
  }));
  const cache = makeCache();
  let calls = [];
  await withGlobals({
    cache,
    kv,
    fetchImpl: async (input) => {
      const u = typeof input === "string" ? input : (input?.url ?? String(input));
      calls.push(u);
      if (u.includes("vercel.example.com")) {
        return new Response("User-agent: *\nAllow: /\nDisallow: /api/\n", { status: 200, headers: { "content-type": "text/plain" } });
      }
      return new Response("origin error", { status: 502 });
    },
  }, async (env) => {
    const res = await worker.fetch(new Request("https://filtraai.com/robots.txt"), env);
    assert.equal(res.status, 200);
    assert.match(await res.text(), /User-agent: \*/);
    assert.ok(calls.some((u) => String(u).includes("vercel.example.com")), "Vercel deve ser consultada durante failover para robots.txt");
  });
});

test("ordem de fallback: Vercel e consultada antes do host legado para sitemap", async () => {
  const kv = makeKV();
  await kv.put("active_origin", JSON.stringify({
    origin: "primary",
    changedAt: 0,
    reason: "default",
    nextProbeAt: 0,
  }));
  const cache = makeCache();
  let calls = [];
  await withGlobals({
    cache,
    kv,
    fetchImpl: async (input) => {
      const u = typeof input === "string" ? input : (input?.url ?? String(input));
      calls.push(u);
      if (u.includes("filtra-ai-frontend.filtra-ai.workers.dev")) {
        return new Response('<?xml version="1.0"?><urlset><url><loc>https://filtraai.com/stale</loc></url></urlset>', {
          status: 200,
          headers: { "content-type": "application/xml" },
        });
      }
      if (u.includes("vercel.example.com")) {
        return new Response(SITEMAP_XML, { status: 200, headers: { "content-type": "application/xml" } });
      }
      return new Response("render error", { status: 502 });
    },
  }, async (env) => {
    const res = await worker.fetch(new Request("https://filtraai.com/sitemap.xml"), env);
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /filtraai\.com\//);
    assert.ok(!body.includes("stale"), "conteudo nao deve ser do host legado aposentado");
    const vercelIdx = calls.findIndex((u) => String(u).includes("vercel.example.com"));
    const staticIdx = calls.findIndex((u) => String(u).includes("filtra-ai-frontend.filtra-ai.workers.dev"));
    assert.ok(vercelIdx >= 0, "Vercel deve ser consultada");
    assert.ok(staticIdx === -1 || vercelIdx < staticIdx, "Vercel deve ser consultada antes do host legado aposentado");
  });
});

test("quando Vercel e Render falham, sitemap recebe 503 honesto", async () => {
  const kv = makeKV();
  await kv.put("active_origin", JSON.stringify({
    origin: "primary",
    changedAt: 0,
    reason: "default",
    nextProbeAt: 0,
  }));
  const cache = makeCache();
  await withGlobals({
    cache,
    kv,
    fetchImpl: async () => new Response("origin error", { status: 502 }),
  }, async (env) => {
    const res = await worker.fetch(new Request("https://filtraai.com/sitemap.xml"), env);
    assert.equal(res.status, 503);
    assert.match(await res.text(), /temporarily unavailable/);
  });
});

test("404 na Vercel cai para o Render e serve o sitemap", async () => {
  const kv = makeKV();
  await kv.put("active_origin", JSON.stringify({
    origin: "primary",
    changedAt: 0,
    reason: "default",
    nextProbeAt: 0,
  }));
  const cache = makeCache();
  let calls = [];
  await withGlobals({
    cache,
    kv,
    fetchImpl: async (input) => {
      const u = typeof input === "string" ? input : (input?.url ?? String(input));
      calls.push(u);
      if (u.includes("vercel.example.com")) {
        return new Response("not found", { status: 404, headers: { "content-type": "text/plain" } });
      }
      if (u.includes("render.example.com")) {
        return new Response(SITEMAP_XML, { status: 200, headers: { "content-type": "application/xml" } });
      }
      return new Response("origin error", { status: 502 });
    },
  }, async (env) => {
    const res = await worker.fetch(new Request("https://filtraai.com/sitemap.xml"), env);
    assert.equal(res.status, 200);
    assert.match(await res.text(), /urlset/);
    // A Vercel foi consultada primeiro (retornou 404), depois o Render (retornou 200)
    const vercelIdx = calls.findIndex((u) => String(u).includes("vercel.example.com"));
    const renderIdx = calls.findIndex((u) => String(u).includes("render.example.com"));
    assert.ok(vercelIdx >= 0, "Vercel deve ser consultada primeiro");
    assert.ok(renderIdx > vercelIdx, "Render deve ser consultado após o 404 da Vercel");
  });
});
const INDEX_XML = '<?xml version="1.0"?><sitemapindex><sitemap><loc>https://filtraai.com/sitemap.xml</loc></sitemap></sitemapindex>';