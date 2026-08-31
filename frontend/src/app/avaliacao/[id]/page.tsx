'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function PaginaAvaliacao() {
  const params = useParams();
  const empresaId = params.id as string;

  const [name, setName] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [trialValido, setTrialValido] = useState<boolean | null>(null);
  const [erroValidacao, setErroValidacao] = useState(false);
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');

  const totalStars = Array.from({ length: 5 }, (_, i) => i + 1);

  const validarAcesso = async () => {
    setErroValidacao(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    try {
      const response = await fetch(`${apiUrl}/api/empresa/${empresaId}/validar`);
      const data = await response.json();
      if (data.valido) {
        setTrialValido(true);
        setNomeEmpresa(data.nome || '');
        setGoogleReviewUrl(data.google_review_url || '');
      } else {
        setTrialValido(false);
        setNomeEmpresa(data.nome || '');
      }
    } catch {
      setErroValidacao(true);
    }
  };

  useEffect(() => {
    validarAcesso();
  }, [empresaId]);

  const handleStarClick = (selectedRating: number) => {
    setRating(selectedRating);
    setErro('');

    if (selectedRating >= 4) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const payload = JSON.stringify({
        name: name || 'Anônimo',
        rating: selectedRating,
        comment: '',
        empresa_id: empresaId,
      });

      const blob = new Blob([payload], { type: 'application/json' });
      if (!navigator.sendBeacon(`${apiUrl}/api/reviews`, blob)) {
        fetch(`${apiUrl}/api/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }

      // Redireciona para o link do Google da empresa ou fallback
      window.location.href = googleReviewUrl || 'https://google.com';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating > 3) return;

    setLoading(true);
    setErro('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'Anônimo',
          rating,
          comment,
          empresa_id: empresaId,
        }),
      });

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      setSubmitted(true);
    } catch {
      setErro('Não foi possível enviar seu feedback. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (erroValidacao) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <p className="text-slate-700 mb-4">Não foi possível verificar o acesso. Verifique sua conexão.</p>
        <button onClick={validarAcesso} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold">
          Tentar novamente
        </button>
      </div>
    );
  }

  if (trialValido === null) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!trialValido) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Período de Testes Encerrado</h1>
        <p className="text-slate-400 mb-6">Escolha um plano para reativar o acesso.</p>
        <button className="bg-indigo-600 px-6 py-3 rounded-xl font-semibold">Ver Planos</button>
      </div>
    );
  }

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
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Como foi sua experiência{ nomeEmpresa ? ` no ${nomeEmpresa}` : ' conosco'}?
        </h2>
        <p className="text-center text-sm text-gray-500 mb-6">Ajude-nos a melhorar nossos serviços.</p>

        {erro && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl text-sm" role="alert">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">Seu Nome (Opcional)</label>
            <input
              id="nome"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 100))}
              placeholder="Ex: João Silva"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800"
            />
          </div>

          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">Como foi sua experiência?</label>
            <div className="flex justify-center gap-2">
              {totalStars.map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
                  className={`text-4xl transition-transform active:scale-95 ${
                    rating && star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {rating && rating <= 3 && (
            <div className="space-y-2">
              <label htmlFor="comentario" className="block text-sm font-medium text-red-600">
                Poxa! Conte-nos o que aconteceu para melhorarmos:
              </label>
              <textarea
                id="comentario"
                required
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
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
