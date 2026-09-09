'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getEnv } from '../../utils/env';
import { readApiError } from '../../utils/apiError';
import { useLanguage } from '../../Contexts/LanguageContext';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { BrandMark } from '../../components/BrandMark';

export default function PaginaAvaliacao() {
  const params = useParams();
  const empresaId = params.id as string;
  const { language, t } = useLanguage();

  const [name, setName] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [website, setWebsite] = useState('');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const payloadBase = (selectedRating: number) => ({
    name: name || undefined,
    rating: selectedRating,
    comment: selectedRating <= 3 ? comment : '',
    empresa_id: empresaId,
    website,
    client_whatsapp: selectedRating <= 3 ? clientWhatsapp.trim() : undefined,
    locale: language,
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

    const digits = clientWhatsapp.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
      setErro(t.wpp_invalid);
      return;
    }

    setLoading(true);
    setErro('');

    try {
      const response = await fetch(`${apiUrl()}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBase(rating)),
      });

      if (!response.ok) {
        setErro(await readApiError(response, t.send_error));
        return;
      }

      const data = await response.json().catch(() => ({}));
      // Preferir link montado pelo backend (mensagem simples de insatisfação)
      const wppFromApi = data.whatsapp_empresa_url as string | undefined;
      if (wppFromApi) {
        window.location.href = wppFromApi;
        return;
      }

      if (whatsappUrl) {
        const texto = [
          language === 'en'
            ? `Hi${nomeEmpresa ? `, ${nomeEmpresa}` : ''}! I wasn't satisfied with the service and left private feedback.`
            : language === 'es'
              ? `¡Hola${nomeEmpresa ? `, ${nomeEmpresa}` : ''}! No quedé satisfecho con la atención y registré un feedback privado.`
              : `Olá${nomeEmpresa ? `, ${nomeEmpresa}` : ''}! Não fiquei satisfeito com o atendimento e registrei um feedback privado.`,
          comment.trim() ? `\n${comment.trim().slice(0, 280)}` : '',
          `\n— ${name.trim() || 'Cliente'}`,
        ].join('');
        const sep = whatsappUrl.includes('?') ? '&' : '?';
        window.location.href = `${whatsappUrl}${sep}text=${encodeURIComponent(texto)}`;
        return;
      }

      setSubmitted(true);
    } catch {
      setErro(t.send_error);
    } finally {
      setLoading(false);
    }
  };

  const BrandTop = ({ className = '' }: { className?: string }) => (
    <div className={`flex justify-center mb-6 ${className}`}>
      <BrandMark href="/" size="sm" centered subtitle="Online Reputation" />
    </div>
  );

  const HeaderEmpresa = () =>
    nomeEmpresa ? (
      <div className="text-center mb-6 space-y-1">
        <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium">{t.eval_label}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{nomeEmpresa}</h1>
      </div>
    ) : null;

  const LangBar = () => (
    <div className="fixed top-3 right-3 z-50">
      <LanguageSwitcher compact />
    </div>
  );

  if (erroValidacao) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-zinc-100 p-4">
        <LangBar />
        <BrandTop />
        <p className="text-zinc-300 mb-4">{t.access_error}</p>
        <button
          type="button"
          onClick={validarAcesso}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold"
        >
          {t.try_again}
        </button>
      </div>
    );
  }

  if (trialValido === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-zinc-400 gap-4">
        <LangBar />
        <BrandMark href={null} size="sm" centered />
        <span>{t.loading}</span>
      </div>
    );
  }

  if (!trialValido) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
        <LangBar />
        <BrandTop />
        {nomeEmpresa && (
          <p className="text-lg font-semibold text-zinc-300 mb-2">{nomeEmpresa}</p>
        )}
        <h1 className="text-2xl font-bold mb-4">{t.access_closed}</h1>
        <a href="/" className="bg-indigo-600 px-6 py-3 rounded-xl font-semibold">
          {t.see_plans}
        </a>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <LangBar />
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4">
          <BrandMark href="/" size="sm" centered subtitle="Online Reputation" className="mb-2" />
          {nomeEmpresa && (
            <p className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">{nomeEmpresa}</p>
          )}
          <div className="text-4xl" aria-hidden>
            🙏
          </div>
          <h2 className="text-2xl font-bold text-zinc-50">{t.thanks_title}</h2>
          <p className="text-zinc-400">{t.thanks_body}</p>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl"
            >
              <span aria-hidden>💬</span> {t.btn_talk_wpp}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <LangBar />
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-md max-w-md w-full">
        <BrandTop />
        <HeaderEmpresa />

        <h2 className="text-xl font-semibold text-center text-zinc-100 mb-2">{t.subtitle}</h2>
        <p className="text-center text-sm text-zinc-500 mb-6">{t.help_improve}</p>

        {erro && (
          <div
            className="mb-4 bg-red-950/60 text-red-300 border border-red-900 p-3 rounded-xl text-sm"
            role="alert"
          >
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
              {t.name_label}
            </label>
            <input
              id="nome"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 100))}
              placeholder={t.name_placeholder}
              className="w-full px-4 py-2 border border-zinc-700 bg-zinc-950 text-zinc-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="text-center">
            <label className="block text-sm font-medium text-zinc-400 mb-2">{t.rating_label}</label>
            <div className="flex justify-center gap-2">
              {totalStars.map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  aria-label={`${star}`}
                  className={`text-4xl transition-transform active:scale-95 ${
                    rating && star <= rating ? 'text-yellow-400' : 'text-zinc-600'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            {!rating && <p className="mt-3 text-xs text-zinc-500">{t.rating_hint}</p>}
          </div>

          {rating !== null && rating <= 3 && (
            <div className="space-y-4 rounded-xl border border-emerald-900/50 bg-zinc-950/80 p-4">
              <div>
                <label htmlFor="comentario" className="block text-sm font-medium text-red-400 mb-1">
                  {t.comment_label}
                </label>
                <textarea
                  id="comentario"
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  placeholder={t.comment_placeholder}
                  rows={4}
                  className="w-full px-4 py-2 border border-red-900 bg-zinc-950 text-zinc-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="client-wpp"
                  className="block text-sm font-medium text-emerald-400 mb-1"
                >
                  {t.wpp_label}
                </label>
                <input
                  id="client-wpp"
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  value={clientWhatsapp}
                  onChange={(e) => setClientWhatsapp(e.target.value.slice(0, 20))}
                  placeholder={t.wpp_placeholder}
                  className="w-full px-4 py-2.5 border border-emerald-700/70 bg-zinc-950 text-zinc-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <p className="text-[11px] text-zinc-500 mt-1.5">{t.wpp_hint}</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 px-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 text-base shadow-lg shadow-emerald-900/30"
              >
                {loading ? (
                  t.sending
                ) : whatsappUrl ? (
                  <>
                    <span aria-hidden>💬</span> {t.btn_send_wpp}
                  </>
                ) : (
                  t.btn_send_private
                )}
              </button>

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center text-sm text-emerald-400 hover:text-emerald-300 underline py-1"
                >
                  {t.btn_open_wpp}
                </a>
              ) : (
                <p className="text-center text-[11px] text-zinc-600">{t.wpp_not_configured}</p>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
