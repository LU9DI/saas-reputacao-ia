import { lstatSync, readdirSync, realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DADOS = {
  us: {
    rotulo: 'EUA',
    arquivos: new Set(['stats', 'meta.json', 'counties.json']),
    stat: /^[A-Z]{2}\.json$/,
    statRotulo: 'AA.json (sigla de estado em maiúsculas)',
  },
  uk: {
    rotulo: 'Reino Unido',
    arquivos: new Set(['stats', 'meta.json', 'authorities.json']),
    stat: /^[a-z-]+\.json$/,
    statRotulo: 'nação.json (minúsculas e hífen)',
  },
};
const GSC = new Set(['RESUMO.txt']);
const GSC_URL = /^urls-us-\d{3}\.txt$/;

const comum = (st) => st.isFile() && !st.isSymbolicLink();

function validarStats(dir, cfg, destino) {
  const entradas = readdirSync(dir);
  if (!entradas.length) throw new Error(`--out contém stats/ vazio; recusando apagar ${destino}`);
  for (const entrada of entradas) {
    const completo = path.join(dir, entrada);
    const st = lstatSync(completo);
    if (st.isSymbolicLink()) throw new Error(`--out contém link simbólico em stats/ (${entrada}); recusando apagar ${destino}`);
    if (!st.isFile()) throw new Error(`--out contém entrada não regular em stats/ (${entrada}); recusando apagar ${destino}`);
    if (!cfg.stat.test(entrada)) throw new Error(`--out contém arquivo desconhecido em stats/ (${entrada}; esperado ${cfg.statRotulo}); recusando apagar ${destino}`);
  }
}

function validarDados(dir, cfg, destino) {
  const entradas = readdirSync(dir);
  if (!entradas.length) throw new Error(`--out existente está vazio; estrutura não reconhecida; recusando apagar ${destino}`);
  let temStats = false;
  for (const entrada of entradas) {
    const completo = path.join(dir, entrada);
    const st = lstatSync(completo);
    if (st.isSymbolicLink()) throw new Error(`--out contém link simbólico (${entrada}); recusando apagar ${destino}`);
    if (entrada === 'stats') {
      if (!st.isDirectory()) throw new Error(`--out contém stats que não é diretório comum; recusando apagar ${destino}`);
      validarStats(completo, cfg, destino);
      temStats = true;
      continue;
    }
    if (!cfg.arquivos.has(entrada)) throw new Error(`--out contém arquivo não gerado por este script (${entrada}); recusando apagar ${destino}`);
    if (!comum(st)) throw new Error(`--out contém ${entrada} que não é arquivo regular; recusando apagar ${destino}`);
  }
  if (!temStats) throw new Error(`--out sem stats/ reconhecível; recusando apagar ${destino}`);
}

function validarGsc(dir, destino) {
  const entradas = readdirSync(dir);
  if (!entradas.length) throw new Error(`--out existente está vazio; estrutura não reconhecida; recusando apagar ${destino}`);
  for (const entrada of entradas) {
    const completo = path.join(dir, entrada);
    const st = lstatSync(completo);
    if (st.isSymbolicLink()) throw new Error(`--out contém link simbólico (${entrada}); recusando apagar ${destino}`);
    const permitido = GSC.has(entrada) || GSC_URL.test(entrada);
    if (!permitido) throw new Error(`--out contém arquivo não gerado por este script (${entrada}); recusando apagar ${destino}`);
    if (!comum(st)) throw new Error(`--out contém ${entrada} que não é arquivo regular; recusando apagar ${destino}`);
  }
}

/**
 * Valida um diretório de saída antes de qualquer remoção recursiva.
 * Só aceita nomes gerados pelos scripts, dentro do repositório ou do diretório temporário.
 * Para dados, exige o conjunto (us|uk) e confere recursivamente stats/: diretório comum,
 * arquivos regulares com o padrão do conjunto, sem links simbólicos nem entradas alheias.
 * @param {string} alvo caminho de saída
 * @param {string} raiz raiz do projeto (indice/)
 * @param {'dados'|'gsc'} tipo
 * @param {'us'|'uk'} [conjunto] obrigatório quando tipo === 'dados'
 * @returns {string} caminho absoluto e resolvido
 */
export function validarDestino(alvo, raiz, tipo, conjunto) {
  const abs = path.resolve(alvo);
  const nome = path.basename(abs);
  const pai = realpathSync(path.dirname(abs));
  const efetivo = path.join(pai, nome);
  const repo = realpathSync(raiz);
  const tmp = realpathSync(os.tmpdir());
  const dentro = (base) => efetivo === base || efetivo.startsWith(base + path.sep);
  if (!dentro(repo) && !dentro(tmp)) throw new Error(`--out fora do repositório ou do temporário: ${efetivo}`);
  if (efetivo === repo || efetivo === tmp || efetivo === path.parse(efetivo).root) throw new Error(`--out não pode ser a raiz: ${efetivo}`);

  if (tipo !== 'dados' && tipo !== 'gsc') throw new Error(`tipo de destino desconhecido: ${tipo}`);
  const cfg = tipo === 'dados' ? DADOS[conjunto] : null;
  if (tipo === 'dados' && !cfg) throw new Error(`conjunto de dados desconhecido: ${conjunto ?? '(ausente)'}; use us ou uk`);
  if (tipo === 'dados' ? !/^data-[a-z0-9][a-z0-9-]*$/i.test(nome) : !/^(\.gsc-export|gsc-export)$/.test(nome)) {
    throw new Error(`nome de --out não permitido para ${tipo}: ${nome}`);
  }

  let st;
  try {
    st = lstatSync(efetivo);
  } catch (e) {
    if (e?.code === 'ENOENT') return efetivo;
    throw e;
  }
  if (st.isSymbolicLink() || !st.isDirectory()) throw new Error(`--out existente não é um diretório comum: ${efetivo}`);

  if (tipo === 'dados') validarDados(efetivo, cfg, efetivo);
  else validarGsc(efetivo, efetivo);
  return efetivo;
}
