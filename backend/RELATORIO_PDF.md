# Relatório PDF (legado)

> **Status:** legado. O painel atual usa **relatório inteligente em texto**, enviado por WhatsApp, SMS, e-mail ou WeChat (`RelatorioInteligentePanel` + rotas de destinatários/envio).

O gerador PDF (`relatorioPdf.ts`, rota `GET /api/empresa/:ref/relatorio.pdf`) permanece no código para compatibilidade e testes internos. **Não expanda** essa rota no produto principal.

## Se precisar do PDF de novo

- Layout: `backend/relatorioPdf.ts`
- i18n labels: `backend/lib/pdfI18n.ts`
- Cache: `backend/lib/pdfCache.js`
- Planos com PDF: `planTemPdf` em `lib/plans.ts`

## Fluxo atual (recomendado)

1. Cliente escolhe canais e destinos no painel
2. `PUT /api/empresa/:id/relatorio/destinatarios`
3. `POST /api/empresa/:id/relatorio/enviar` com `{ mes, lang, destinatarios }`
4. Backend monta texto (0 tokens de IA) e despacha via n8n / SMTP / etc.
