/**
 * Gera ícones PNG mínimos para PWA (sem dependências externas).
 * Rode: node scripts/generate-pwa-icons.mjs
 *
 * Em produção, troque por ícones de design (192 / 512 / maskable).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'icons');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** PNG sólido indigo #4f46e5 */
function solidPng(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const row = Buffer.alloc(1 + size * 3);
  // filter none + pixels R G B
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = 0x4f;
    row[2 + x * 3] = 0x46;
    row[3 + x * 3] = 0xe5;
  }
  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'icon-192.png'), solidPng(192));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), solidPng(512));
fs.writeFileSync(path.join(outDir, 'icon-maskable-512.png'), solidPng(512));
console.log('PNG gerados em public/icons/');
