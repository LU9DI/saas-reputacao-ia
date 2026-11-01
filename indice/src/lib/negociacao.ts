/** Agentes que pedem `Accept: text/markdown` (e não pedem HTML) recebem a gêmea em Markdown. */
export function pedeMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const a = accept.toLowerCase();
  return a.includes('text/markdown') && !a.includes('text/html');
}
