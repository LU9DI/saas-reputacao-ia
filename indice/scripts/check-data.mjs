#!/usr/bin/env node
// Trava do build: o app não publica páginas sem dados reais, coerentes e citáveis.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.resolve(process.env.INDICE_DATA_DIR || path.join(raiz, 'data'));

const falhaFatal = (m) => {
  console.error(`\n[check-data] ${m}\n`);
  console.error('Gere os dados com `npm run ingest` (ou pelo workflow "Índice: atualizar dados") e tente de novo.');
  process.exit(1);
};

const lerJson = (caminho) => {
  try {
    return JSON.parse(readFileSync(caminho, 'utf8'));
  } catch (erro) {
    falhaFatal(`Não foi possível ler ${caminho}: ${erro.message}`);
  }
};

if (!existsSync(path.join(dir, 'meta.json'))) falhaFatal(`Dados não encontrados em ${dir} (falta meta.json).`);

const meta = lerJson(path.join(dir, 'meta.json'));
if (meta.sintetico === true) {
  console.error('\n[check-data] Base marcada como sintética. O build de produção foi bloqueado para impedir a publicação de números fictícios.\n');
  process.exit(1);
}
const problemas = [];
const exigir = (condicao, mensagem) => {
  if (!condicao) problemas.push(mensagem);
};
const mesValido = (valor) => /^\d{4}-(0[1-9]|1[0-2])$/.test(valor || '');
const texto = (valor) => typeof valor === 'string' && valor.trim().length > 0;

// ---- Metadados que alimentam títulos, datas, fonte e JSON-LD ----
exigir(mesValido(meta.competencia), 'meta.competencia deve estar no formato AAAA-MM.');
exigir(!Number.isNaN(Date.parse(meta.geradoEm || '')), 'meta.geradoEm deve ser uma data ISO válida.');
exigir(texto(meta.fonte?.nome), 'meta.fonte.nome é obrigatório.');
exigir(/^https:\/\//.test(meta.fonte?.url || ''), 'meta.fonte.url deve ser uma URL https.');
exigir(mesValido(meta.janela?.inicio), 'meta.janela.inicio deve estar no formato AAAA-MM.');
exigir(mesValido(meta.janela?.fim), 'meta.janela.fim deve estar no formato AAAA-MM.');
if (mesValido(meta.janela?.inicio) && mesValido(meta.janela?.fim) && mesValido(meta.competencia)) {
  exigir(meta.janela.inicio <= meta.janela.fim, 'meta.janela.inicio deve ser anterior ou igual a meta.janela.fim.');
  exigir(meta.janela.fim < meta.competencia, 'meta.janela.fim deve ser anterior à competência.');
}
exigir(Number.isInteger(meta.minimoParaIndexar) && meta.minimoParaIndexar >= 1, 'meta.minimoParaIndexar deve ser um inteiro >= 1.');
exigir(Array.isArray(meta.segmentos) && meta.segmentos.length > 0, 'meta.segmentos deve ter ao menos um segmento.');

if (meta.linhasLidas !== undefined) {
  exigir(Number.isInteger(meta.linhasLidas) && meta.linhasLidas >= 0, 'meta.linhasLidas deve ser inteiro >= 0.');
}
if (meta.linhasNoEscopo !== undefined) {
  exigir(Number.isInteger(meta.linhasNoEscopo) && meta.linhasNoEscopo >= 0, 'meta.linhasNoEscopo deve ser inteiro >= 0.');
}
if (meta.linhasLidas !== undefined && meta.linhasNoEscopo !== undefined) {
  exigir(meta.linhasNoEscopo <= meta.linhasLidas, 'meta.linhasNoEscopo não pode superar meta.linhasLidas.');
}
if (meta.arquivosEstabelecimentos !== undefined) {
  exigir(Number.isInteger(meta.arquivosEstabelecimentos) && meta.arquivosEstabelecimentos >= 0, 'meta.arquivosEstabelecimentos deve ser inteiro >= 0.');
}

const slugs = new Set();
const classes = new Map();
for (const [i, seg] of (meta.segmentos || []).entries()) {
  const rotulo = `segmentos[${i}]`;
  exigir(texto(seg?.slug) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(seg.slug), `${rotulo}.slug inválido.`);
  exigir(!slugs.has(seg?.slug), `${rotulo}.slug duplicado: ${seg?.slug}.`);
  if (seg?.slug) slugs.add(seg.slug);
  exigir(texto(seg?.nome), `${rotulo}.nome é obrigatório.`);
  exigir(texto(seg?.curto), `${rotulo}.curto é obrigatório.`);
  exigir(Array.isArray(seg?.classes) && seg.classes.length > 0, `${rotulo}.classes deve ter ao menos uma classe CNAE.`);
  for (const classe of seg?.classes || []) {
    exigir(/^\d{4}$/.test(classe), `${rotulo}: classe CNAE inválida "${classe}" (esperado 4 dígitos).`);
    if (classes.has(classe)) {
      exigir(false, `classe CNAE ${classe} repetida nos segmentos "${classes.get(classe)}" e "${seg.slug}".`);
    } else {
      classes.set(classe, seg.slug);
    }
  }
}

// ---- Arquivos de municípios e subclasses ----
for (const arq of ['municipios.json', 'subclasses.json']) {
  if (!existsSync(path.join(dir, arq))) falhaFatal(`Arquivo ausente: ${arq}`);
}

const municipios = lerJson(path.join(dir, 'municipios.json'));
exigir(Array.isArray(municipios) && municipios.length > 0, 'municipios.json deve ser uma lista não vazia.');
const chavesMunicipios = new Set();
for (const [i, mun] of (municipios || []).entries()) {
  const rotulo = `municipios[${i}]`;
  exigir(/^[A-Z]{2}$/.test(mun?.uf || ''), `${rotulo}.uf inválida.`);
  exigir(texto(mun?.slug), `${rotulo}.slug é obrigatório.`);
  exigir(texto(mun?.nome), `${rotulo}.nome é obrigatório.`);
  if (mun?.ibge !== null && mun?.ibge !== undefined) {
    exigir(Number.isInteger(mun.ibge) && mun.ibge > 0, `${rotulo}.ibge inválido.`);
  }
  const chave = `${mun?.uf}/${mun?.slug}`;
  exigir(!chavesMunicipios.has(chave), `município duplicado: ${chave}.`);
  chavesMunicipios.add(chave);
}

if (meta.municipiosSemNomeIbge !== undefined) {
  exigir(
    Number.isInteger(meta.municipiosSemNomeIbge) && meta.municipiosSemNomeIbge >= 0 && meta.municipiosSemNomeIbge <= municipios.length,
    'meta.municipiosSemNomeIbge deve ser inteiro entre 0 e o total de municípios.',
  );
}

const subclasses = lerJson(path.join(dir, 'subclasses.json'));
exigir(subclasses && typeof subclasses === 'object' && !Array.isArray(subclasses), 'subclasses.json deve ser um objeto código -> nome.');
for (const [codigo, nome] of Object.entries(subclasses || {})) {
  exigir(/^\d{7}$/.test(codigo), `subclasse com código inválido: ${codigo}.`);
  exigir(texto(nome), `subclasse ${codigo} sem nome.`);
}

// ---- Estatísticas por UF: estrutura e coerência interna ----
const statsDir = path.join(dir, 'stats');
const arquivos = existsSync(statsDir) ? readdirSync(statsDir).filter((f) => /^[A-Z]{2}\.json$/.test(f)) : [];
if (!meta.sintetico && arquivos.length < 20) {
  exigir(false, `Só ${arquivos.length} UFs em stats/ (esperado ~27). A ingestão parece incompleta.`);
}
exigir(arquivos.length >= 1, 'stats/ vazio.');

const ufsVistas = new Set();
for (const arquivo of arquivos) {
  const uf = arquivo.slice(0, 2);
  exigir(!ufsVistas.has(uf), `UF duplicada em stats/: ${uf}.`);
  ufsVistas.add(uf);
  const dados = lerJson(path.join(statsDir, arquivo));
  exigir(dados && typeof dados === 'object' && !Array.isArray(dados), `stats/${arquivo} deve ser um objeto município -> segmento.`);
  for (const [slugMun, porSegmento] of Object.entries(dados || {})) {
    const chave = `${uf}/${slugMun}`;
    exigir(chavesMunicipios.has(chave), `stats/${arquivo}: município ${chave} não está em municipios.json.`);
    exigir(porSegmento && typeof porSegmento === 'object' && !Array.isArray(porSegmento), `stats/${arquivo} ${chave}: registro inválido.`);
    for (const [slugSeg, reg] of Object.entries(porSegmento || {})) {
      const rotulo = `stats/${arquivo} ${chave}/${slugSeg}`;
      exigir(slugs.has(slugSeg), `${rotulo}: segmento desconhecido.`);
      if (!reg || typeof reg !== 'object' || Array.isArray(reg)) {
        exigir(false, `${rotulo}: registro inválido.`);
        continue;
      }
      for (const campo of ['a', 'm', 'ab', 'ba']) {
        exigir(Number.isInteger(reg[campo]) && reg[campo] >= 0, `${rotulo}: ${campo} deve ser inteiro >= 0.`);
      }
      if (Number.isInteger(reg.a) && Number.isInteger(reg.m)) {
        exigir(reg.m <= reg.a, `${rotulo}: matrizes (${reg.m}) superam os ativos (${reg.a}).`);
      }
      const sub = reg.sub && typeof reg.sub === 'object' && !Array.isArray(reg.sub) ? reg.sub : {};
      if (!reg.sub || typeof reg.sub !== 'object' || Array.isArray(reg.sub)) {
        exigir(false, `${rotulo}: sub deve ser um objeto.`);
      }
      const somaSub = Object.values(sub).reduce((total, valor) => total + (Number.isInteger(valor) ? valor : 0), 0);
      if (Number.isInteger(reg.a)) {
        exigir(somaSub === reg.a, `${rotulo}: soma das subclasses (${somaSub}) difere dos ativos (${reg.a}).`);
      }
      for (const [codigo, quantidade] of Object.entries(sub)) {
        exigir(/^\d{7}$/.test(codigo), `${rotulo}: subclasse com código inválido "${codigo}".`);
        exigir(Number.isInteger(quantidade) && quantidade > 0, `${rotulo}: quantidade inválida na subclasse ${codigo}.`);
        exigir(Boolean(subclasses[codigo]), `${rotulo}: subclasse ${codigo} sem nome em subclasses.json.`);
      }
      const ano = reg.ano && typeof reg.ano === 'object' && !Array.isArray(reg.ano) ? reg.ano : {};
      if (!reg.ano || typeof reg.ano !== 'object' || Array.isArray(reg.ano)) {
        exigir(false, `${rotulo}: ano deve ser um objeto.`);
      }
      const anoCompetencia = Number(meta.competencia?.slice(0, 4));
      for (const [anoSerie, quantidade] of Object.entries(ano)) {
        exigir(/^\d{4}$/.test(anoSerie), `${rotulo}: ano inválido "${anoSerie}".`);
        exigir(Number.isInteger(quantidade) && quantidade > 0, `${rotulo}: quantidade inválida no ano ${anoSerie}.`);
        exigir(Number(anoSerie) <= anoCompetencia, `${rotulo}: ano ${anoSerie} posterior à competência.`);
      }
      if (Number.isInteger(reg.ab)) {
        const somaAno = Object.values(ano).reduce((total, valor) => total + (Number.isInteger(valor) ? valor : 0), 0);
        exigir(somaAno >= reg.ab, `${rotulo}: aberturas na janela (${reg.ab}) superam a série anual (${somaAno}).`);
      }
    }
  }
}

if (problemas.length) {
  console.error(`\n[check-data] ${problemas.length} problema(s) encontrado(s):`);
  for (const problema of problemas.slice(0, 50)) console.error(`- ${problema}`);
  if (problemas.length > 50) console.error(`... e mais ${problemas.length - 50} problema(s).`);
  console.error('\nCorrija a ingestão ou os metadados antes de publicar.');
  process.exit(1);
}

console.log(
  `[check-data] ok: competência ${meta.competencia}, ${arquivos.length} UFs, ${slugs.size} segmentos, ${municipios.length} municípios${meta.sintetico ? ' (SINTÉTICO, só local)' : ''}.`,
);
