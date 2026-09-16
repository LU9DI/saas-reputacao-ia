'use client';

import Link from 'next/link';
import { BrandMark } from '../components/BrandMark';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const SUPORTE = 'projetosaas1@gmail.com';

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between px-4 pt-6 pb-4">
        <BrandMark size="md" subtitle="Reputation" href="/" />
        <LanguageSwitcher />
      </header>
      <main className="max-w-3xl mx-auto px-4 pb-16 space-y-6 text-sm text-zinc-300 leading-relaxed">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Política de Privacidade</h1>
          <p className="text-zinc-400">FILTRA.AI — Versão 15 de setembro de 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-100">1. Controlador e contato</h2>
          <p>
            FILTRA.AI TECNOLOGIA LTDA., CNPJ 69.113.166/0001-10, Rua 12, nº 457, Setor Oeste, Goiânia/GO,
            CEP 74140-040. Contato de suporte e privacidade:{' '}
            <a href={`mailto:${SUPORTE}`} className="text-indigo-400 underline">
              {SUPORTE}
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-100">2. Dados tratados</h2>
          <p>
            Dados de cadastro da empresa (nome, e-mail, senha em hash), dados de uso da plataforma,
            feedbacks inseridos pelos clientes finais do CONTRATANTE, dados de pagamento processados por
            intermediadores (PayPal e Mercado Pago) e logs técnicos de segurança e aceite contratual.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-100">3. Finalidades</h2>
          <p>
            Prestação do serviço SaaS, autenticação, cobrança, suporte, segurança, cumprimento de obrigações
            legais e melhoria do produto com dados agregados e anonimizados, quando aplicável.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-100">4. Papéis (LGPD)</h2>
          <p>
            Em regra, o CONTRATANTE atua como Controlador dos dados dos titulares inseridos na plataforma e a
            FILTRA.AI como Operadora, nos limites das instruções e dos Termos de Uso.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-100">5. Compartilhamento</h2>
          <p>
            Provedores de hospedagem, banco de dados, e-mail, pagamentos (PayPal, Mercado Pago), observabilidade
            e, nos planos com IA, provedores de modelos. A lista de suboperadores pode ser atualizada e
            solicitada pelo e-mail de suporte.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-100">6. Direitos dos titulares</h2>
          <p>
            Acesso, correção, eliminação, portabilidade e demais direitos previstos na LGPD podem ser
            exercidos junto ao Controlador (empresa cliente) ou, quando a FILTRA.AI for Controladora, pelo
            e-mail de suporte.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-100">7. Retenção e segurança</h2>
          <p>
            Dados são mantidos pelo tempo necessário à prestação do serviço e às obrigações legais. São
            adotadas medidas técnicas e administrativas razoáveis; nenhum sistema é absolutamente imune a
            incidentes.
          </p>
        </section>

        <div className="flex flex-wrap gap-3 pt-4">
          <Link href="/termos" className="text-indigo-400 underline">
            Termos de Uso
          </Link>
          <Link href="/" className="text-zinc-400 underline">
            Início
          </Link>
        </div>
      </main>
    </div>
  );
}
