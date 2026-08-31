'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { Building2, QrCode, RefreshCw, AlertCircle } from 'lucide-react';

interface Empresa {
  id: string;
  nome_empresa: string;
}

export default function QrCodesPage() {
  const router = useRouter();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Verifica token e carrega empresas
  useEffect(() => {
    const token = localStorage.getItem('token_saas_reputacao');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    const buscarEmpresas = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/admin/empresas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error();
        const dados = await response.json();
        setEmpresas(dados);
        if (dados.length > 0) {
          setEmpresaSelecionada(dados[0].id);
        }
      } catch {
        setErro('Não foi possível carregar as empresas. Verifique sua conexão.');
      }
    };

    buscarEmpresas();
  }, [router]);

  const handleGerarQrCode = async () => {
    setErro('');

    if (!empresaSelecionada) {
      setErro('Selecione uma empresa para gerar o QR Code.');
      return;
    }

    if (!tableNumber || Number(tableNumber) <= 0 || !Number.isInteger(Number(tableNumber))) {
      setErro('Número da mesa inválido. Use apenas números inteiros positivos.');
      return;
    }

    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const link = `${baseUrl}/avaliacao/${empresaSelecionada}?mesa=${tableNumber}`;

      const url = await QRCode.toDataURL(link, {
        width: 350,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      setQrCodeUrl(url);
    } catch {
      setErro('Erro ao gerar QR Code. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `mesa-${tableNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <QrCode size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gerador de QR Codes</h1>
            <p className="text-sm text-slate-500">Crie códigos para colar nas mesas do estabelecimento</p>
          </div>
        </div>

        {erro && (
          <div role="alert" className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="empresa" className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Building2 size={14} /> Empresa
            </label>
            <select
              id="empresa"
              value={empresaSelecionada}
              onChange={(e) => setEmpresaSelecionada(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm bg-slate-50/50"
            >
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nome_empresa}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="mesa" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Nº da Mesa
            </label>
            <input
              id="mesa"
              type="number"
              min="1"
              step="1"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Ex: 12"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm bg-slate-50/50"
            />
          </div>
        </div>

        <button
          onClick={handleGerarQrCode}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors text-sm shadow-md shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <QrCode size={16} />}
          {loading ? 'Gerando...' : 'Gerar QR Code'}
        </button>
        {qrCodeUrl && (
          <div className="text-center space-y-4 pt-4 border-t border-slate-200">
            <h3 className="font-semibold text-slate-800">QR Code - Mesa {tableNumber}</h3>
            <img
              src={qrCodeUrl}
              alt={`QR Code para mesa ${tableNumber}`}
              className="mx-auto rounded-lg border-4 border-white shadow-md"
            />
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-xl transition-colors text-sm cursor-pointer"
            >
              📥 Baixar Imagem PNG
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
