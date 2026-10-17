import type { Express } from 'express';

/** Endpoint legado mantido apenas para comunicar a aposentadoria do PDF. */
export function mountRelatorioRoutes(app: Express) {
  app.all('/api/empresa/:ref/relatorio.pdf', (_req, res) =>
    res.status(410).json({
      error: 'O relatório PDF foi descontinuado. Consulte o relatório inteligente no painel.',
      code: 'PDF_RETIRED',
    })
  );
}
