import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const staticExport = process.env.CLOUDFLARE_PAGES === '1';
const routeConfig = staticExport
  ? `export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: '_' }];
}`
  : `export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}`;

const page = `import type { Metadata } from 'next';
import Client from './Client';

export const metadata: Metadata = {
  title: 'Painel da empresa',
  robots: { index: false, follow: false },
};

// Route segment config must be statically analyzable by Next.js.
// prebuild emits a static-export variant for Cloudflare Pages and a runtime
// variant for Render. The environment check lives in this build script, not
// in an exported route config expression.
${routeConfig}

export default function Page() {
  return <Client />;
}
`;

writeFileSync(resolve(process.cwd(), 'src/app/painel/[id]/page.tsx'), page, 'utf8');
console.log(`Configured /painel/[id] for ${staticExport ? 'static export' : 'Next.js runtime'}.`);
