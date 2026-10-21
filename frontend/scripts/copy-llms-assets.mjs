import { copyFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(frontendDir, 'public');
const outputDir = path.join(frontendDir, 'out');
const staticExport = process.env.CLOUDFLARE_PAGES === '1';

try {
  await access(outputDir);
} catch (error) {
  if (error?.code === 'ENOENT' && !staticExport) {
    // Standard Next.js builds serve assets from public/ directly. The out/
    // directory is only expected when producing a static export.
    console.log('Skipping static-export asset copy: no out/ directory in standard Next.js build.');
    process.exit(0);
  }

  throw error;
}

await mkdir(outputDir, { recursive: true });

for (const filename of ['llms.txt', 'llms-full.txt']) {
  const source = path.join(publicDir, filename);
  const destination = path.join(outputDir, filename);
  await access(source);
  await copyFile(source, destination);
  console.log(`Ensured static export asset: ${destination}`);
}
