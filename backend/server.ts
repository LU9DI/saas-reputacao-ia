import express from 'express';
import { createReview } from './api/reviews';

const app = express();

app.post('/api/reviews', createReview);

export default app;
