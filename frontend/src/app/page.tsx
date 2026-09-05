'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Globe,
  ExternalLink,
  Copy,
  Link2,
  Download,
  LayoutDashboard,
  Mail,
  Lock,
} from 'lucide-react';
import QRCode from 'qrcode';
import { getEnv } from './utils/env';
import { PlanCards } from './components/PlanCards';
import { validarSenhaEmpresa, SENHA_EMPRESA_HINT } from './utils/passwordPolicy';

const traducoes = {
  pt: {
    titulo: 'Ative seus 7 Dias Grátis',
    subtitulo: 'Cadastre a empresa com CNPJ, e-mail e senha. Sem cartão de crédito nos 7 dias de teste.',
    labelEmpresa: 'Nome da Empresa',
    placeholderEmpresa: 'Ex: Restaurante Sabor Único',
    labelCnpj: 'CNPJ / Tax ID',
    placeholderCnpj: '00.000.000/0000-00',
    labelEmail: 'E-mail de acesso',
    placeholderEmail: 'seu@email.com',
    labelSenha: 'Senha de acesso',
    placeholderSenha: 'Ex: Senha@12 (8+, maiúscula, números, especial)',
    labelGoogle: 'Link do Google Reviews (opcional)',
    placeholderGoogle: 'https://g.page/r/... ou link de avaliação',
    botao: 'Ativar Meu Período de Testes',
    carregando: 'Processando ativação...',
    sucesso: 'Parabéns! Seu trial foi ativado com sucesso.',
    copiarLink: 'Copiar Link Oficial',
    linkCopiado: 'Link copiado para a área de transferência!',
    abrirLink: 'Abrir Página de Avaliação',
    baixarQr: 'Baixar QR Code',
    abrirPainel: 'Abrir Meu Painel',
    avisoExpiracao: 'Seu acesso expira automaticamente em 7 dias se não houver assinatura.',
    cnpjInvalido: 'CNPJ inválido. Verifique os dígitos.',
    qrHint: 'Imprima e cole no balcão, cardápio ou embalagem.',
    planosTitulo: 'Quer continuar depois do teste de 7 dias?',
    esqueciSenha: 'Esqueci a senha',
  },
  en: {
    titulo: 'Activate Your 7-Day Free Trial',
    subtitulo: 'Register with company details, email and password. No credit card for the 7-day trial.',
    labelEmpresa: 'Company Name',
    placeholderEmpresa: 'Ex: Unique Flavor Restaurant',
    labelCnpj: 'Tax ID / Registration Number',
    placeholderCnpj: 'Numbers or Tax Registration',
    labelEmail: 'Access email',
    placeholderEmail: 'you@email.com',
    labelSenha: 'Password',
    placeholderSenha: 'Ex: Password@12 (8+, upper, number, special)',
    labelGoogle: 'Google Reviews link (optional)',
    placeholderGoogle: 'https://g.page/r/... or review link',
    botao: 'Activate My Free Trial',
    carregando: 'Processing activation...',
    sucesso: 'Congratulations! Your trial has been successfully activated.',
    copiarLink: 'Copy Official Link',
    linkCopiado: 'Link copied to clipboard!',
    abrirLink: 'Open Review Page',
    baixarQr: 'Download QR Code',
    abrirPainel: 'Open My Dashboard',
    avisoExpiracao: 'Your access automatically expires in 7 days without a subscription.',
    cnpjInvalido: 'Invalid Tax ID. Please check the information.',
    qrHint: 'Print and place on the counter, menu or packaging.',
    planosTitulo: 'Want to continue after the 7-day test?',
    esqueciSenha: 'Forgot password',
  },
  es: {
    titulo: 'Activa tus 7 Días Gratis',
    subtitulo: 'Registra la empresa con CNPJ, correo y contraseña. Sin tarjeta en los 7 días de prueba.',
    labelEmpresa: 'Nombre de la Empresa',
    placeholderEmpresa: 'Ej: Restaurante Sabor Único',
    labelCnpj: 'Identificación Fiscal / Tax ID',
    placeholderCnpj: 'Ingrese solo números o ID fiscal',
    labelEmail: 'Correo de acceso',
    placeholderEmail: 'tu@email.com',
    labelSenha: 'Contraseña',
    placeholderSenha: 'Ej: Clave@12 (8+, mayúscula, número, especial)',
    labelGoogle: 'Enlace de Google Reviews (opcional)',
    placeholderGoogle: 'https://g.page/r/... o enlace de opiniones',
    botao: 'Activar Mi Período de Prueba',
    carregando: 'Procesando activación...',
    sucesso: '¡Felicitaciones! Tu prueba ha sido activada con éxito.',
    copiarLink: 'Copiar Enlace Oficial',
    linkCopiado: '¡Enlace copiado al portapapeles!',
    abrirLink: 'Abrir Página de Opiniones',
    baixarQr: 'Descargar Código QR',
    abrirPainel: 'Abrir Mi Panel',
    avisoExpiracao: 'Tu acceso expira automáticamente en 7 días sin una suscripción.',
    cnpjInvalido: 'Identificación fiscal inválida. Verifique los dígitos.',
    qrHint: 'Imprime y coloca en el mostrador, menú o empaque.',
    planosTitulo: '¿Quieres continuar después de la prueba?',
    esqueciSenha: 'Olvidé la contraseña',
  },
};

type Idioma = 'pt' | 'en' | 'es';

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

export default function Home() {
  const [idioma, setIdioma] = useState<Idioma>('pt');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucessoData, setSucessoData] = useState<{ link_acesso: string; link_painel?: string; empresa_id?: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [checkoutMsg, setCheckoutMsg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const langs = navigator.languages || [navigator.language || (navigator as any).userLanguage];
      const lang = langs.find((l) => l.startsWith('en') || l.startsWith('es') || l.startsWith('pt'));
      if (lang?.startsWith('en')) setIdioma('en');
      else if (lang?.startsWith('es')) setIdioma('es');
      else setIdioma('pt');
      const q = new URLSearchParams(window.location.search);
      if (q.get('checkout') === 'success') setCheckoutMsg('Pagamento recebido. Seu plano será ativado em instantes.');
      if (q.get('checkout') === 'cancel') setCheckoutMsg('Checkout cancelado. Você pode tentar de novo quando quiser.');
    }
  }, []);

  useEffect(() => {
    if (!sucessoData?.link_acesso) { setQrDataUrl(null); return; }
    QRCode.toDataURL(sucessoData.link_acesso, { width: 280, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
      .then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [sucessoData]);

  const t = traducoes[idioma];

  const aplicarMascaraCnpj = (valor: string) => {
    if (idioma !== 'pt') { setCnpj(valor); return; }
    const apenasNumeros = valor.replace(/\D/g, '').substring(0, 14);
    let mascarado = apenasNumeros;
    if (mascarado.length > 2) mascarado = `${mascarado.substring(0, 2)}.${mascarado.substring(2)}`;
    if (mascarado.length > 6) mascarado = `${mascarado.substring(0, 6)}.${mascarado.substring(6)}`;
    if (mascarado.length > 10) mascarado = `${mascarado.substring(0, 10)}/${mascarado.substring(10)}`;
    if (mascarado.length > 15) mascarado = `${mascarado.substring(0, 15)}-${mascarado.substring(15)}`;
    setCnpj(mascarado);
  };

  const validarCnpjInput = (valor: string): boolean => {
    const numeros = valor.replace(/\D/g, '');
    if (idioma === 'pt') return cnpjValido(numeros);
    return numeros.length >= 5;
  };

  const handleIdiomaChange = (novo: Idioma) => {
    setIdioma(novo);
    if (novo !== 'pt') setCnpj(cnpj.replace(/\D/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarCnpjInput(cnpj)) { setErro(t.cnpjInvalido); return; }
    if (!email.trim() || !email.includes('@')) { setErro('Informe um e-mail válido.'); return; }
    const polSenha = validarSenhaEmpresa(senha);
    if (!polSenha.ok) { setErro(polSenha.error); return; }

    setLoading(true); setErro(''); setSucessoData(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const apiUrl = getEnv('NEXT_PUBLIC_API_URL');
      const response = await fetch(`${apiUrl}/api/trial/ativar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cnpj: cnpj.replace(/\D/g, ''),
          nome_empresa: nomeEmpresa.trim(),
          google_review_url: googleUrl.trim() || undefined,
          email: email.trim().toLowerCase(),
          senha,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao processar ativação.');
      setSucessoData(data);
    } catch (err: any) {
      if (err.name === 'AbortError') setErro('Tempo de conexão esgotado. Tente novamente.');
      else setErro(err.message === 'Failed to fetch' ? 'Não foi possível conectar ao servidor. Verifique se a API está online.' : err.message);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const copiarParaTransferencia = async () => {
    if (!sucessoData) return;
    try {
      await navigator.clipboard.writeText(sucessoData.link_acesso);
      setCopiado(true); setTimeout(() => setCopiado(false), 3000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = sucessoData.link_acesso;
      document.body.appendChild(textArea); textArea.select(); document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiado(true); setTimeout(() => setCopiado(false), 3000);
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans text-slate-800 gap-10">
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
        <Globe size={16} className="text-slate-500" aria-hidden="true" />
        <select value={idioma} onChange={(e) => handleIdiomaChange(e.target.value as Idioma)} aria-label="Selecionar idioma" className="bg-transparent text-sm font-medium outline-none cursor-pointer">
          <option value="pt">Português (BR)</option>
          <option value="en">English (US)</option>
          <option value="es">Español</option>
        </select>
      </div>

      {checkoutMsg && (
        <div className="w-full max-w-md bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm rounded-xl px-4 py-3 text-center">{checkoutMsg}</div>
      )}

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.titulo}</h1>
          <p className="text-sm text-slate-500 leading-relaxed">{t.subtitulo}</p>
        </div>

        {erro && (
          <div role="alert" className="flex items-center gap-3 bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-100 text-sm">
            <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
            <span>{erro}</span>
          </div>
        )}

        {!sucessoData ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="nome-empresa" className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Building2 size={14} aria-hidden="true" /> {t.labelEmpresa}
              </label>
              <input id="nome-empresa" type="text" required value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} placeholder={t.placeholderEmpresa} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50/50" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cnpj" className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <FileText size={14} aria-hidden="true" /> {t.labelCnpj}
              </label>
              <input id="cnpj" type="text" required inputMode={idioma === 'pt' ? 'numeric' : 'text'} value={cnpj} onChange={(e) => aplicarMascaraCnpj(e.target.value)} placeholder={t.placeholderCnpj} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50/50" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Mail size={14} aria-hidden="true" /> {t.labelEmail}
              </label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.placeholderEmail} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50/50" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="senha" className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Lock size={14} aria-hidden="true" /> {t.labelSenha}
              </label>
              <input id="senha" type="password" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder={t.placeholderSenha} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50/50" />
              <p className="text-[11px] text-slate-400">{SENHA_EMPRESA_HINT}</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="google-url" className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Link2 size={14} aria-hidden="true" /> {t.labelGoogle}
              </label>
              <input id="google-url" type="url" value={googleUrl} onChange={(e) => setGoogleUrl(e.target.value)} placeholder={t.placeholderGoogle} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50/50" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors text-sm shadow-md shadow-indigo-100 disabled:opacity-50 cursor-pointer">
              {loading ? t.carregando : t.botao}
            </button>
            <p className="text-center text-xs text-slate-500">
              <a href="/recuperar-senha" className="underline hover:text-indigo-600">{t.esqueciSenha}</a>
              {' · '}
              <a href="/login" className="underline hover:text-indigo-600">Já tenho conta</a>
            </p>
          </form>
        ) : (
          <div className="text-center space-y-4 py-2" aria-live="polite">
            <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 border border-green-100">
              <CheckCircle2 size={28} aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-slate-900">{t.sucesso}</p>
            {qrDataUrl && (
              <div className="flex flex-col items-center gap-2 py-2">
                <img src={qrDataUrl} alt="QR Code de avaliação" className="w-48 h-48 rounded-xl border border-slate-200" />
                <p className="text-xs text-slate-400">{t.qrHint}</p>
              </div>
            )}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 break-all select-all font-mono text-left">{sucessoData.link_acesso}</div>
            <div className="space-y-2 pt-1">
              <button onClick={copiarParaTransferencia} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                <Copy size={16} /> {t.copiarLink}
              </button>
              {qrDataUrl && (
                <button onClick={baixarQr} className="w-full bg-white hover:bg-slate-50 text-slate-800 font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 border border-slate-200">
                  <Download size={16} /> {t.baixarQr}
                </button>
              )}
              <a href={sucessoData.link_acesso} target="_blank" rel="noopener noreferrer" className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                <ExternalLink size={16} /> {t.abrirLink}
              </a>
              {sucessoData.link_painel && (
                <a href={sucessoData.link_painel} className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                  <LayoutDashboard size={16} /> {t.abrirPainel}
                </a>
              )}
            </div>
            {copiado && <p className="text-xs text-green-600 font-semibold">{t.linkCopiado}</p>}
            <p className="text-xs text-slate-400 italic pt-2">{t.avisoExpiracao}</p>
          </div>
        )}
      </div>

      <div className="w-full px-2 pb-10">
        <p className="text-center text-sm font-medium text-slate-600 mb-4">{t.planosTitulo}</p>
        <PlanCards empresaId={sucessoData?.empresa_id} requireEmpresa={false} />
      </div>
    </div>
  );
}
