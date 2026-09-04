import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { getDb, findEmpresa } from '../lib/db.js';

const reviewsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  message: { error: 'Muitas avaliações. Tente mais tarde.' },
});

export function mountReviewRoutes(app: Express) {
  app.post('/api/reviews', reviewsLimiter, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const name = String(req.body.name ?? '').trim().slice(0, 100);
      const comment = String(req.body.comment ?? '').trim().slice(0, 500);
      const rating = Number(req.body.rating);
      const empresaRef = String(req.body.empresa_id || req.body.empresa_ref || '').slice(0, 100);

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating deve ser inteiro entre 1 e 5.' });
      }
      if (rating <= 3 && !comment) {
        return res.status(400).json({ error: 'Comentário obrigatório para notas ≤ 3.' });
      }

      let empresaId: string | null = null;
      if (empresaRef) {
        const emp = await findEmpresa(empresaRef);
        if (!emp) return res.status(404).json({ error: 'Empresa não encontrada.' });
        empresaId = emp.id;
      }

      const result = await db.run(
        `INSERT INTO reviews (empresa_id, name, rating, comment) VALUES (?, ?, ?, ?)`,
        [empresaId, name || 'Anônimo', rating, comment || null]
      );

      res.status(201).json({ success: true, id: result.lastID });
    } catch (e) {
      console.error('reviews:', e);
      res.status(500).json({ error: 'Erro interno.' });
    }
  });

  app.get('/api/reviews/:ref', async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const emp = await findEmpresa(req.params.ref);
      if (!emp) return res.status(404).json({ error: 'Empresa não encontrada.' });
      const rows = await db.all(
        `SELECT id, name, rating, comment, ai_reply, createdAt FROM reviews WHERE empresa_id = ? ORDER BY createdAt DESC LIMIT 100`,
        [emp.id]
      );
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: 'Erro interno.' });
    }
  });
}
