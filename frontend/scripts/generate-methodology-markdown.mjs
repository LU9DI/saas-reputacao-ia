import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentPath = path.join(frontendDir, 'src/app/metodologia-auditoria/content.json');
const outputPath = path.join(frontendDir, 'public/metodologia-auditoria.md');
const siteUrl = 'https://filtraai.com';

const content = JSON.parse(await readFile(contentPath, 'utf8'));
const updatedLabel = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${content.dateModified}T00:00:00Z`));

const absoluteUrl = (href) => (href.startsWith('http') ? href : `${siteUrl}${href}`);
const lines = [
  `# ${content.h1}`,
  '',
  `> ${content.lead}`,
  '',
  `- **Canonical:** ${content.canonical}`,
  `- **Atualizado em:** ${updatedLabel}`,
  `- **Idioma:** pt-BR`,
  '',
  `## ${content.status.heading}`,
  '',
  content.status.body,
  '',
];

for (const section of content.sections) {
  lines.push(`## ${section.heading}`, '');
  for (const paragraph of section.paragraphs) {
    lines.push(paragraph, '');
  }
  if (section.bullets.length > 0) {
    section.bullets.forEach((item, index) => {
      lines.push(`${section.ordered ? `${index + 1}.` : '-'} ${item}`);
    });
    lines.push('');
  }
  for (const link of section.links) {
    lines.push(`[${link.label}](${absoluteUrl(link.href)})`, '');
  }
}

lines.push(`## ${content.glossary.heading}`, '');
lines.push(content.glossary.intro, '');
for (const term of content.glossary.terms) {
  lines.push(`- **${term.term}:** ${term.definition}`);
}
lines.push('');

lines.push('## Perguntas frequentes', '');
for (const item of content.faq) {
  lines.push(`### ${item.question}`, '', item.answer, '');
}

lines.push(`## ${content.cta.heading}`, '');
lines.push(content.cta.body, '');
lines.push(`[${content.cta.label}](${absoluteUrl(content.cta.href)})`, '');

lines.push('## Continue explorando', '');
for (const link of content.related) {
  lines.push(`- [${link.label}](${absoluteUrl(link.href)})`);
}
lines.push('');

lines.push(
  '---',
  '',
  `Esta é a versão em Markdown da página [${content.h1}](${content.canonical}). A versão HTML é a canônica.`,
  '',
);

await writeFile(outputPath, lines.join('\n'), 'utf8');
console.log(`Generated ${path.relative(frontendDir, outputPath)} from ${path.relative(frontendDir, contentPath)}.`);
