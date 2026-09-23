'use client';

import { useState } from 'react';
import { ArrowRight, Building2, Check, Link2, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { BrandMark } from '../../components/BrandMark';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useLanguage } from '../../Contexts/LanguageContext';
import { validarSenhaEmpresa, SENHA_EMPRESA_HINT } from '../../utils/passwordPolicy';
import { readApiError } from '../../utils/apiError';
import { persistFiltraToken } from '../../utils/persistToken';
import { apiFetch } from '../../utils/apiFailover';

const TERMOS_VERSAO = '2026-09-15';
const PRIV_VERSAO = '2026-09-15';

export default function PreviewTrial() {
  const { language, t } = useLanguage();
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [aceite, setAceite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const copy = {
    pt: {
      eyebrow: 'Seu próximo passo',
      title: 'Comece seus 7 dias grátis.',
      text: 'Uma experiência mais clara para criar sua conta, ativar o teste e entrar direto no painel da sua empresa.',
      company: 'Nome da empresa',
      email: 'E-mail de acesso',
      password: 'Senha',
      button: 'Ativar 7 dias grátis',
      sideTitle: 'Tudo pronto para começar',
      sideText: 'Sem cartão. Sem cobrança automática. Você entra com seu e-mail e senha e pode conhecer o Filtra.AI por dentro.',
      note: 'Ao continuar, você aceita os Termos de Uso e a Política de Privacidade.',
      back: 'Voltar para a apresentação',
      success: 'Conta criada. Abrindo seu painel…',
      support: 'Você poderá configurar seus canais de avaliação dentro do painel.',
    },
    en: {
      eyebrow: 'Your next step',
      title: 'Start your 7-day free trial.',
      text: 'A clearer experience to create your account, activate the trial, and go straight to your company dashboard.',
      company: 'Company name',
      email: 'Access email',
      password: 'Password',
      button: 'Start 7-day free trial',
      sideTitle: 'Ready to get started',
      sideText: 'No card. No automatic charge. Sign in with your email and password and explore Filtra.AI from the inside.',
      note: 'By continuing, you accept the Terms of Use and Privacy Policy.',
      back: 'Back to presentation',
      success: 'Account created. Opening your dashboard…',
      support: 'You can configure your review channels inside the dashboard.',
    },
    es: {
      eyebrow: 'Tu siguiente paso',
      title: 'Comienza tus 7 días gratis.',
      text: 'Una experiencia más clara para crear tu cuenta, activar la prueba y entrar directamente al panel de tu empresa.',
      company: 'Nombre de la empresa',
      email: 'Correo de acceso',
      password: 'Contraseña',
      button: 'Activar 7 días gratis',
      sideTitle: 'Todo listo para empezar',
      sideText: 'Sin tarjeta. Sin cobro automático. Entra con tu correo y contraseña y conoce Filtra.AI desde dentro.',
      note: 'Al continuar, aceptas los Términos de Uso y la Política de Privacidad.',
      back: 'Volver a la presentación',
      success: 'Cuenta creada. Abriendo tu panel…',
      support: 'Podrás configurar tus canales de evaluación dentro del panel.',
    },
    zh: {
      eyebrow: '下一步',
      title: '免费开始 7 天试用。',
      text: '更清晰的注册体验：创建账户、激活试用，并直接进入企业面板。',
      company: '企业名称',
      email: '登录邮箱',
      password: '密码',
      button: '开始 7 天免费试用',
      sideTitle: '一切准备就绪',
      sideText: '无需信用卡，无自动扣费。使用邮箱和密码进入 Filtra.AI，直接体验产品。',
      note: '继续即表示您接受使用条款和隐私政策。',
      back: '返回介绍页',
      success: '账户已创建，正在打开面板…',
      support: '您可以在面板中配置评价渠道。',
    },
  }[language];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!aceite) return setErro(copy.note);
    if (!email.trim() || !email.includes('@')) return setErro('Informe um e-mail válido.');
    const policy = validarSenhaEmpresa(senha);
    if (!policy.ok) return setErro(policy.error);
    setLoading(true);
    try {
      try {
        await apiFetch('/api/legal/aceite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aceito: true,
            contexto: 'trial',
            email: email.trim().toLowerCase(),
            versao_termos: TERMOS_VERSAO,
            versao_privacidade: PRIV_VERSAO,
          }),
          timeoutMs: 10000,
        });
      } catch {}
      const response = await apiFetch('/api/trial/ativar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        timeoutMs: 15000,
        body: JSON.stringify({
          nome_empresa: nomeEmpresa.trim(),
          email: email.trim().toLowerCase(),
          senha,
          google_review_url: googleUrl.trim() || undefined,
          aceite_termos: true,
          versao_termos: TERMOS_VERSAO,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, 'Não foi possível ativar o teste.'));
      const data = await response.json();
      persistFiltraToken(data.token);
      const id = data.slug || data.empresa_id;
      const target = data.link_painel || (id ? `/painel/${id}` : '/');
      window.location.href = target;
    } catch (err: any) {
      setErro(err.message === 'Failed to fetch' ? 'Não foi possível conectar ao servidor.' : err.message || 'Não foi possível ativar o teste.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(14,165,233,.14),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(99,102,241,.22),transparent_32%)]" />
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <BrandMark size="md" subtitle="Reputação" href="/preview" />
        <div className="flex items-center gap-3"><LanguageSwitcher compact /><a href="/preview" className="hidden text-sm text-zinc-400 hover:text-white sm:block">{copy.back}</a></div>
      </nav>

      <section className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:pt-16">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs text-indigo-200"><Sparkles size={13} /> {copy.eyebrow}</div>
          <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-[-.045em] sm:text-6xl">{copy.title}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">{copy.text}</p>
          <div className="mt-8 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
            {['Sem cartão', '7 dias para testar', 'Painel completo', 'IA para sua reputação'].map((x) => <div key={x} className="flex items-center gap-2"><Check size={16} className="text-indigo-300" />{x}</div>)}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/[0.035] p-2 shadow-2xl shadow-indigo-950/30">
          <div className="rounded-[25px] border border-white/10 bg-zinc-950/95 p-6 sm:p-8">
            <div className="mb-7 flex items-center justify-between">
              <div><div className="text-sm font-semibold text-white">Filtra.AI</div><div className="mt-1 text-xs text-zinc-500">{copy.eyebrow}</div></div>
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-300">7 DIAS GRÁTIS</div>
            </div>
            {erro && <div role="alert" className="mb-4 rounded-xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm text-red-300">{erro}</div>}
            <form onSubmit={submit} className="space-y-4">
              <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400"><Building2 size={14}/>{copy.company}</span><input required value={nomeEmpresa} onChange={e=>setNomeEmpresa(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm outline-none focus:border-indigo-400/60" placeholder="Hotel Aurora" /></label>
              <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400"><Mail size={14}/>{copy.email}</span><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm outline-none focus:border-indigo-400/60" placeholder="voce@empresa.com" /></label>
              <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400"><Link2 size={14}/>{language === 'pt' ? 'Link do Google (opcional)' : language === 'en' ? 'Google link (optional)' : language === 'es' ? 'Enlace de Google (opcional)' : 'Google 链接（可选）'}</span><input type="url" value={googleUrl} onChange={e=>setGoogleUrl(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm outline-none focus:border-indigo-400/60" placeholder="https://maps.google.com/..." /></label>
              <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400"><Lock size={14}/>{copy.password}</span><input required minLength={8} type="password" value={senha} onChange={e=>setSenha(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm outline-none focus:border-indigo-400/60" placeholder="••••••••" /><span className="mt-2 block text-[11px] text-zinc-600">{SENHA_EMPRESA_HINT}</span></label>
              <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-zinc-400"><input type="checkbox" checked={aceite} onChange={e=>setAceite(e.target.checked)} className="mt-1 h-4 w-4 accent-indigo-500" /><span>{copy.note} <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-indigo-300 underline">Termos</a> · <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-indigo-300 underline">Privacidade</a>.</span></label>
              <button disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-4 font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50">{loading ? '…' : copy.button}<ArrowRight size={17} className="transition group-hover:translate-x-0.5"/></button>
            </form>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-600"><ShieldCheck size={14}/> {copy.sideText.split('. ')[0]}.</div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl gap-5 px-6 py-10 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><div className="text-sm font-semibold">{copy.sideTitle}</div><p className="mt-2 text-sm leading-6 text-zinc-500">{copy.sideText}</p></div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><div className="text-sm font-semibold">1</div><p className="mt-2 text-sm leading-6 text-zinc-500">{copy.support}</p></div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><div className="text-sm font-semibold">7</div><p className="mt-2 text-sm leading-6 text-zinc-500">{language === 'pt' ? 'dias de acesso para conhecer a plataforma.' : language === 'en' ? 'days to explore the platform.' : language === 'es' ? 'días para explorar la plataforma.' : '天体验完整平台。'}</p></div>
        </div>
      </section>
    </main>
  );
}
