import { existsSync, lstatSync, readdirSync, realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DADOS = new Set(['stats', 'meta.json', 'counties.json', 'authorities.json']);
const GSC = new Set(['RESUMO.txt']);

/**
 * Valida um diretório de saída antes de qualquer remoção recursiva.
 * Só aceita nomes gerados por estes scripts, dentro do repositório ou do diretório temporário,
 * e recusa diretórios existentes com arquivos que não sejam produtos conhecidos.
 * @returns {string} caminho absoluto e resolvido
 */
export function validarDestino(alvo, raiz, tipo) {
  const abs = path.resolve(alvo);
  const nome = path.basename(abs);
  const pai = realpathSync(path.dirname(abs));
  const efetivo = path.join(pai, nome);
  const repo = realpathSync(raiz);
  const tmp = realpathSync(os.tmpdir());
  const dentro = (base) => efetivo === base || efetivo.startsWith(base + path.sep);
  if (!dentro(repo) && !dentro(tmp)) throw new Error(`--out fora do repositório ou do temporário: ${efetivo}`);
  if (efetivo === repo || efetivo === tmp || efetivo === path.parse(efetivo).root) throw new Error(`--out não pode ser a raiz: ${efetivo}`);

  const dados = tipo === 'dados';
  if (tipo !== 'dados' && tipo !== 'gsc') throw new Error(`tipo de destino desconhecido: ${tipo}`);
  if (dados ? !/^data-[a-z0-9][a-z0-9-]*$/i.test(nome) : !/^(\.gsc-export|gsc-export)$/.test(nome)) {
    throw new Error(`nome de --out não permitido para ${tipo}: ${nome}`);
  }
  if (!existsSync(efetivo)) return efetivo;
  const st = lstatSync(efetivo);
  if (st.isSymbolicLink() || !st.isDirectory()) throw new Error(`--out existente não é um diretório comum: ${efetivo}`);
  const permitidos = dados ? DADOS : GSC;
  for (const entrada of readdirSync(efetivo)) {
    const ok = permitidos.has(entrada) || (!dados && /^urls-us-\d{3}\.txt$/.test(entrada));
    if (!ok) throw new Error(`--out contém arquivo não gerado por este script (${entrada}); recusando apagar ${efetivo}`);
  }
  return efetivo;
}
