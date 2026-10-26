import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import path from 'node:path';

/** Hash a source artifact as a stream; never reads the whole ZIP into memory. */
export async function descreverArquivoFonte({ caminho, nome, tipo, url = null }) {
  const hash = createHash('sha256');
  let bytes = 0;
  await new Promise((resolve, reject) => {
    const stream = createReadStream(caminho);
    stream.on('data', (chunk) => { bytes += chunk.length; hash.update(chunk); });
    stream.on('error', reject);
    stream.on('end', resolve);
  });
  return { arquivo: nome || path.basename(caminho), tipo, url, bytes, sha256: hash.digest('hex') };
}
