import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(process.env.SEO_PROPERTY_OUTPUT_DIR || resolve(root, "dist"));
const data = JSON.parse(await readFile(resolve(root, "data/consumidor-gov-sector-trends.json"), "utf8"));
const originInput = (process.env.SEO_PROPERTY_ORIGIN || "").trim();
let origin = "";
if (originInput) {
  let parsed;
  try { parsed = new URL(originInput); } catch { throw new Error("SEO_PROPERTY_ORIGIN must be a valid HTTPS origin"); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("SEO_PROPERTY_ORIGIN must be an HTTPS origin without credentials, path, query or fragment");
  }
  origin = parsed.origin;
}
if (data.scope !== "sector_level_only" || !Array.isArray(data.windows) || data.windows.length < 1) {
  throw new Error("Sector trends data contract is not eligible for publication");
}
const esc = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const labels = {
  all: "Todos os setores",
  banks: "Bancos",
  telecom: "Telecomunicações",
  energy: "Energia",
  health_plans: "Planos de saúde",
  airlines: "Companhias aéreas",
};
const pathFor = sector => `/dados-consumidor-gov/${sector}/`;
const windows = data.windows;
const latest = windows.find(window => window.window === "recent");
if (!latest) throw new Error("A janela recente é required");
const latestSectors = latest.sectors;
if (latestSectors.length !== 6 || new Set(latestSectors.map(row => row.sector)).size !== 6) {
  throw new Error("Latest window must contain six unique sectors");
}
const pages = [];
for (const current of latestSectors) {
  const label = labels[current.sector];
  if (!label) throw new Error(`Unmapped sector: ${current.sector}`);
  const path = pathFor(current.sector);
  const title = `Indicadores do Consumidor.gov.br: ${label} (${latest.startMonth} a ${latest.endMonth})`;
  const historicalRows = windows.map(window => {
    const row = window.sectors.find(item => item.sector === current.sector);
    if (!row) throw new Error(`Missing ${current.sector} in ${window.window}`);
    return { window, row };
  });
  const history = historicalRows.map(({window,row}) => `<tr><th scope="row">${esc(window.startMonth)} a ${esc(window.endMonth)}</th><td>${row.finalized.toLocaleString("pt-BR")}</td><td>${row.resolvedOverFinalizedPct.toLocaleString("pt-BR",{maximumFractionDigits:1})}%</td><td>${row.resolvedOverEvaluatedPct.toLocaleString("pt-BR",{maximumFractionDigits:1})}%</td><td>${row.officialSolutionIndexPct.toLocaleString("pt-BR",{maximumFractionDigits:1})}%</td></tr>`).join("");
  const description = `Dados agregados de reclamações finalizadas no Consumidor.gov.br para ${label.toLowerCase()}, de ${latest.startMonth} a ${latest.endMonth}, com denominadores e metodologia.`;
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
${origin ? `<link rel="canonical" href="${esc(origin+path)}"><meta name="robots" content="index,follow">` : '<meta name="robots" content="noindex,nofollow">'}</head>
<body><header><a href="/">Índice público de dados</a></header><main>
<h1>${esc(title)}</h1>
<p>Esta página descreve resultados agregados da plataforma Consumidor.gov.br, não a reputação geral de empresas nem a experiência de todos os consumidores brasileiros.</p>
<h2>Janela mais recente publicada</h2>
<p><strong>Período:</strong> ${esc(latest.startMonth)} a ${esc(latest.endMonth)}. <strong>Reclamações finalizadas:</strong> ${current.finalized.toLocaleString("pt-BR")}.</p>
<dl><dt>Resolvidas sobre todas as finalizadas</dt><dd>${current.resolvedOverFinalizedPct.toLocaleString("pt-BR",{maximumFractionDigits:1})}%</dd>
<dt>Resolvidas entre as avaliadas</dt><dd>${current.resolvedOverEvaluatedPct.toLocaleString("pt-BR",{maximumFractionDigits:1})}%</dd>
<dt>Índice oficial de solução</dt><dd>${current.officialSolutionIndexPct.toLocaleString("pt-BR",{maximumFractionDigits:1})}%</dd></dl>
<p>Contagens da janela: ${current.resolved.toLocaleString("pt-BR")} resolvidas, ${current.notResolved.toLocaleString("pt-BR")} não resolvidas e ${current.notEvaluated.toLocaleString("pt-BR")} não avaliadas. As três categorias somam ${current.finalized.toLocaleString("pt-BR")} reclamações finalizadas.</p>
<h2>Histórico publicado</h2><table><thead><tr><th>Período informado</th><th>Finalizadas</th><th>Resolvidas / finalizadas</th><th>Resolvidas / avaliadas</th><th>Índice oficial de solução</th></tr></thead><tbody>${history}</tbody></table>
<p>Os períodos têm comprimentos e contextos de publicação diferentes. Não trate a tabela como uma série perfeitamente comparável nem atribua diferenças automaticamente a mudanças no desempenho.</p>
<h2>Como interpretar</h2>
<ul><li><strong>Resolvidas / finalizadas:</strong> resolvidas divididas por todas as finalizadas.</li><li><strong>Resolvidas / avaliadas:</strong> resolvidas divididas pela soma de resolvidas e não resolvidas; exclui não avaliadas.</li><li><strong>Índice oficial de solução:</strong> soma de resolvidas e não avaliadas dividida por todas as finalizadas, conforme a metodologia oficial.</li></ul>
<p>A participação no Consumidor.gov.br é voluntária. Os indicadores descrevem reclamações finalizadas na plataforma e não abrangem todas as empresas ou todas as experiências de consumo.</p>
<h2>Fontes e atribuição</h2><p>Fonte dos agregados: ${esc(data.secondarySource.publisher)}, “${esc(data.secondarySource.title)}”, licença ${esc(data.secondarySource.license)}. Esta é uma reprodução secundária pré-agregada, não uma ingestão direta dos CSVs oficiais por este projeto.</p>
<p><a href="${esc(data.secondarySource.url)}" rel="noopener">Consultar dataset secundário e seus dados</a> · <a href="${esc(data.secondarySource.versionDoi)}" rel="noopener">Versão arquivada</a> · <a href="${esc(data.primarySource.url)}" rel="noopener">Dados abertos oficiais</a> · <a href="https://www.consumidor.gov.br/pages/conteudo/publico/1" rel="noopener">Metodologia oficial</a></p>
<p>Dados da janela recente: ${esc(latest.startMonth)} a ${esc(latest.endMonth)}. A atualização da fonte secundária deve ser verificada antes de usar estes números como atuais.</p>
</main></body></html>`;
  const file = resolve(output, `.${path}index.html`);
  await mkdir(dirname(file), {recursive:true});
  await writeFile(file, html);
  pages.push({path,title});
}
const landingTitle = "Dados públicos do Consumidor.gov.br por setor";
const landingDescription = "Indicadores agregados por setor do Consumidor.gov.br, com períodos, denominadores, fontes e metodologia explícitos.";
const landingCards = pages.map(page => `<li><a href="${esc(page.path)}">${esc(labels[page.path.split("/")[2]])}</a> — indicadores agregados, histórico e metodologia</li>`).join("\n");
const landingHtml = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(landingTitle)}</title><meta name="description" content="${esc(landingDescription)}">
${origin ? `<link rel="canonical" href="${esc(origin+"/dados-consumidor-gov/")}"><meta name="robots" content="index,follow">` : '<meta name="robots" content="noindex,nofollow">'}</head>
<body><main><h1>${esc(landingTitle)}</h1>
<p>Explore dados agregados de reclamações finalizadas na plataforma Consumidor.gov.br. Estes indicadores descrevem o tratamento de reclamações na plataforma; não são notas gerais de reputação, não cobrem todas as empresas e não representam todas as experiências de consumo.</p>
<h2>Indicadores por setor</h2><ul>${landingCards}</ul>
<h2>Como usar os números</h2><p>Cada página apresenta o período de referência, o volume de reclamações finalizadas, os denominadores das taxas e o índice oficial de solução. As janelas históricas podem ter comprimentos e contextos diferentes; compare com cautela.</p>
<h2>Fontes, licença e limitações</h2><p>Os valores exibidos são uma reprodução secundária pré-agregada, não uma ingestão direta dos CSVs oficiais por este projeto. A participação no Consumidor.gov.br é voluntária. Consulte a fonte e a metodologia oficial antes de reutilizar os números.</p>
<p><a href="${esc(data.secondarySource.url)}" rel="noopener">Dataset secundário e licença</a> · <a href="${esc(data.secondarySource.versionDoi)}" rel="noopener">Versão arquivada</a> · <a href="${esc(data.primarySource.url)}" rel="noopener">Portal oficial de dados abertos</a> · <a href="https://www.consumidor.gov.br/pages/indicador/geral/abrir" rel="noopener">Metodologia oficial dos indicadores</a></p>
</main></body></html>`;
const landingFile = resolve(output, "./dados-consumidor-gov/index.html");
await mkdir(dirname(landingFile), {recursive:true});
await writeFile(landingFile, landingHtml);
pages.unshift({path:"/dados-consumidor-gov/",title:landingTitle});

const entries = pages.map(page => `<url><loc>${esc(origin+page.path)}</loc></url>`).join("\n");
if (origin) {
  await writeFile(resolve(output,"sitemap-sector-trends.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`);
}
const indexPath = resolve(output,"sitemap.xml");
let index = "";
try { index = await (await import("node:fs/promises")).readFile(indexPath,"utf8"); } catch {}
if (origin && index && !index.includes("sitemap-sector-trends.xml")) {
  index = index.replace("</sitemapindex>", `<sitemap><loc>${esc(origin+"/sitemap-sector-trends.xml")}</loc></sitemap>\n</sitemapindex>`);
  await writeFile(indexPath,index);
}
await writeFile(resolve(output,"sector-trends-manifest.json"), JSON.stringify({sourceStatus:data.status,scope:data.scope,generatedPages:pages.map(page=>({...page,canonical:origin ? origin+page.path : null})),sitemap:origin ? "sitemap-sector-trends.xml" : null},null,2)+"\n");
console.log(`Generated ${pages.length} sector-level Consumidor.gov.br pages.`);
