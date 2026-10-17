import type { Express } from 'express';

/** Endpoint legado mantido apenas para comunicar a aposentadoria do PDF. */
export function mountRelatorioInteligenteRoutes(app: Express) {
  app.all('/api/empresa/:ref/relatorio-inteligente.pdf', (_req, res) =>
    res.status(410).json({
      error: 'O download PDF do relatório inteligente foi descontinuado. Consulte o relatório no painel.',
      code: 'PDF_RETIRED',
    })
  );
}
