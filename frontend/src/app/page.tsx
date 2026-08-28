'use client';

import { useState } from 'react';
import axios from 'axios';

export default function ReviewForm() {
  const [name, setName] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cria a lista de 5 estrelas de forma segura
  const totalStars = Array.from({ length: 5 }, (_, i) => i + 1);

  const handleStarClick = (selectedRating: number) => {
    setRating(selectedRating);
    
    // Se a nota for excelente (4 ou 5 estrelas), redireciona direto para o Google Maps
    if (selectedRating >= 4) {
      window.location.href = 'https://google.com'; 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;

    setLoading(true);

    try {
      // Enviando os dados para o backend na porta 5000 com o endereço completo
      const response = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'Anônimo',
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      setSubmitted(true);
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      alert("Ocorreu um erro de rede ao enviar seu feedback. Verifique se o servidor está ligado.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full text-center">
          <div className="text-4xl mb-4">🙏</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Obrigado pelo feedback!</h2>
          <p className="text-gray-600">Sua opinião foi enviada diretamente para a nossa gerência.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Sua Opinião Importa</h2>
        <p className="text-center text-sm text-gray-500 mb-6">Ajude-nos a melhorar nossos serviços.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo de Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome (Opcional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800"
            />
          </div>

          {/* Seleção de Estrelas */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">Como foi sua experiência?</label>
            <div className="flex justify-center gap-2">
              {totalStars.map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  className={`text-4xl transition-transform active:scale-95 ${
                    rating && star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Caixa de Texto Privada (Só aparece para notas ruins: 1, 2 ou 3) */}
          {rating && rating <= 3 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-red-600">
                Poxa! Conte-nos o que aconteceu para melhorarmos:
              </label>
              <textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Digite sua reclamação de forma privada aqui..."
                rows={4}
                className="w-full px-4 py-2 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition text-gray-800"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition disabled:bg-gray-400"
              >
                {loading ? 'Enviando...' : 'Enviar Crítica Privada'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

