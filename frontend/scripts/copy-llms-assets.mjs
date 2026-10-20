import { copyFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(frontendDir, 'public');
const outputDir = path.join(frontendDir, 'out');

await access(outputDir);
await mkdir(outputDir, { recursive: true });

for (const filename of ['llms.txt', 'llms-full.txt']) {
  const source = path.join(publicDir, filename);
  const destination = path.join(outputDir, filename);
  await access(source);
  await copyFile(source, destination);
  console.log(`Ensured static export asset: ${destination}`);
}
