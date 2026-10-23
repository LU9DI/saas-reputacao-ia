import { copyFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(frontendDir, 'public');
const outputDir = path.join(frontendDir, 'out');

// "out" is generated only when Next.js is configured with output: 'export'.
// Vercel's Next.js deployment uses the .next output instead, so this optional
// Cloudflare Pages asset-copy step must not fail a normal Vercel build.
const hasStaticExport = await access(outputDir)
  .then(() => true)
  .catch((error) => {
    if (error?.code === 'ENOENT') return false;
    throw error;
  });

if (!hasStaticExport) {
  console.log('Skipping static-export asset copy: no "out" directory was generated.');
} else {
  for (const filename of ['llms.txt', 'llms-full.txt', 'metodologia-auditoria.md', '_headers']) {
    const source = path.join(publicDir, filename);
    const destination = path.join(outputDir, filename);
    await access(source);
    await copyFile(source, destination);
    console.log(`Ensured static export asset: ${destination}`);
  }
}
