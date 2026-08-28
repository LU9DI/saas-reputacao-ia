import { Request, Response } from 'express';

// Armazenamento temporário (depois trocamos por banco de dados)
let reviews: any[] = [];

export const createReview = (req: Request, res: Response) => {
  const { stars, comment, language } = req.body;

  if (stars === undefined || !comment || !language) {
    return res.status(400).json({
      success: false,
      message: 'Campos obrigatórios: stars, comment, language',
    });
  }

  const newReview = {
    id: reviews.length + 1,
    stars,
    comment,
    language,
    createdAt: new Date().toISOString(),
  };

  reviews.push(newReview);
  console.log('📥 Nova avaliação recebida:', newReview);

  return res.status(201).json({
    success: true,
    message: 'Feedback recebido com sucesso!',
    data: newReview,
  });
};