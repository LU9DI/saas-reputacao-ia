// Contrato de breadcrumbs e navegação entre hubs do Índice (rodada P1).
//
// Por que existe: até a rodada P1 cada página montava o próprio BreadcrumbList
// em JSON-LD, separado do breadcrumb visível. Isso permitia divergência entre o
// que a pessoa vê e o que o Google lê (inclusive item final sem a URL canônica).
// Agora `Migalhas` é a única fonte: toda rota do app precisa passar `indice` e
// `caminhoAtual`, e a página final da trilha usa exatamente o caminho canônico.

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const app = path.join(raiz, 'src/app');
const ler = (relativo) => readFileSync(path.join(raiz, relativo), 'utf8');
const lerApp = (relativo) => readFileSync(path.join(app, relativo), 'utf8');

function listarPaginas(diretorio = app) {
  const paginas = [];
  for (const entrada of readdirSync(diretorio, { withFileTypes: true })) {
    const completo = path.join(diretorio, entrada.name);
    if (entrada.isDirectory()) paginas.push(...listarPaginas(completo));
    else if (entrada.isFile() && entrada.name === 'page.tsx') paginas.push(path.relative(app, completo).split(path.sep).join('/'));
  }
  return paginas;
}

/** Bloco JSX de cada <Migalhas .../> no arquivo; vazio quando a página usa RankingPagina. */
function blocosMigalhas(fonte) {
  return [...fonte.matchAll(/<Migalhas[\s\S]*?\/>/g)].map((m) => m[0]);
}

const PAGINAS = listarPaginas();

test('toda página do Índice renderiza Migalhas com indice e caminhoAtual', () => {
  assert.equal(PAGINAS.length, 15, 'o app do Índice deve ter as 15 páginas esperadas');
  const falhas = [];
  for (const pagina of PAGINAS) {
    const fonte = lerApp(pagina);
    const blocos = blocosMigalhas(fonte);
    if (blocos.length === 0) {
      // Rankings compartilham o renderizador; a trilha é validada dentro dele.
      if (fonte.includes('<RankingPagina')) continue;
      falhas.push(`${pagina}: sem <Migalhas> nem <RankingPagina>`);
      continue;
    }
    for (const bloco of blocos) {
      if (!/\bindice\b/.test(bloco)) falhas.push(`${pagina}: Migalhas sem prop indice`);
      if (!/\bcaminhoAtual=/.test(bloco)) falhas.push(`${pagina}: Migalhas sem caminhoAtual`);
    }
  }
  assert.deepEqual(falhas, []);
});

test('Migalhas é a única fonte do BreadcrumbList das rotas do Índice', () => {
  const componente = ler('src/components/Migalhas.tsx');
  assert.ok(componente.includes('breadcrumb('), 'Migalhas deve montar o BreadcrumbList');
  assert.ok(componente.includes('data-indice'), 'Migalhas deve marcar o breadcrumb do Índice no HTML');
  assert.ok(componente.includes('aria-current'), 'item atual precisa de aria-current para acessibilidade');

  const paginasComJsonLdDeTrilha = PAGINAS.filter((pagina) => {
    const fonte = lerApp(pagina);
    return /breadcrumb\s*\(/.test(fonte) || /'@type':\s*'BreadcrumbList'/.test(fonte);
  });
  assert.deepEqual(paginasComJsonLdDeTrilha, [], 'nenhuma página deve montar BreadcrumbList por conta própria');
});

test('a trilha do Brasil enraíza em Índice e a dos EUA em US Index', () => {
  for (const pagina of PAGINAS) {
    const fonte = lerApp(pagina);
    const blocos = blocosMigalhas(fonte);
    if (blocos.length === 0) continue;
    const raizEsperada = pagina.startsWith('(us)/') ? 'US Index' : 'Índice';
    for (const bloco of blocos) {
      assert.ok(bloco.includes(raizEsperada), `${pagina}: trilha deve começar em "${raizEsperada}"`);
    }
  }
});

test('páginas dos EUA usam o rótulo acessível em inglês', () => {
  for (const pagina of PAGINAS.filter((p) => p.startsWith('(us)/'))) {
    const fonte = lerApp(pagina);
    for (const bloco of blocosMigalhas(fonte)) {
      assert.ok(bloco.includes('rotulo="You are here"'), `${pagina}: breadcrumb dos EUA deve usar "You are here"`);
    }
  }
});

test('ranking anuncia o hub estadual e os hubs municipais do recorte', () => {
  const componente = ler('src/components/RankingPagina.tsx');
  assert.ok(componente.includes('caminhoAtual={caminho}'), 'ranking deve informar o caminho canônico');
  assert.ok(
    componente.includes('href={`/${uf.toLowerCase()}`}'),
    'ranking estadual deve linkar o hub do estado',
  );
  assert.ok(
    componente.includes('href={`/${l.mun.uf.toLowerCase()}/${l.mun.slug}`}'),
    'ranking deve linkar os hubs municipais listados',
  );
});

test('página de segmento no Brasil aponta para o município e o estado', () => {
  const fonte = lerApp('(br)/[uf]/[municipio]/[segmento]/page.tsx');
  assert.ok(fonte.includes('href={`/${uf}/${municipio}`}'), 'segmento deve linkar o hub municipal');
  assert.ok(fonte.includes('href={`/${uf}`}'), 'segmento deve linkar o hub estadual');
});

test('páginas dos EUA navegam para cima na hierarquia (hub, estado, condado)', () => {
  const estado = lerApp('(us)/us/[state]/page.tsx');
  assert.ok(estado.includes('href="/us"'), 'estado deve linkar o hub /us');

  const condado = lerApp('(us)/us/[state]/[county]/page.tsx');
  assert.ok(condado.includes('href={`/us/${state}`}'), 'condado deve linkar o hub do estado');
  assert.ok(condado.includes('href="/us"'), 'condado deve linkar o hub /us');

  const segmento = lerApp('(us)/us/[state]/[county]/[segment]/page.tsx');
  assert.ok(segmento.includes('href={`/us/${state}/${county}`}'), 'segmento deve linkar o hub do condado');
  assert.ok(segmento.includes('href={`/us/${state}`}'), 'segmento deve linkar o hub do estado');
  assert.ok(segmento.includes('href="/us"'), 'segmento deve linkar o hub /us');
});

test('breadcrumbs institucionais do frontend permanecem independentes', () => {
  const frontend = path.resolve(raiz, '..', 'frontend/src/app/components');
  const blog = readFileSync(path.join(frontend, 'BlogBreadcrumb.tsx'), 'utf8');
  const jsonld = readFileSync(path.join(frontend, 'BreadcrumbJsonLd.tsx'), 'utf8');
  for (const [nome, fonte] of [['BlogBreadcrumb', blog], ['BreadcrumbJsonLd', jsonld]]) {
    assert.ok(!fonte.includes('Migalhas'), `${nome} não deve depender do breadcrumb do Índice`);
  }
  assert.ok(blog.includes('aria-label="Breadcrumb"'), 'BlogBreadcrumb deve manter o breadcrumb visível');
  assert.ok(blog.includes('href="/blog"'), 'BlogBreadcrumb deve manter a trilha Início / Blog');
  assert.ok(jsonld.includes("'@type': 'BreadcrumbList'"), 'BreadcrumbJsonLd deve continuar emitindo BreadcrumbList');
});
