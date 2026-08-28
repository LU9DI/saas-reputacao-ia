'use client';

import { useState } from 'react';
import QRCode from 'qrcode';

export default function QrCodesPage() {
  const [tableNumber, setTableNumber] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const generateQrCode = async () => {
    if (!tableNumber) return alert('Por favor, digite o número da mesa!');

    try {
      // URL dinâmica usando variável de ambiente (Fallback para localhost)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const link = `${baseUrl}/review?table=${tableNumber}`;
      
      // Gera a imagem do QR Code em formato Base64
      const url = await QRCode.toDataURL(link, { 
        width: 350, 
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#111', fontSize: '28px', marginBottom: '10px' }}>🏆 Gerador de QR Codes - Mesas</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Gere e baixe os códigos visuais para colar nas mesas do estabelecimento.</p>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input
          type="number"
          placeholder="Nº da Mesa"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          style={{ 
            padding: '12px', 
            fontSize: '16px', 
            width: '130px', 
            borderRadius: '6px', 
            border: '1px solid #ccc' 
          }}
        />
        <button 
          onClick={generateQrCode} 
          style={{ 
            padding: '12px 24px', 
            fontSize: '16px', 
            backgroundColor: '#000', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            fontWeight: 'bold' 
          }}
        >
          Gerar Código
        </button>
      </div>

      {qrCodeUrl && (
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          border: '1px solid #eee', 
          borderRadius: '8px', 
          textAlign: 'center', 
          backgroundColor: '#fafafa' 
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Mesa {tableNumber}</h3>
          <img src={qrCodeUrl} alt="QR Code" style={{ border: '4px solid #fff', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          <br />
          <a 
            href={qrCodeUrl} 
            download={`mesa-${tableNumber}.png`} 
            style={{ 
              display: 'inline-block', 
              marginTop: '20px', 
              padding: '12px 24px', 
              backgroundColor: '#0070f3', 
              color: '#fff', 
              textDecoration: 'none', 
              borderRadius: '6px', 
              fontWeight: 'bold' 
            }}
          >
            📥 Baixar Imagem PNG
          </a>
        </div>
      )}
    </div>
  );
}

