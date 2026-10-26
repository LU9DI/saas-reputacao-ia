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
import { descreverArquivoFonte } from './lib/source-manifest.mjs';
import {
  bloqueioTokenWebdav,
  configuracaoAuthCurl,
  mascararUrl,
  precisaAuthWebdav,
  redigirSegredo,
} from './lib/ingest-config.mjs';
import {
  parseLinha,
  validarLayout,
  criarAgregador,
  ibgeParaLista,
  municipiosDeCsv,
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
// Compartilhamento público (Nextcloud) da Receita; o acesso por WebDAV usa o token do link público como usuário
// e senha vazia. Confirmado por listagem do diretório em 2026-10-25; o endereço antigo (dadosabertos.rfb.gov.br) expira.
// O token vem exclusivamente do ambiente (segredo do Actions) e nunca é escrito em URL, argv ou log.
const BASE_PADRAO = 'https://arquivos.receitafederal.gov.br/public.php/webdav';
const TOKEN_COMPARTILHAMENTO = (process.env.INDICE_RFB_SHARE_TOKEN || '').trim();
// Filhos (curl/unzip) não precisam do segredo no ambiente: a autenticação vai por stdin.
const AMBIENTE_FILHO = { ...process.env };
delete AMBIENTE_FILHO.INDICE_RFB_SHARE_TOKEN;
const authCurl = (url) => {
  if (!precisaAuthWebdav(url) || !TOKEN_COMPARTILHAMENTO) return { args: [], stdin: null };
  // curl lê `user = "TOKEN:"` do stdin (-K -), mantendo o segredo fora de argv.
  return { args: ['-K', '-'], stdin: configuracaoAuthCurl(TOKEN_COMPARTILHAMENTO) };
};
const LINHAS_MINIMAS = 1_000_000; // a base real tem dezenas de milhões; menos que isso é suspeito
const log = (...m) => console.log('[ingest]', ...m.map((v) => redigirSegredo(v, TOKEN_COMPARTILHAMENTO)));
const falha = (msg) => {
  console.error(`[ingest] ERRO: ${redigirSegredo(msg, TOKEN_COMPARTILHAMENTO)}`);
  process.exit(1);
};

function executar(cmd, cmdArgs, { stdin = null } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: [stdin === null ? 'ignore' : 'pipe', 'pipe', 'pipe'], env: AMBIENTE_FILHO });
    let saida = '';
    let erro = '';
    p.stdout.on('data', (d) => (saida += d));
    p.stderr.on('data', (d) => (erro += d));
    p.on('error', reject);
    if (stdin !== null) {
      p.stdin.on('error', () => {}); // curl pode encerrar antes de consumir toda a configuração
      p.stdin.end(stdin);
    }
    p.on('close', (code) =>
      code === 0
        ? resolve(saida)
        : reject(new Error(redigirSegredo(`${cmd} saiu com ${code}: ${erro.slice(0, 400)}`, TOKEN_COMPARTILHAMENTO))),
    );
  });
}

async function statusHttp(url) {
  const auth = authCurl(url);
  try {
    const out = await executar(
      'curl',
      [...auth.args, '-sS', '-I', '-L', '-m', '30', '-o', '/dev/null', '-w', '%{http_code}', url],
      { stdin: auth.stdin },
    );
    return Number(out.trim());
  } catch {
    return 0;
  }
}

async function baixar(url, destino) {
  log('baixando', mascararUrl(url, TOKEN_COMPARTILHAMENTO));
  const auth = authCurl(url);
  await executar(
    'curl',
    [...auth.args, '-fL', '--retry', '3', '--retry-delay', '5', '-sS', '-o', destino, url],
    { stdin: auth.stdin },
  );
}

/** Lê um zip com um CSV (latin1) linha a linha, sem descompactar em disco. */
async function lerCsvZip(zip, aoLer) {
  const filho = spawn('unzip', ['-p', zip], { stdio: ['ignore', 'pipe', 'pipe'], env: AMBIENTE_FILHO });
  let erro = '';
  filho.stderr.on('data', (d) => (erro += d));
  filho.stdout.setEncoding('latin1');
  const rl = createInterface({ input: filho.stdout, crlfDelay: Infinity });
  const fim = new Promise((resolve, reject) => {
    filho.on('error', reject);
    filho.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`unzip ${zip}: código ${code} ${erro.slice(0, 300)}`))));
  });
  for await (const linha of rl) aoLer(linha);
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
  // Sem o token, `main` aborta antes de qualquer download (ver lib/ingest-config.mjs).
  // Falha antes de criar diretórios e antes de qualquer chamada de rede.
  const bloqueio = bloqueioTokenWebdav({ baseUrl, token: TOKEN_COMPARTILHAMENTO, local: Boolean(local) });
  if (bloqueio) falha(bloqueio);
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
      if (s === 200) {
        competencia = c;
        break;
      }
    }
    if (!competencia) falha('não encontrei a base nos últimos 3 meses. Informe --competencia ou --base-url.');
  }
  log('competência', competencia);
  const urlDe = (arq) => `${baseUrl}/${competencia}/${arq}`;
  const arquivosFonte = [];
  const tipoFonte = (nome) => nome.startsWith('Estabelecimentos') ? 'estabelecimentos' : nome === 'Cnaes.zip' ? 'cnaes' : nome === 'Municipios.zip' ? 'municipios' : 'outro';
  const zipDe = async (arq) => {
    let registro;
    if (local) {
      const p = path.join(local, arq);
      if (!existsSync(p)) falha(`arquivo ausente em --local: ${p}`);
      registro = await descreverArquivoFonte({ caminho: p, nome: arq, tipo: tipoFonte(arq) });
      arquivosFonte.push(registro);
      log(`fonte ${arq}: ${registro.bytes.toLocaleString('pt-BR')} bytes | sha256 ${registro.sha256}`);
      return { caminho: p, temporario: false };
    }
    const destino = path.join(TMP, arq);
    const url = urlDe(arq);
    await baixar(url, destino);
    // A proveniência registra a URL sem credenciais/parâmetros sensíveis.
    registro = await descreverArquivoFonte({
      caminho: destino,
      nome: arq,
      tipo: tipoFonte(arq),
      url: mascararUrl(url, TOKEN_COMPARTILHAMENTO),
    });
    arquivosFonte.push(registro);
    log(`fonte ${arq}: ${registro.bytes.toLocaleString('pt-BR')} bytes | sha256 ${registro.sha256}`);
    return { caminho: destino, temporario: true };
  };
  const limpar = async (z) => z.temporario && rm(z.caminho, { force: true });

  // IBGE primeiro: se a API falhar, o erro aparece em segundos e não depois de horas de processamento.
  // Nomes com acento vêm do IBGE (obrigatório: sem isso os títulos saem sem acento).
  let jsonIbge;
  let listaAlternativa = null;
  if (args['ibge-arquivo']) {
    log('lendo municípios do IBGE de', args['ibge-arquivo']);
    jsonIbge = JSON.parse(await readFile(path.resolve(args['ibge-arquivo']), 'utf8'));
  } else {
    log('consultando municípios no IBGE');
    try {
      const bruto = await executar('curl', ['-fsSL', '--retry', '2', '--retry-delay', '5', '--retry-all-errors', '-m', '25', 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome']);
      jsonIbge = JSON.parse(bruto);
    } catch (e) {
      log('IBGE indisponível (', String(e.message).split('\n')[0], ') -> usando conjunto público kelvins/municipios-brasileiros (códigos e nomes do IBGE)');
      const raiz = 'https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/csv';
      const [csvMun, csvUf] = await Promise.all(
        ['municipios.csv', 'estados.csv'].map((f) => executar('curl', ['-fsSL', '--retry', '4', '--retry-delay', '5', '-m', '60', `${raiz}/${f}`])),
      );
      listaAlternativa = municipiosDeCsv(csvMun, csvUf);
    }
  }
  const ibge = listaAlternativa || ibgeParaLista(jsonIbge);
  if (ibge.length < 5000 && !args.sintetico) falha(`IBGE trouxe só ${ibge.length} municípios (esperado ~5.570).`);
  log('municípios no IBGE:', ibge.length);

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
  for (let i = 0; i < 40; i += 1) {
    const arq = `Estabelecimentos${i}.zip`;
    if (local ? !existsSync(path.join(local, arq)) : (await statusHttp(urlDe(arq))) !== 200) {
      if (i === 0) falha(`${arq} não encontrado para a competência ${competencia}.`);
      break;
    }
    const z = await zipDe(arq);
    let amostras = 0;
    await lerCsvZip(z.caminho, (l) => {
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
    });
    await limpar(z);
    arquivos += 1;
    const c = agregador.contagem();
    log(`${arq} ok | lidas: ${c.lidas.toLocaleString('pt-BR')} | no escopo: ${c.usadas.toLocaleString('pt-BR')}`);
  }
  const { lidas, usadas, malformadas } = agregador.contagem();
  log(`linhas malformadas descartadas: ${malformadas.toLocaleString('pt-BR')} de ${lidas.toLocaleString('pt-BR')}`);
  if (malformadas > lidas * 0.001) falha(`linhas malformadas demais (${malformadas} de ${lidas}, limite 0,1%). O layout do arquivo pode ter mudado.`);
  if (lidas < LINHAS_MINIMAS && !args.sintetico) {
    falha(`apenas ${lidas} linhas lidas (mínimo esperado ${LINHAS_MINIMAS}). A base parece incompleta.`);
  }
  if (!usadas) falha('nenhum estabelecimento caiu nos segmentos configurados.');

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
    arquivosFonte,
    linhasLidas: lidas,
    linhasNoEscopo: usadas,
    municipiosSemNomeIbge: semMatch.length,
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
