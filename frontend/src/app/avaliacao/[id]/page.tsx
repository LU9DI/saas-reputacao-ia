'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getEnv } from '../../utils/env';
import { readApiError } from '../../utils/apiError';
import { useLanguage } from '../../Contexts/LanguageContext';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { BrandMark } from '../../components/BrandMark';

/** Textos da página de avaliação — fallback se a chave faltar no dicionário. */
const EVAL_FALLBACK: Record<string, Record<string, string>> = {
  pt: {
    subtitle: 'Como foi sua experiência conosco hoje?',
    eval_label: 'Avaliação',
    help_improve: 'Sua resposta nos ajuda a melhorar o atendimento.',
    name_label: 'Seu nome (opcional)',
    name_placeholder: 'Como podemos te chamar?',
    rating_label: 'Sua nota',
    rating_hint: 'Toque nas estrelas. Notas 4 e 5 vão ao Google Reviews.',
    comment_label: 'O que aconteceu? *',
    comment_placeholder: 'Conte com detalhes para podermos resolver…',
    wpp_label: 'Seu WhatsApp *',
    wpp_placeholder: 'DDD + número (ex: 11999998888)',
    wpp_hint: 'Usamos só para a empresa entrar em contato sobre esta reclamação.',
    wpp_invalid: 'Informe um WhatsApp válido com DDD (8 a 15 dígitos).',
    wpp_not_configured: 'A empresa ainda não configurou WhatsApp de suporte.',
    btn_send_wpp: 'Enviar e falar no WhatsApp',
    btn_send_private: 'Enviar feedback privado',
    btn_open_wpp: 'Abrir WhatsApp da empresa',
    btn_talk_wpp: 'Falar no WhatsApp',
    sending: 'Enviando…',
    send_error: 'Não foi possível enviar. Tente novamente.',
    access_error: 'Não foi possível validar o acesso.',
    try_again: 'Tentar novamente',
    access_closed: 'Este link de avaliação não está disponível.',
    see_plans: 'Ver planos',
    thanks_title: 'Obrigado pelo feedback',
    thanks_body: 'Sua mensagem foi registrada em privado. A equipe vai analisar com prioridade.',
    loading: 'Carregando…',
  },
  en: {
    subtitle: 'How was your experience with us today?',
    eval_label: 'Review',
    help_improve: 'Your answer helps us improve our service.',
    name_label: 'Your name (optional)',
    name_placeholder: 'What should we call you?',
    rating_label: 'Your rating',
    rating_hint: 'Tap the stars. Ratings 4 and 5 go to Google Reviews.',
    comment_label: 'What happened? *',
    comment_placeholder: 'Share details so we can help…',
    wpp_label: 'Your WhatsApp *',
    wpp_placeholder: 'Country code + number',
    wpp_hint: 'Used only so the business can contact you about this feedback.',
    wpp_invalid: 'Enter a valid WhatsApp number (8–15 digits).',
    wpp_not_configured: 'This business has not set up support WhatsApp yet.',
    btn_send_wpp: 'Send and open WhatsApp',
    btn_send_private: 'Send private feedback',
    btn_open_wpp: 'Open business WhatsApp',
    btn_talk_wpp: 'Chat on WhatsApp',
    sending: 'Sending…',
    send_error: 'Could not send. Please try again.',
    access_error: 'Could not validate access.',
    try_again: 'Try again',
    access_closed: 'This review link is not available.',
    see_plans: 'See plans',
    thanks_title: 'Thank you for your feedback',
    thanks_body: 'Your message was saved privately. The team will review it soon.',
    loading: 'Loading…',
  },
  es: {
    subtitle: '¿Cómo fue su experiencia con nosotros hoy?',
    eval_label: 'Evaluación',
    help_improve: 'Tu respuesta nos ayuda a mejorar el servicio.',
    name_label: 'Tu nombre (opcional)',
    name_placeholder: '¿Cómo podemos llamarte?',
    rating_label: 'Tu nota',
    rating_hint: 'Toca las estrellas. Las notas 4 y 5 van a Google Reviews.',
    comment_label: '¿Qué ocurrió? *',
    comment_placeholder: 'Cuéntanos con detalle para poder ayudar…',
    wpp_label: 'Tu WhatsApp *',
    wpp_placeholder: 'Código de país + número',
    wpp_hint: 'Solo para que la empresa contacte sobre este comentario.',
    wpp_invalid: 'Indica un WhatsApp válido (8–15 dígitos).',
    wpp_not_configured: 'La empresa aún no configuró WhatsApp de soporte.',
    btn_send_wpp: 'Enviar y abrir WhatsApp',
    btn_send_private: 'Enviar feedback privado',
    btn_open_wpp: 'Abrir WhatsApp de la empresa',
    btn_talk_wpp: 'Hablar por WhatsApp',
    sending: 'Enviando…',
    send_error: 'No se pudo enviar. Inténtalo de nuevo.',
    access_error: 'No se pudo validar el acceso.',
    try_again: 'Intentar de nuevo',
    access_closed: 'Este enlace de evaluación no está disponible.',
    see_plans: 'Ver planes',
    thanks_title: 'Gracias por tu feedback',
    thanks_body: 'Tu mensaje quedó registrado en privado. El equipo lo revisará pronto.',
    loading: 'Cargando…',
  },
  zh: {
    subtitle: '您今天的体验如何？',
    eval_label: '评价',
    help_improve: '您的反馈有助于我们改进服务。',
    name_label: '您的姓名（可选）',
    name_placeholder: '我们如何称呼您？',
    rating_label: '您的评分',
    rating_hint: '点击星星。4–5 星将前往 Google 评价。',
    comment_label: '发生了什么？*',
    comment_placeholder: '请详细说明，以便我们处理…',
    wpp_label: '您的 WhatsApp *',
    wpp_placeholder: '国家代码 + 号码',
    wpp_hint: '仅用于商家就本次反馈联系您。',
    wpp_invalid: '请输入有效的 WhatsApp 号码（8–15 位数字）。',
    wpp_not_configured: '商家尚未配置客服 WhatsApp。',
    btn_send_wpp: '发送并打开 WhatsApp',
    btn_send_private: '发送私下反馈',
    btn_open_wpp: '打开商家 WhatsApp',
    btn_talk_wpp: '通过 WhatsApp 联系',
    sending: '发送中…',
    send_error: '无法发送，请重试。',
    access_error: '无法验证访问权限。',
    try_again: '重试',
    access_closed: '此评价链接不可用。',
    see_plans: '查看套餐',
    thanks_title: '感谢您的反馈',
    thanks_body: '您的消息已私下记录，团队将尽快处理。',
    loading: '加载中…',
  },
};

export default function PaginaAvaliacao() {
  const params = useParams();
  const empresaId = params.id as string;
  const { language, t } = useLanguage();

  const tx = useMemo(() => {
    const fb = EVAL_FALLBACK[language] || EVAL_FALLBACK.pt;
    return (key: string) => {
      const fromDict = t?.[key];
      if (fromDict && String(fromDict).trim()) return String(fromDict);
      return fb[key] || EVAL_FALLBACK.pt[key] || key;
    };
  }, [language, t]);

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

  const mensagemClienteParaEmpresa = () => {
    const empresa =
      nomeEmpresa.trim() ||
      (language === 'en' ? 'your company' : language === 'es' ? 'su empresa' : 'vocês');
    const cliente = name.trim();
    const texto =
      language === 'en'
        ? `Hi, ${empresa}!\n\nI just submitted feedback through the evaluation link and wasn't satisfied with the service.${comment.trim() ? `\n\nWhat happened: ${comment.trim().slice(0, 280)}` : ''}\n\nI'd like to talk and try to resolve this.${cliente ? `\n\n— ${cliente}` : ''}`
        : language === 'es'
          ? `¡Hola, ${empresa}!\n\nAcabo de registrar un feedback por el enlace de evaluación y no quedé satisfecho con la atención.${comment.trim() ? `\n\nLo que ocurrió: ${comment.trim().slice(0, 280)}` : ''}\n\nMe gustaría conversar para intentar resolverlo.${cliente ? `\n\n— ${cliente}` : ''}`
          : `Olá, ${empresa}!\n\nAcabei de registrar um feedback pelo link de avaliação e não fiquei satisfeito com o atendimento.${comment.trim() ? `\n\nO que aconteceu: ${comment.trim().slice(0, 280)}` : ''}\n\nGostaria de conversar para resolver isso.${cliente ? `\n\n— ${cliente}` : ''}`;
    return texto;
  };

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
      setErro(tx('wpp_invalid'));
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
        setErro(await readApiError(response, tx('send_error')));
        return;
      }

      if (whatsappUrl) {
        const sep = whatsappUrl.includes('?') ? '&' : '?';
        window.location.href = `${whatsappUrl}${sep}text=${encodeURIComponent(mensagemClienteParaEmpresa())}`;
        return;
      }

      setSubmitted(true);
    } catch {
      setErro(tx('send_error'));
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
        <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium">
          {tx('eval_label')}
        </p>
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
        <p className="text-zinc-300 mb-4">{tx('access_error')}</p>
        <button
          type="button"
          onClick={validarAcesso}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold"
        >
          {tx('try_again')}
        </button>
      </div>
    );
  }

  if (trialValido === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-zinc-400 gap-4">
        <LangBar />
        <BrandMark href={null} size="sm" centered />
        <span>{tx('loading')}</span>
      </div>
    );
  }

  if (!trialValido) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
        <LangBar />
        <BrandTop />
        {nomeEmpresa && <p className="text-lg font-semibold text-zinc-300 mb-2">{nomeEmpresa}</p>}
        <h1 className="text-2xl font-bold mb-4">{tx('access_closed')}</h1>
        <a href="/" className="bg-indigo-600 px-6 py-3 rounded-xl font-semibold">
          {tx('see_plans')}
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
          <h2 className="text-2xl font-bold text-zinc-50">{tx('thanks_title')}</h2>
          <p className="text-zinc-400">{tx('thanks_body')}</p>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl"
            >
              <span aria-hidden>💬</span> {tx('btn_talk_wpp')}
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

        <h2 className="text-xl font-semibold text-center text-zinc-100 mb-2">{tx('subtitle')}</h2>
        <p className="text-center text-sm text-zinc-500 mb-6">{tx('help_improve')}</p>

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
            <label htmlFor="nome" className="block text-sm font-medium text-zinc-300 mb-1.5">
              {tx('name_label')}
            </label>
            <input
              id="nome"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 100))}
              placeholder={tx('name_placeholder')}
              className="w-full px-4 py-3 border border-zinc-600 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="text-center">
            <label className="block text-sm font-medium text-zinc-300 mb-2">{tx('rating_label')}</label>
            <div className="flex justify-center gap-2">
              {totalStars.map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  aria-label={`${star} ★`}
                  className={`text-4xl transition-transform active:scale-95 ${
                    rating && star <= rating ? 'text-yellow-400' : 'text-zinc-500'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            {!rating && <p className="mt-3 text-xs text-zinc-500">{tx('rating_hint')}</p>}
          </div>

          {rating !== null && rating <= 3 && (
            <div className="space-y-4 rounded-xl border border-emerald-900/50 bg-zinc-950/80 p-4">
              <div>
                <label htmlFor="comentario" className="block text-sm font-medium text-red-300 mb-1.5">
                  {tx('comment_label')}
                </label>
                <textarea
                  id="comentario"
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  placeholder={tx('comment_placeholder')}
                  rows={4}
                  className="w-full px-4 py-3 border border-red-900/80 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="client-wpp"
                  className="block text-sm font-medium text-emerald-300 mb-1.5"
                >
                  {tx('wpp_label')}
                </label>
                <input
                  id="client-wpp"
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  value={clientWhatsapp}
                  onChange={(e) => setClientWhatsapp(e.target.value.slice(0, 20))}
                  placeholder={tx('wpp_placeholder')}
                  className="w-full px-4 py-3 border border-emerald-700/70 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <p className="text-[11px] text-zinc-500 mt-1.5">{tx('wpp_hint')}</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 px-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 text-base shadow-lg shadow-emerald-900/30"
              >
                {loading ? (
                  tx('sending')
                ) : whatsappUrl ? (
                  <>
                    <span aria-hidden>💬</span> {tx('btn_send_wpp')}
                  </>
                ) : (
                  tx('btn_send_private')
                )}
              </button>

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center text-sm text-emerald-400 hover:text-emerald-300 underline py-1"
                >
                  {tx('btn_open_wpp')}
                </a>
              ) : (
                <p className="text-center text-[11px] text-zinc-600">{tx('wpp_not_configured')}</p>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
