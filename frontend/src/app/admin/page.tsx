'use client';

import { useEffect, useState } from 'react';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  aiReply: string | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/reviews')
      .then((res) => res.json())
      .then((data) => setReviews(data))
      .catch((err) => console.error('Erro ao buscar reviews:', err));
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Resposta copiada para a área de transferência!');
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', color: '#111', margin: 0 }}>📊 Painel de Gestão de Reputação</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>Gerencie as críticas retidas e utilize as respostas da IA.</p>
        </div>
        <div style={{ padding: '15px 25px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontWeight: 'bold' }}>
          Críticas Retidas: {reviews.length}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {reviews.map((review) => (
          <div key={review.id} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'between', marginBottom: '10px' }}>
              <strong style={{ fontSize: '18px' }}>{review.name}</strong>
              <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>⭐ {review.rating}/5</span>
            </div>
            
            <p style={{ color: '#374151', backgroundColor: '#f3f4f6', padding: '10px', borderRadius: '6px', fontSize: '14px' }}>
              "{review.comment}"
            </p>

            {review.aiReply && (
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#059669', textTransform: 'uppercase' }}>🪄 Sugestão da IA (Llama 3):</span>
                <p style={{ color: '#047857', fontSize: '14px', margin: '5px 0 15px 0', lineHeight: '1.4' }}>
                  {review.aiReply}
                </p>
                <button
                  onClick={() => copyToClipboard(review.aiReply || '')}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  📋 Copiar Resposta Oficial
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}



