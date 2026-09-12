'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Link2,
  Download,
  LayoutDashboard,
  Mail,
  Lock,
} from 'lucide-react';
import QRCode from 'qrcode';
import { PlanCards } from './components/PlanCards';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { BrandMark } from './components/BrandMark';
import { useLanguage } from './Contexts/LanguageContext';
import { validarSenhaEmpresa, SENHA_EMPRESA_HINT } from './utils/passwordPolicy';
import { readApiError } from './utils/apiError';
import { persistFiltraToken } from './utils/persistToken';
import { apiFetch, restoreStickyFromSession } from './utils/apiFailover';

function cnpjValido(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calcularDigito = (base: string, pesoInicial: number): number => {
    let soma = 0;
    let peso = pesoInicial;
    for (let i = 0; i < base.length; i++) {
      soma += parseInt(base[i]) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const digito1 = calcularDigito(cnpj.slice(0, 12), 5);
  const digito2 = calcularDigito(cnpj.slice(0, 12) + digito1, 6);
  return parseInt(cnpj[12]) === digito1 && parseInt(cnpj[13]) === digito2;
}

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm';

export default function Home() {
  const { language: idioma, t } = useLanguage();
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucessoData, setSucessoData] = useState<{
    link_acesso: string;
    link_painel?: string;
    empresa_id?: string;
    slug?: string;
    token?: string;
  } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [checkoutMsg, setCheckoutMsg] = useState('');

  useEffect(() => {
    restoreStickyFromSession();
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search);
      if (q.get('checkout') === 'success')
        setCheckoutMsg('Pagamento recebido. Seu plano será ativado em instantes.');
      if (q.get('checkout') === 'cancel')
        setCheckoutMsg('Checkout cancelado. Você pode tentar de novo quando quiser.');
    }
  }, []);

  useEffect(() => {
    if (!sucessoData?.link_acesso) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(sucessoData.link_acesso, {
      width: 280,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [sucessoData]);

  const aplicarMascaraCnpj = (valor: string) => {
    if (idioma !== 'pt') {
      setCnpj(valor);
      return;
    }
    const apenasNumeros = valor.replace(/\D/g, '').substring(0, 14);
    let mascarado = apenasNumeros;
    if (mascarado.length > 2) mascarado = `${mascarado.substring(0, 2)}.${mascarado.substring(2)}`;
    if (mascarado.length > 6) mascarado = `${mascarado.substring(0, 6)}.${mascarado.substring(6)}`;
    if (mascarado.length > 10)
      mascarado = `${mascarado.substring(0, 10)}/${mascarado.substring(10)}`;
    if (mascarado.length > 15)
      mascarado = `${mascarado.substring(0, 15)}-${mascarado.substring(15)}`;
    setCnpj(mascarado);
  };

  const validarCnpjInput = (valor: string): boolean => {
    const numeros = valor.replace(/\D/g, '');
    if (idioma === 'pt') return cnpjValido(numeros);
    return numeros.length >= 5;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarCnpjInput(cnpj)) {
      setErro(t.tax_id_invalid);
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErro('Informe um e-mail válido.');
      return;
    }
    const polSenha = validarSenhaEmpresa(senha);
    if (!polSenha.ok) {
      setErro(polSenha.error);
      return;
    }

    setLoading(true);
    setErro('');
    setSucessoData(null);
    try {
      const response = await apiFetch('/api/trial/ativar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        timeoutMs: 15000,
        body: JSON.stringify({
          cnpj: cnpj.replace(/\D/g, ''),
          nome_empresa: nomeEmpresa.trim(),
          google_review_url: googleUrl.trim() || undefined,
          email: email.trim().toLowerCase(),
          senha,
        }),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Erro ao processar ativação.'));
      }
      const data = await response.json();
      persistFiltraToken(data.token);
      const slugOrId = data.slug || data.empresa_id;
      setSucessoData({
        ...data,
        token: data.token,
        link_acesso:
          typeof window !== 'undefined' && slugOrId
            ? `${window.location.origin}/avaliacao/${slugOrId}`
            : data.link_acesso,
        link_painel:
          typeof window !== 'undefined' && slugOrId
            ? `${window.location.origin}/painel/${slugOrId}`
            : data.link_painel,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') setErro('Tempo de conexão esgotado. Tente novamente.');
      else if (err.name === 'ApiFailoverError')
        setErro('Servidores indisponíveis no momento. Tente novamente em instantes.');
      else
        setErro(
          err.message === 'Failed to fetch'
            ? 'Não foi possível conectar ao servidor. Verifique se a API está online.'
            : err.message
        );
    } finally {
      setLoading(false);
    }
  };

  const copiarParaTransferencia = async () => {
    if (!sucessoData) return;
    try {
      await navigator.clipboard.writeText(sucessoData.link_acesso);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      /* ignore */
    }
  };

  const baixarQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-avaliacao-${nomeEmpresa.replace(/\s+/g, '-').toLowerCase() || 'empresa'}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 font-sans text-zinc-100 gap-10">
      <header className="w-full max-w-5xl flex items-center justify-between px-1 pt-2">
        <BrandMark size="md" subtitle="Reputation" href="/" />
        <LanguageSwitcher />
      </header>

      {checkoutMsg && (
        <div className="w-full max-w-md bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-sm rounded-xl px-4 py-3 text-center">
          {checkoutMsg}
        </div>
      )}

      <div className="w-full max-w-md bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">{t.trial_title}</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">{t.trial_subtitle}</p>
        </div>

        {erro && (
          <div
            role="alert"
            className="flex items-center gap-3 bg-red-950/50 text-red-300 p-3.5 rounded-xl border border-red-900 text-sm"
          >
            <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
            <span>{erro}</span>
          </div>
        )}

        {!sucessoData ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="nome-empresa" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Building2 size={14} aria-hidden="true" /> {t.label_company}
              </label>
              <input id="nome-empresa" type="text" required value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} placeholder={t.ph_company} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cnpj" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <FileText size={14} aria-hidden="true" /> {t.label_tax_id}
              </label>
              <input id="cnpj" type="text" required inputMode={idioma === 'pt' ? 'numeric' : 'text'} value={cnpj} onChange={(e) => aplicarMascaraCnpj(e.target.value)} placeholder={t.ph_tax_id} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Mail size={14} aria-hidden="true" /> {t.label_email}
              </label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.ph_email} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="senha" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Lock size={14} aria-hidden="true" /> {t.label_password}
              </label>
              <input id="senha" type="password" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder={t.ph_password} className={inputCls} />
              <p className="text-[11px] text-zinc-500">{SENHA_EMPRESA_HINT}</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="google-url" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Link2 size={14} aria-hidden="true" /> {t.label_google}
              </label>
              <input id="google-url" type="url" value={googleUrl} onChange={(e) => setGoogleUrl(e.target.value)} placeholder={t.ph_google} className={inputCls} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-colors text-sm disabled:opacity-50 cursor-pointer">
              {loading ? t.processing : t.btn_activate_trial}
            </button>
            <p className="text-center text-xs text-zinc-500">
              <a href="/recuperar-senha" className="underline hover:text-indigo-400">{t.forgot_password}</a>
              {' · '}
              <a href="/login" className="underline hover:text-indigo-400">{t.have_account}</a>
            </p>
          </form>
        ) : (
          <div className="text-center space-y-4 py-2" aria-live="polite">
            <div className="mx-auto w-12 h-12 bg-emerald-950 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-800">
              <CheckCircle2 size={28} aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-zinc-100">{t.trial_success}</p>
            {qrDataUrl && (
              <div className="flex flex-col items-center gap-2 py-2">
                <img src={qrDataUrl} alt="QR" className="w-48 h-48 rounded-xl border border-zinc-700" />
                <p className="text-xs text-zinc-500">{t.qr_hint}</p>
              </div>
            )}
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs text-zinc-400 break-all select-all font-mono text-left">
              {sucessoData.link_acesso}
            </div>
            <div className="space-y-2 pt-1">
              <button onClick={copiarParaTransferencia} className="w-full bg-zinc-100 hover:bg-white text-black font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                <Copy size={16} /> {copiado ? t.link_copied : t.copy_link}
              </button>
              {qrDataUrl && (
                <button onClick={baixarQr} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 border border-zinc-700">
                  <Download size={16} /> {t.download_qr}
                </button>
              )}
              <a href={sucessoData.link_acesso} target="_blank" rel="noopener noreferrer" className="w-full bg-indigo-950 hover:bg-indigo-900 text-indigo-200 font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 border border-indigo-800">
                <ExternalLink size={16} /> {t.open_review_page}
              </a>
              {sucessoData.link_painel && (
                <a
                  href={
                    sucessoData.token
                      ? `${sucessoData.link_painel}${sucessoData.link_painel.includes('?') ? '&' : '?'}token=${encodeURIComponent(sucessoData.token)}`
                      : sucessoData.link_painel
                  }
                  className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  <LayoutDashboard size={16} /> {t.open_panel}
                </a>
              )}
            </div>
            <p className="text-xs text-zinc-500 pt-2">{t.trial_expires}</p>
          </div>
        )}
      </div>

      <div className="w-full max-w-5xl space-y-4">
        <h2 className="text-center text-sm font-medium text-zinc-400">
          {t.login_plans || t.plans || 'Planos disponíveis'}
        </h2>
        <PlanCards />
      </div>

      <footer className="pb-8 text-center">
        <p className="text-[11px] tracking-[0.2em] uppercase text-zinc-600">
          <span className="text-zinc-400">FILTRA</span>
          <span className="text-indigo-500/80">.AI</span>
        </p>
      </footer>
    </div>
  );
}
