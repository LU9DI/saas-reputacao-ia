import type { Metadata } from 'next';
import { BlogArticle, H2 } from '../../components/BlogArticle';

export const metadata: Metadata = {
  title: 'Clínica e reputação online: checklist de avaliações Google',
  description:
    'Checklist para clínicas: quando pedir feedback, o que fazer com nota baixa e como manter velocity no Google Meu Negócio.',
  alternates: { canonical: '/blog/clinica-checklist-avaliacoes-google' },
};

export default function Page() {
  return (
    <BlogArticle
      kicker="Segmento · Clínicas"
      title="Clínica e reputação online: checklist de avaliações Google"
      lead="Paciente pesquisa nota antes de agendar. Um fluxo simples de feedback protege a agenda e a marca."
    >
      <H2>Checklist da recepção</H2>
      <p>
        Após a consulta: mensagem ou QR com link de avaliação. Tom acolhedor, sem exigir 5★. Registrar se o
        paciente já avaliou para não insistir.
      </p>
      <H2>Checklist da gestão</H2>
      <p>
        Revisar painel de feedbacks 1–3★ no mesmo dia. Classificar causa (espera, comunicação, resultado
        esperado). Definir dono da resposta.
      </p>
      <H2>Checklist do Google</H2>
      <p>
        Responder reviews públicas em até 48h. Manter fotos e horários do perfil atualizados. Acompanhar nota
        média mensal, não só o total acumulado.
      </p>
      <H2>Multi-unidade</H2>
      <p>
        Compare unidades no painel. O Filtra.AI nos planos Corporativo/Rei ajuda a ver onde a reputação
        escorrega antes de virar padrão de rede.
      </p>
    </BlogArticle>
  );
}
