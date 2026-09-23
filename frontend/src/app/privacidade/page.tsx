import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '../components/BrandMark';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const SUPORTE = 'projetosaas1@gmail.com';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Política de Privacidade da Filtra.AI, com informações sobre dados tratados, finalidades, LGPD, segurança, retenção, direitos dos titulares e compartilhamento.',
  alternates: { canonical: '/privacidade' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'article',
    url: '/privacidade',
    title: 'Política de Privacidade · Filtra.AI',
    description:
      'Saiba como a Filtra.AI trata dados pessoais, protege informações e atende aos direitos previstos na LGPD.',
  },
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between px-4 pt-6 pb-4">
        <BrandMark size="md" subtitle="Reputation" href="/" />
        <LanguageSwitcher />
      </header>
      <main className="max-w-3xl mx-auto px-4 pb-16 space-y-7 text-sm text-zinc-300 leading-relaxed">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Política de Privacidade</h1>
          <p className="text-zinc-400">FILTRA.AI — Versão 23 de setembro de 2026</p>
          <p className="text-zinc-400">
            Esta política explica como a Filtra.AI trata dados pessoais no site e na plataforma, de acordo com
            a legislação aplicável, incluindo a LGPD.
          </p>
        </div>

        <section className="space-y-3"><h2 className="text-base font-semibold text-zinc-100">1. Controlador e contato</h2><p>
          FILTRA.AI TECNOLOGIA LTDA., CNPJ 69.113.166/0001-10, Rua 12, nº 457, Setor Oeste, Goiânia/GO, CEP 74140-040.
          Para assuntos de privacidade e solicitações de titulares, utilize <a href={`mailto:${SUPORTE}`} className="text-indigo-400 underline">{SUPORTE}</a>.
        </p></section>

        <section className="space-y-3"><h2 className="text-base font-semibold text-zinc-100">2. Dados tratados</h2><p>
          Dependendo da utilização, podem ser tratados dados de cadastro da empresa, como nome, e-mail e senha armazenada
          em formato protegido; dados de uso; informações inseridas em avaliações e feedbacks; dados relacionados à
          assinatura e cobrança; registros de aceite; e informações técnicas, como logs, identificadores de sessão e
          eventos necessários à segurança e funcionamento do serviço.
        </p><p>
          Dados de pagamento podem ser processados diretamente por intermediadores de pagamento, conforme o método
          escolhido, sem que a Filtra.AI precise armazenar os dados completos do instrumento de pagamento.
        </p></section>

        <section className="space-y-3"><h2 className="text-base font-semibold text-zinc-100">3. Finalidades e bases legais</h2><p>
          Os dados podem ser utilizados para administrar contas, autenticar usuários, prestar o serviço SaaS, processar
          assinaturas e cobranças, prestar suporte, prevenir fraude e abuso, manter a segurança, cumprir obrigações legais
          e exercer direitos. Conforme o caso, o tratamento pode estar fundamentado na execução de contrato, cumprimento de
          obrigação legal ou regulatória, exercício regular de direitos, legítimo interesse ou consentimento, quando aplicável.
        </p></section>

        <section className="space-y-3"><h2 className="text-base font-semibold text-zinc-100">4. Papéis sob a LGPD</h2><p>
          Em regra, a empresa cliente define as finalidades dos dados de seus próprios clientes inseridos na plataforma e
          atua como Controladora, enquanto a FILTRA.AI atua como Operadora, dentro das instruções recebidas e dos limites
          contratuais. Para dados necessários à própria operação da Filtra.AI, como cadastro, faturamento, segurança e
          atendimento, a Filtra.AI poderá atuar como Controladora.
        </p></section>

        <section className="space-y-3"><h2 className="text-base font-semibold text-zinc-100">5. Compartilhamento e suboperadores</h2><p>
          Para operar a plataforma, a Filtra.AI pode utilizar provedores de hospedagem, banco de dados, infraestrutura,
          e-mail, pagamentos, observabilidade e serviços de inteligência artificial. Entre os provedores utilizados podem
          estar PayPal, Mercado Pago e fornecedores de modelos de IA, conforme a funcionalidade contratada.
        </p><p>
          O compartilhamento ocorre quando necessário à finalidade correspondente, por obrigação legal, proteção da
          plataforma ou execução do serviço. A relação de suboperadores pode ser atualizada e informações adicionais
          podem ser solicitadas pelo contato de privacidade.
        </p></section>

        <section className="space-y-3"><h2 className="text-base font-semibold text-zinc-100">6. Transferências internacionais</h2><p>
          Alguns fornecedores de infraestrutura, comunicação, pagamentos ou inteligência artificial podem processar dados
          fora do Brasil. Quando houver transferência internacional, serão adotadas as medidas e salvaguardas exigidas
          pela legislação aplicável, considerando a natureza do fornecedor e do tratamento.
        </p></section>

        <section className="space-y-3"><h2 className="text-base font-semibold text-zinc-100">7. Cookies e tecnologias semelhantes</h2><p>
          O site e a plataforma podem utilizar cookies, armazenamento local e tecnologias semelhantes para manter sessões,
          preservar preferências, melhorar a experiência e apoiar a segurança. Cookies estritamente necessários podem ser
          utilizados para o funcionamento do serviço. Quando houver tecnologias que dependam de consentimento, serão
          observados os requisitos aplicáveis.
        </p></section>

        <section className="space-y-3"><h2 className="text-base font-semibold text-zinc-100">8. Inteligência artificial</h2><p>
          Algumas funcionalidades podem utilizar modelos de inteligência artificial para analisar feedbacks, identificar
          temas, gerar relatórios ou auxiliar na elaboração de respostas. O uso de IA não elimina a responsabilidade do
          usuário pela revisão e utilização das informações geradas.
        </p><p>
          Quando dados pessoais forem enviados a um provedor de IA para executar uma funcionalidade contratada, o tratamento
          deverá observar as finalidades e salvaguardas aplicáveis ao serviço.
        </p></section>

        <section className="space-y-3"><h2 className="text-base font-semibold text-zinc-100">9. Retenção</h2><p>
          Os dados são mantidos pelo período necessário para prestar o serviço, cumprir obrigações legais, atender
          solicitações, resolver disputas, manter registros de segurança e exercer direitos. Após o término das finalidades,
          os dados poderão ser eliminados, anonimizados ou mantidos quando houver base legal para conservação.
        </p></section>

        <section className="space-y-3"><h2 className="text-base font-semibold text-zinc-100">10. Segurança</h2><p>
          São adotadas medidas técnicas e administrativas razoáveis para proteger os dados contra acesso não autorizado,
          perda, alteração, divulgação ou destruição indevida. Nenhum sistema conectado à internet é absolutamente imune
          a incidentes. Em caso de incidente relevante, serão adotadas as medidas de contenção, investigação, comunicação
          e cooperação exigidas pela legislação aplicável.
        </p></section>

        <section className="space-y-3"><h2 className="text-base font-semibold text-zinc-100">11. Direitos dos titulares</h2><p>
          Nos termos da LGPD e observados seus requisitos e exceções, os titulares podem solicitar confirmação de tratamento,
          acesso, correção, anonimização, bloqueio ou eliminação, portabilidade, informação sobre compartilhamentos e demais
          direitos previstos em lei.
        </p><p>
          Quando a FILTRA.AI atuar como Operadora, a solicitação deverá ser direcionada, em regra, à empresa cliente que
          atua como Controladora. Quando a FILTRA.AI atuar como Controladora, o pedido poderá ser encaminhado para {SUPORTE}.
        </p></section>

        <section className="space-y-3"><h2 className="text-base font-semibold text-zinc-100">12. Atualizações desta política</h2><p>
          Esta política pode ser atualizada para refletir mudanças no produto, nos fornecedores, na legislação ou nas
          práticas de tratamento. A versão vigente será publicada nesta página com sua respectiva data de atualização.
        </p></section>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link href="/termos" className="text-indigo-400 underline">Termos de Uso</Link>
          <Link href="/" className="text-zinc-400 underline">Início</Link>
        </div>
      </main>
    </div>
  );
}
