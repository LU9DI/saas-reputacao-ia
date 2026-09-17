import type { Database } from 'sqlite';
import PDFDocument from 'pdfkit';
import { planTemPdf } from './lib/plans.js';

type Review = {
  rating?: number | string;
  comment?: string | null;
  sentiment?: string | null;
  ai_tags?: string | null;
  createdAt?: string;
  created_at?: string;
  is_test?: number | boolean | null;
};

function inCycle(value: string, start: string, end: string): boolean {
  const t = new Date(value).getTime();
  return Number.isFinite(t) && t >= new Date(start).getTime() && t < new Date(end).getTime();
}

function sentiment(reviews: Review[]) {
  let positivo = 0, neutro = 0, negativo = 0;
  for (const r of reviews) {
    const s = String(r.sentiment || '').toLowerCase();
    const n = Number(r.rating);
    if (s.includes('pos')) positivo++;
    else if (s.includes('neg')) negativo++;
    else if (s.includes('neu')) neutro++;
    else if (n >= 4) positivo++;
    else if (n <= 2) negativo++;
    else neutro++;
  }
  return { positivo, neutro, negativo };
}

function tags(reviews: Review[]) {
  const counts: Record<string, number> = {};
  for (const r of reviews) {
    try {
      const list = JSON.parse(String(r.ai_tags || '[]'));
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        const key = String(item || '').trim();
        if (key) counts[key] = (counts[key] || 0) + 1;
      }
    } catch { /* tag inválida não deve quebrar o relatório */ }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
}

export async function gerarRelatorioInteligentePDF(
  db: Database,
  empresaId: string,
  inicio: string,
  fim: string,
  lang = 'pt'
): Promise<Buffer> {
  const empresa: any = await db.get(
    'SELECT id, nome_empresa, plan, status FROM empresas WHERE id = ?',
    [empresaId]
  );
  if (!empresa) throw new Error('Empresa não encontrada.');
  if (!planTemPdf(empresa.plan || empresa.status)) throw new Error('Plano não elegível para PDF.');

  const rows = (await db.all(
    'SELECT rating, comment, sentiment, ai_tags, createdAt, is_test FROM reviews WHERE empresa_id = ? ORDER BY createdAt ASC LIMIT 10000',
    [empresaId]
  )) as Review[];
  const reviews = rows.filter((r) => !r.is_test && inCycle(String(r.createdAt || r.created_at || ''), inicio, fim));

  let sum = 0;
  let positive = 0;
  let critical = 0;
  const dist = [0, 0, 0, 0, 0];
  for (const r of reviews) {
    const n = Number(r.rating);
    if (!Number.isFinite(n) || n < 1 || n > 5) continue;
    sum += n;
    dist[n - 1]++;
    if (n >= 4) positive++;
    if (n <= 3) critical++;
  }
  const avg = reviews.length ? sum / reviews.length : 0;
  const sent = sentiment(reviews);
  const themeRows = tags(reviews);

  const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true, compress: true });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  const title = lang === 'en' ? 'Intelligent Report' : lang === 'es' ? 'Informe Inteligente' : lang === 'zh' ? '智能报告' : 'Relatório Inteligente';
  const period = `${inicio.slice(0, 10)} → ${fim.slice(0, 10)}`;
  const company = String(empresa.nome_empresa || 'Empresa');

  doc.rect(0, 0, doc.page.width, 72).fill('#0f172a');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text('Filtra.AI', 48, 20);
  doc.fillColor('#a5b4fc').font('Helvetica').fontSize(9).text(title, 48, 45);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text(company, 350, 24, { width: 195, align: 'right' });
  doc.fillColor('#94a3b8').font('Helvetica').fontSize(8).text(period, 350, 42, { width: 195, align: 'right' });
  doc.y = 96;

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(17).text(title);
  doc.moveDown(0.25);
  doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(`Período do ciclo: ${period}`);
  doc.moveDown(1);

  const cards = [
    ['Nota média', avg ? avg.toFixed(1) : '—'],
    ['Avaliações', String(reviews.length)],
    ['Positivas', String(positive)],
    ['Pontos de atenção', String(critical)],
  ];
  const gap = 8, width = (doc.page.width - 96 - gap * 3) / 4;
  const y = doc.y;
  cards.forEach(([label, value], i) => {
    const x = 48 + i * (width + gap);
    doc.roundedRect(x, y, width, 60, 6).fillAndStroke('#f1f5f9', '#e2e8f0');
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(7).text(label.toUpperCase(), x + 9, y + 9, { width: width - 18 });
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(18).text(value, x + 9, y + 28, { width: width - 18 });
  });
  doc.y = y + 82;

  const section = (name: string) => {
    doc.moveDown(0.4);
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11).text(name);
    doc.moveDown(0.35);
  };

  section('Distribuição das avaliações');
  dist.forEach((value, i) => {
    const bar = Math.max(2, value / Math.max(...dist, 1) * 300);
    doc.fillColor('#334155').font('Helvetica').fontSize(9).text(`${i + 1} estrelas`, 48, doc.y, { width: 70 });
    doc.roundedRect(125, doc.y + 1, bar, 10, 2).fill('#4f46e5');
    doc.fillColor('#64748b').text(String(value), 435, doc.y, { width: 60 });
    doc.y += 18;
  });

  section('Sentimento');
  doc.fillColor('#16a34a').font('Helvetica-Bold').fontSize(9).text(`Positivo: ${sent.positivo}`);
  doc.fillColor('#d97706').text(`Neutro: ${sent.neutro}`);
  doc.fillColor('#dc2626').text(`Negativo: ${sent.negativo}`);

  section('Principais temas');
  if (!themeRows.length) doc.fillColor('#64748b').font('Helvetica').fontSize(9).text('Nenhum tema recorrente disponível.');
  for (const [name, count] of themeRows) {
    doc.fillColor('#1e293b').font('Helvetica').fontSize(9).text(`• ${name} (${count})`, { width: 500 });
  }

  section('Recomendações');
  const recommendations = [
    critical > positive ? 'Priorize o tratamento das avaliações de até 3 estrelas e acompanhe os motivos recorrentes.' : 'Mantenha os padrões que estão gerando avaliações positivas.',
    avg && avg < 4 ? 'Identifique as causas das notas baixas e transforme os principais problemas em ações operacionais.' : 'Continue monitorando a evolução da média e do volume de avaliações.',
    sent.negativo > sent.positivo ? 'Acompanhe o sentimento negativo no próximo ciclo para verificar se o padrão persiste.' : 'Use os temas positivos recorrentes como referência para manter a experiência do cliente.',
  ];
  recommendations.forEach((r) => doc.fillColor('#1e293b').font('Helvetica').fontSize(9).text(`• ${r}`, { width: 500 }));

  section('Conclusão');
  const conclusion = reviews.length
    ? `No ciclo analisado, a empresa recebeu ${reviews.length} avaliação(ões), com nota média ${avg ? avg.toFixed(1) : 'não disponível'}. O acompanhamento dos pontos positivos, temas recorrentes e avaliações críticas deve orientar as próximas ações.`
    : 'Não houve avaliações válidas no ciclo analisado.';
  doc.fillColor('#334155').font('Helvetica').fontSize(9).text(conclusion, { width: 500, lineGap: 3 });

  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.strokeColor('#e2e8f0').moveTo(48, doc.page.height - 38).lineTo(doc.page.width - 48, doc.page.height - 38).stroke();
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(7).text(`Filtra.AI • ${period}`, 48, doc.page.height - 28);
    doc.text(`Página ${i + 1}/${range.count}`, doc.page.width - 110, doc.page.height - 28, { width: 62, align: 'right' });
  }

  await new Promise<void>((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);
    doc.end();
  });
  const buf = Buffer.concat(chunks);
  if (!buf.length || buf.subarray(0, 4).toString() !== '%PDF') throw new Error('PDF inválido.');
  return buf;
}
