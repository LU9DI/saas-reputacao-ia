#!/usr/bin/env node
// Ingestão do cadastro aberto de CNPJ (Receita Federal) -> agregados por município x segmento.
//
// Uso:
//   node scripts/ingest.mjs [--competencia=AAAA-MM] [--local=DIR] [--out=DIR] [--min=10]
//
//   --competencia  mês da base (padrão: mês atual; recua até 2 meses se o arquivo não existir)
//   --local        pasta com Estabelecimentos0..N.zip, Municipios.zip e Cnaes.zip já baixados
//   --out          pasta de saída (padrão: ./data)
//   --min          mínimo de estabelecimentos ativos para uma página ser indexável (padrão: 10)
//   --base-url     sobrescreve a URL base dos arquivos (ex.: espelho próprio)
//   --token        token do compartilhamento público (padrão: o oficial da Receita)
//   --ibge-arquivo JSON do IBGE já baixado (padrão: consulta a API)
//   --sintetico    marca a saída como amostra sintética e relaxa as travas de volume (só para testes)
//
// Requer `curl` e `unzip` no PATH e acesso à internet (IBGE + Receita). O volume é grande
// (dezenas de milhões de linhas): rode no GitHub Actions ou em uma máquina com banda e disco.
// Nada é inventado: se o layout não bater ou a base vier pequena demais, o script aborta.

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseLinha,
  validarLayout,
  criarAgregador,
  ibgeParaLista,
  resolverMunicipios,
} from './lib/aggregate.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    return m ? [m[1], m[2] ?? 'true'] : [a, 'true'];
  }),
);

const OUT = path.resolve(args.out || path.join(raiz, 'data'));
const TMP = path.join(raiz, '.tmp');
const MINIMO = Number(args.min || 10);
// O portal da Receita é um Nextcloud: os arquivos ficam num compartilhamento público acessível por WebDAV
// (usuário = token do compartilhamento, senha vazia). Estrutura confirmada por listagem em 2026-10-25.
const BASE_PADRAO = 'https://arquivos.receitafederal.gov.br/public.php/webdav/Dados/Cadastros/CNPJ';
let MAX_LINHAS = Infinity; // --max-linhas=N: teste rápido do fluxo, saída marcada como parcial
const TOKEN_PADRAO = 'gn672Ad4CF8N6TK';
let AUTH = `${TOKEN_PADRAO}:`;
const LINHAS_MINIMAS = 1_000_000; // a base real tem dezenas de milhões; menos que isso é suspeito
const log = (...m) => {
  console.log('[ingest]', ...m);
  if (process.env.GITHUB_ACTIONS) console.log(`::notice title=ingest-log::${m.join(' ').slice(0, 400)}`);
};
const falha = (msg) => {
  console.error(`[ingest] ERRO: ${msg}`);
  // Anotação do GitHub Actions (legível pela API mesmo quando o log não é).
  console.error(`::error title=ingest::${String(msg).split('\n')[0].slice(0, 500)}`);
  process.exit(1);
};

function executar(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let saida = '';
    let erro = '';
    p.stdout.on('data', (d) => (saida += d));
    p.stderr.on('data', (d) => (erro += d));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve(saida) : reject(new Error(`${cmd} saiu com ${code}: ${erro.slice(0, 400)}`))));
  });
}

async function statusHttp(url) {
  try {
    const out = await executar('curl', ['-sS', '-I', '-L', '-m', '30', '-u', AUTH, '-o', '/dev/null', '-w', '%{http_code}', url]);
    return Number(out.trim());
  } catch {
    return 0;
  }
}

async function baixar(url, destino) {
  log('baixando', url);
  await executar('curl', ['-fL', '-u', AUTH, '--retry', '3', '--retry-delay', '5', '-sS', '-o', destino, url]);
}

/** Lê um zip com um CSV (latin1) linha a linha, sem descompactar em disco. */
async function lerCsvZip(zip, aoLer, maxLinhas = Infinity) {
  const filho = spawn('unzip', ['-p', zip], { stdio: ['ignore', 'pipe', 'pipe'] });
  let erro = '';
  filho.stderr.on('data', (d) => (erro += d));
  filho.stdout.setEncoding('latin1');
  const rl = createInterface({ input: filho.stdout, crlfDelay: Infinity });
  let cortado = false;
  const fim = new Promise((resolve, reject) => {
    filho.on('error', reject);
    filho.on('close', (code) => (code === 0 || cortado ? resolve() : reject(new Error(`unzip ${zip}: código ${code} ${erro.slice(0, 300)}`))));
  });
  let n = 0;
  for await (const linha of rl) {
    aoLer(linha);
    n += 1;
    if (n >= maxLinhas) {
      cortado = true;
      filho.kill('SIGKILL'); // modo de teste: corta a leitura
      rl.close();
      return;
    }
  }
  await fim;
}

function mesAnterior(competencia, n) {
  const [a, m] = competencia.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1 - n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function main() {
  const segmentos = JSON.parse(await readFile(path.join(raiz, 'config', 'segments.json'), 'utf8'));
  const local = args.local ? path.resolve(args.local) : null;
  const baseUrl = (args['base-url'] || BASE_PADRAO).replace(/\/+$/, '');
  if (args.token) AUTH = `${args.token}:`;
  if (args['max-linhas']) MAX_LINHAS = Number(args['max-linhas']);
  const parcial = Number.isFinite(MAX_LINHAS);
  await mkdir(TMP, { recursive: true });

  // 1) Competência
  let competencia = args.competencia;
  if (!competencia) {
    const agora = new Date();
    const atual = `${agora.getUTCFullYear()}-${String(agora.getUTCMonth() + 1).padStart(2, '0')}`;
    if (local) falha('com --local informe também --competencia=AAAA-MM');
    for (const n of [0, 1, 2]) {
      const c = mesAnterior(atual, n);
      const s = await statusHttp(`${baseUrl}/${c}/Estabelecimentos0.zip`);
      log(`competência ${c}: HTTP ${s}`);
      console.log(`::notice title=sondagem::${baseUrl}/${c}/Estabelecimentos0.zip -> HTTP ${s}`);
      if (s === 200) {
        competencia = c;
        break;
      }
    }
    if (!competencia) falha('não encontrei a base nos últimos 3 meses. Informe --competencia ou --base-url.');
  }
  log('competência', competencia);
  const urlDe = (arq) => `${baseUrl}/${competencia}/${arq}`;
  const zipDe = async (arq) => {
    if (local) {
      const p = path.join(local, arq);
      if (!existsSync(p)) falha(`arquivo ausente em --local: ${p}`);
      return { caminho: p, temporario: false };
    }
    const destino = path.join(TMP, arq);
    await baixar(urlDe(arq), destino);
    return { caminho: destino, temporario: true };
  };
  const limpar = async (z) => z.temporario && rm(z.caminho, { force: true });

  // 2) Descrições oficiais dos CNAEs (7 dígitos) e nomes dos municípios (código da Receita)
  const descricoes = new Map();
  const cn = await zipDe('Cnaes.zip');
  await lerCsvZip(cn.caminho, (l) => {
    const f = l.replace(/^"|"$/g, '').split('";"');
    if (f.length >= 2 && /^\d{7}$/.test(f[0])) descricoes.set(f[0], f[1].trim());
  });
  await limpar(cn);
  const nomesReceita = new Map();
  const mu = await zipDe('Municipios.zip');
  await lerCsvZip(mu.caminho, (l) => {
    const f = l.replace(/^"|"$/g, '').split('";"');
    if (f.length >= 2 && /^\d+$/.test(f[0])) nomesReceita.set(f[0], f[1].trim());
  });
  await limpar(mu);
  if (descricoes.size < 500 && !args.sintetico) falha(`Cnaes.zip trouxe só ${descricoes.size} códigos (esperado ~1.300). Layout mudou?`);
  if (nomesReceita.size < 4000 && !args.sintetico) falha(`Municipios.zip trouxe só ${nomesReceita.size} municípios (esperado ~5.600). Layout mudou?`);
  log(`CNAEs: ${descricoes.size} | municípios (Receita): ${nomesReceita.size}`);

  // 3) Estabelecimentos
  const agregador = criarAgregador(segmentos, competencia);
  let arquivos = 0;
  let layoutOk = false;
  // Lista os arquivos disponíveis (Estabelecimentos0..N)
  const lista = [];
  for (let i = 0; i < 40; i += 1) {
    const arq = `Estabelecimentos${i}.zip`;
    if (parcial && i >= 1) break; // teste rápido: só o primeiro arquivo
    const existe = local ? existsSync(path.join(local, arq)) : (await statusHttp(urlDe(arq))) === 200;
    if (!existe) {
      if (i === 0) falha(`${arq} não encontrado para a competência ${competencia}.`);
      break;
    }
    lista.push(arq);
  }
  log(`${lista.length} arquivos de estabelecimentos`);
  // O portal entrega ~1 MB/s por conexão: baixa vários em paralelo enquanto processa em ordem.
  const CONC = Number(args.concorrencia || 5);
  const baixando = new Map();
  let proximo = 0;
  const disparar = () => {
    while (!local && baixando.size < CONC && proximo < lista.length) {
      const arq = lista[proximo++];
      const p = baixar(urlDe(arq), path.join(TMP, arq));
      p.catch(() => {}); // o erro é tratado quando o arquivo for consumido
      baixando.set(arq, p);
    }
  };
  for (const arq of lista) {
    let caminho;
    if (local) caminho = path.join(local, arq);
    else {
      disparar();
      await baixando.get(arq);
      caminho = path.join(TMP, arq);
      disparar();
    }
    let amostras = 0;
    await lerCsvZip(caminho, (l) => {
      const campos = parseLinha(l);
      if (!campos) return;
      if (!layoutOk && amostras < 200) {
        amostras += 1;
        const problemas = validarLayout(campos);
        if (problemas.length) {
          falha(`layout do arquivo Estabelecimentos não confere com o esperado (${problemas.join('; ')}). Confira o PDF de metadados da Receita antes de continuar.`);
        }
        if (amostras === 200) layoutOk = true;
      }
      agregador.ingerir(campos);
    }, MAX_LINHAS);
    if (!local) await rm(caminho, { force: true });
    arquivos += 1;
    const c = agregador.contagem();
    log(`${arq} ok | lidas: ${c.lidas.toLocaleString('pt-BR')} | no escopo: ${c.usadas.toLocaleString('pt-BR')} | descartadas: ${c.descartadas}`);
  }
  const { lidas, usadas, descartadas } = agregador.contagem();
  if (lidas < LINHAS_MINIMAS && !args.sintetico && !parcial) {
    falha(`apenas ${lidas} linhas lidas (mínimo esperado ${LINHAS_MINIMAS}). A base parece incompleta.`);
  }
  if (!usadas) falha('nenhum estabelecimento caiu nos segmentos configurados.');

  // 4) Nomes com acento via IBGE (obrigatório: sem isso os títulos saem sem acento)
  let jsonIbge;
  if (args['ibge-arquivo']) {
    log('lendo municípios do IBGE de', args['ibge-arquivo']);
    jsonIbge = JSON.parse(await readFile(path.resolve(args['ibge-arquivo']), 'utf8'));
  } else {
    log('consultando municípios no IBGE');
    const resp = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome');
    if (!resp.ok) falha(`IBGE respondeu HTTP ${resp.status}`);
    jsonIbge = await resp.json();
  }
  const ibge = ibgeParaLista(jsonIbge);
  if (ibge.length < 5000 && !args.sintetico) falha(`IBGE trouxe só ${ibge.length} municípios (esperado ~5.570).`);

  // 5) Monta saída
  const pares = [...agregador.dados.keys()].map((k) => {
    const [uf, codigo] = k.split('|');
    return { uf, codigo };
  });
  const municipios = resolverMunicipios(pares, nomesReceita, ibge);
  const porChave = new Map(municipios.map((m) => [`${m.uf}|${m.codigo}`, m]));
  const stats = {};
  const subclasses = {};
  for (const [chave, porSeg] of agregador.dados) {
    const m = porChave.get(chave);
    if (!m) continue;
    for (const [seg, reg] of Object.entries(porSeg)) {
      if (reg.a < 1) continue;
      (stats[m.uf] ||= {})[m.slug] ||= {};
      stats[m.uf][m.slug][seg] = reg;
      for (const cod of Object.keys(reg.sub)) subclasses[cod] = descricoes.get(cod) || cod;
    }
  }

  await rm(OUT, { recursive: true, force: true });
  await mkdir(path.join(OUT, 'stats'), { recursive: true });
  const usadosMun = new Set();
  for (const [uf, porMun] of Object.entries(stats)) {
    for (const slug of Object.keys(porMun)) usadosMun.add(`${uf}|${slug}`);
    await writeFile(path.join(OUT, 'stats', `${uf}.json`), JSON.stringify(porMun));
  }
  const listaMun = municipios
    .filter((m) => usadosMun.has(`${m.uf}|${m.slug}`))
    .map(({ uf, slug, nome, ibge: id }) => ({ uf, slug, nome, ibge: id }))
    .sort((a, b) => a.uf.localeCompare(b.uf) || a.nome.localeCompare(b.nome, 'pt-BR'));
  await writeFile(path.join(OUT, 'municipios.json'), JSON.stringify(listaMun));
  await writeFile(path.join(OUT, 'subclasses.json'), JSON.stringify(subclasses));
  const semMatch = municipios.filter((m) => !m.casouIbge && usadosMun.has(`${m.uf}|${m.slug}`));
  const meta = {
    competencia,
    geradoEm: new Date().toISOString(),
    fonte: {
      nome: 'Cadastro Nacional da Pessoa Jurídica (CNPJ) — Dados Abertos, Receita Federal do Brasil',
      url: 'https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos',
    },
    janela: agregador.janela.rotuloJanela,
    minimoParaIndexar: MINIMO,
    segmentos: segmentos.map((s) => ({ slug: s.slug, nome: s.nome, curto: s.curto, classes: s.classes })),
    arquivosEstabelecimentos: arquivos,
    linhasLidas: lidas,
    linhasNoEscopo: usadas,
    municipiosSemNomeIbge: semMatch.length,
    linhasDescartadas: descartadas,
    parcial,
    sintetico: Boolean(args.sintetico),
  };
  await writeFile(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 2));
  if (semMatch.length) {
    log(`atenção: ${semMatch.length} municípios sem correspondência no IBGE (nome sem acento): ${semMatch.slice(0, 15).map((m) => `${m.nome}/${m.uf}`).join(', ')}`);
  }
  await rm(TMP, { recursive: true, force: true });
  log(`pronto: ${listaMun.length} municípios, saída em ${OUT}`);
}

main().catch((e) => falha(e.stack || e.message));
