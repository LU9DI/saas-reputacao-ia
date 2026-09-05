'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getEnv } from '../../utils/env';
import { readApiError } from '../../utils/apiError';

export default function PaginaAvaliacao() {
  const params = useParams();
  const empresaId = params.id as string;

  const [name, setName] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [trialValido, setTrialValido] = useState<boolean | null>(null);
  const [erroValidacao, setErroValidacao] = useState(false);
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const totalStars = Array.from({ length: 5 }, (_, i) => i + 1);
  const apiUrl = () => getEnv('NEXT_PUBLIC_API_URL');

  const validarAcesso = async () => {
    setErroValidacao(false);
    try {
      const response = await fetch(`${apiUrl()}/api/empresa/${empresaId}/validar`);
      const data = await response.json();
      if (data.valido) {
        setTrialValido(true);
        setNomeEmpresa(data.nome || '');
        setGoogleReviewUrl(data.google_review_url || '');
        setWhatsappUrl(data.whatsapp_url || null);
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

  const payloadBase = (selectedRating: number) => ({
    name: name || 'Anônimo',
    rating: selectedRating,
    comment: selectedRating <= 3 ? comment : '',
    empresa_id: empresaId,
    website, // honeypot — humanos deixam vazio
  });

  const handleStarClick = (selectedRating: number) => {
    setRating(selectedRating);
    setErro('');

    if (selectedRating >= 4) {
      const payload = JSON.stringify(payloadBase(selectedRating));
      const blob = new Blob([payload], { type: 'application/json' });
      if (!navigator.sendBeacon(`${apiUrl()}/api/reviews`, blob)) {
        fetch(`${apiUrl()}/api/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
      window.location.href = googleReviewUrl || 'https://www.google.com/maps';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating > 3) return;

    setLoading(true);
    setErro('');

    try {
      const response = await fetch(`${apiUrl()}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBase(rating)),
      });

      if (!response.ok) {
        setErro(await readApiError(response, 'Não foi possível enviar o feedback.'));
        return;
      }

      if (whatsappUrl) {
        const texto = [
          `Olá! Acabei de enviar um feedback (${rating}★)${nomeEmpresa ? ` sobre ${nomeEmpresa}` : ''}.`,
          comment.trim() ? `\nResumo: ${comment.trim().slice(0, 280)}` : '',
          `\n— ${name.trim() || 'Cliente'}`,
        ].join('');
        const sep = whatsappUrl.includes('?') ? '&' : '?';
        window.location.href = `${whatsappUrl}${sep}text=${encodeURIComponent(texto)}`;
        return;
      }

      setSubmitted(true);
    } catch {
      setErro('Não foi possível enviar seu feedback. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (erroValidacao) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-zinc-100 p-4">
        <p className="text-zinc-300 mb-4">Não foi possível verificar o acesso.</p>
        <button onClick={validarAcesso} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold">
          Tentar novamente
        </button>
      </div>
    );
  }

  if (trialValido === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-zinc-400">Carregando...</div>
    );
  }

  if (!trialValido) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Acesso encerrado</h1>
        <a href="/" className="bg-indigo-600 px-6 py-3 rounded-xl font-semibold">
          Ver planos
        </a>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center">
          <div className="text-4xl mb-4">🙏</div>
          <h2 className="text-2xl font-bold text-zinc-50 mb-2">Obrigado pelo feedback!</h2>
          <p className="text-zinc-400">Sua opinião foi enviada de forma privada para a gestão.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-center text-zinc-50 mb-2">
          Como foi sua experiência{nomeEmpresa ? ` no ${nomeEmpresa}` : ' conosco'}?
        </h2>
        <p className="text-center text-sm text-zinc-500 mb-6">Sua opinião nos ajuda a melhorar.</p>

        {erro && (
          <div className="mb-4 bg-red-950/60 text-red-300 border border-red-900 p-3 rounded-xl text-sm" role="alert">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Honeypot — escondido de humanos */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '-10000px',
              top: 'auto',
              width: 1,
              height: 1,
              overflow: 'hidden',
            }}
          >
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-zinc-400 mb-1">
              Seu nome (opcional)
            </label>
            <input
              id="nome"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 100))}
              placeholder="Ex: João Silva"
              className="w-full px-4 py-2 border border-zinc-700 bg-zinc-950 text-zinc-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="text-center">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Nota</label>
            <div className="flex justify-center gap-2">
              {totalStars.map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
                  className={`text-4xl transition-transform active:scale-95 ${
                    rating && star <= rating ? 'text-yellow-400' : 'text-zinc-600'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {rating && rating <= 3 && (
            <div className="space-y-2">
              <label htmlFor="comentario" className="block text-sm font-medium text-red-400">
                Conte o que aconteceu (privado):
              </label>
              <textarea
                id="comentario"
                required
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder="Sua crítica fica só com a empresa..."
                rows={4}
                className="w-full px-4 py-2 border border-red-900 bg-zinc-950 text-zinc-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-4 rounded-xl transition disabled:opacity-50"
              >
                {loading
                  ? 'Enviando...'
                  : whatsappUrl
                    ? 'Enviar e falar no WhatsApp'
                    : 'Enviar crítica privada'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
