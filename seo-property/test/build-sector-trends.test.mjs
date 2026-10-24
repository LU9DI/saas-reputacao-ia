import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { execFileSync } from "node:child_process";

const script = resolve(import.meta.dirname, "../scripts/build-sector-trends.mjs");

test("generates six useful sector pages and adds a valid sitemap only with a configured origin", async () => {
  const output = await mkdtemp(join(tmpdir(), "sector-trends-"));
  try {
    await writeFile(resolve(output, "sitemap.xml"), '<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>');
    execFileSync(process.execPath, [script], {
      env: { ...process.env, SEO_PROPERTY_OUTPUT_DIR: output, SEO_PROPERTY_ORIGIN: "https://dados.example.com" },
      stdio: "pipe",
    });
    const manifest = JSON.parse(await readFile(resolve(output, "sector-trends-manifest.json"), "utf8"));
    assert.equal(manifest.generatedPages.length, 7);
    assert.equal(manifest.scope, "sector_level_only");
    const landing = await readFile(resolve(output, "dados-consumidor-gov/index.html"), "utf8");
    assert.match(landing, /Dados públicos do Consumidor.gov.br por setor/);
    assert.match(landing, /href="\/dados-consumidor-gov\/telecom\//);
    assert.match(landing, /name="robots" content="index,follow"/);
    const page = await readFile(resolve(output, "dados-consumidor-gov/telecom/index.html"), "utf8");
    assert.match(page, /canonical" href="https:\/\/dados\.example\.com\/dados-consumidor-gov\/telecom\//);
    assert.match(page, /name="robots" content="index,follow"/);
    assert.match(page, /reprodução secundária pré-agregada/);
    assert.match(page, /Resolvidas entre as avaliadas/);
    assert.match(page, /não a reputação geral de empresas/);
    const sitemap = await readFile(resolve(output, "sitemap-sector-trends.xml"), "utf8");
    assert.equal((sitemap.match(/<url>/g) || []).length, 7);
    const index = await readFile(resolve(output, "sitemap.xml"), "utf8");
    assert.match(index, /sitemap-sector-trends\.xml/);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("pages remain noindex and no sitemap is emitted without a verified public origin", async () => {
  const output = await mkdtemp(join(tmpdir(), "sector-trends-no-origin-"));
  try {
    execFileSync(process.execPath, [script], {
      env: { ...process.env, SEO_PROPERTY_OUTPUT_DIR: output, SEO_PROPERTY_ORIGIN: "" },
      stdio: "pipe",
    });
    const landing = await readFile(resolve(output, "dados-consumidor-gov/index.html"), "utf8");
    assert.match(landing, /name="robots" content="noindex,nofollow"/);
    assert.doesNotMatch(landing, /rel="canonical"/);
    const page = await readFile(resolve(output, "dados-consumidor-gov/airlines/index.html"), "utf8");
    assert.match(page, /name="robots" content="noindex,nofollow"/);
    assert.doesNotMatch(page, /rel="canonical"/);
    await assert.rejects(readFile(resolve(output, "sitemap-sector-trends.xml"), "utf8"));
    const manifest = JSON.parse(await readFile(resolve(output, "sector-trends-manifest.json"), "utf8"));
    assert.equal(manifest.sitemap, null);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
