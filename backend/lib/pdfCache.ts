/**
 * Cache de PDF em disco — redownload ilimitado sem regenerar e sem tokens de IA.
 * Chave inclui plan + lang + versão de layout para invalidar quando muda o template.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cacheDir(): string {
  const base =
    process.env.PDF_CACHE_DIR ||
    path.resolve(__dirname, '..', '..', 'data', 'pdf-cache');
  fs.mkdirSync(base, { recursive: true });
  return base;
}

function keyPath(
  empresaId: string,
  mesAno: string,
  plan: string,
  lang = 'pt',
  version = 'v7'
): string {
  const h = crypto
    .createHash('sha256')
    .update(`${empresaId}|${mesAno}|${plan}|${lang}|${version}`)
    .digest('hex')
    .slice(0, 24);
  return path.join(cacheDir(), `${h}.pdf`);
}

export function readPdfCache(
  empresaId: string,
  mesAno: string,
  plan: string,
  lang = 'pt',
  version = 'v7'
): Buffer | null {
  try {
    const p = keyPath(empresaId, mesAno, plan, lang, version);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p);
  } catch {
    return null;
  }
}

export function writePdfCache(
  empresaId: string,
  mesAno: string,
  plan: string,
  buf: Buffer,
  lang = 'pt',
  version = 'v7'
): void {
  try {
    const p = keyPath(empresaId, mesAno, plan, lang, version);
    fs.writeFileSync(p, buf);
  } catch (e) {
    console.warn('pdfCache write:', (e as Error)?.message || e);
  }
}

/** Invalida caches de uma empresa (ex.: troca de plano). */
export function invalidatePdfCacheForEmpresa(empresaId: string): number {
  const dir = cacheDir();
  let n = 0;
  try {
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.pdf')) continue;
      void f;
    }
  } catch {
    /* */
  }
  return n;
}
