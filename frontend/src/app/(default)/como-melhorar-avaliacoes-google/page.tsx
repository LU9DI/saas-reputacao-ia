import type { Metadata } from 'next';
import { SeoLanding } from '../../components/SeoLanding';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Como melhorar avaliações Google de uma empresa',
  description:
    'Estratégias práticas para aumentar o volume de avaliações Google honestas, entender feedback e melhorar a experiência do cliente.',
  alternates: {
    canonical: 'https://filtraai.com/como-melhorar-avaliacoes-google',
    languages: {
      'pt-BR': 'https://filtraai.com/como-melhorar-avaliacoes-google',
      en: 'https://filtraai.com/en/improve-google-reviews',
      es: 'https://filtraai.com/es/mejorar-resenas-google',
      'x-default': 'https://filtraai.com/como-melhorar-avaliacoes-google',
    },
  },
  };
}

export default function Page() {
  return (
    <SeoLanding
      h1="Como melhorar as avaliações Google da sua empresa"
      lead="Melhorar a reputação começa pela experiência e por um processo consistente de coleta de feedback. Veja como transformar esse processo em rotina."
      breadcrumbHref="/como-melhorar-avaliacoes-google"
      contextLinks={[
        { href: '/filtra-ai', title: 'Filtra.AI', description: 'Gestão de reputação, avaliações Google e feedback com IA.' },
        { href: '/avaliacoes-google', title: 'Avaliações Google', description: 'Organize avaliações e feedback.' },
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Estruture uma rotina contínua.' },
        { href: '/blog/whatsapp-pedir-estrela-vs-filtrar-qr', title: 'WhatsApp ou QR Code para pedir avaliações', description: 'Compare canais e escolha o que reduz fricção sem pressionar o cliente.' },
        { href: '/blog/qr-code-balcao-reviews', title: 'QR Code no balcão', description: 'Veja como colocar o convite no ponto de contato da experiência.' },
      ]}
      sections={[
        { heading: 'Comece pela experiência', body: 'Mais pedidos de avaliação não compensam problemas recorrentes. Antes de acelerar a coleta, identifique os pontos da jornada que mais geram atrito.' },
        { heading: 'Reduza a fricção para avaliar', body: 'Links diretos, QR codes e chamadas no momento certo tornam o processo simples para quem já decidiu compartilhar a experiência.' },
        { heading: 'Peça no momento adequado', body: 'O melhor momento é aquele em que a experiência ainda está fresca, sem pressão e sem condicionar benefícios a uma nota positiva.' },
        { heading: 'Use críticas como sinal operacional', body: 'Quando um problema aparece repetidamente, registre o tema, encaminhe para o responsável e acompanhe se o padrão diminui nas avaliações seguintes.' },
        { heading: 'Meça qualidade além de volume', body: 'Quantidade é útil, mas também importa a consistência dos temas, a diversidade dos comentários e a evolução da percepção ao longo do tempo.' },
        { heading: 'Peça a todos, sem selecionar pela nota', body: 'O convite deve alcançar clientes reais de forma ampla, não apenas quem demonstrou satisfação. Selecionar clientes pela nota esperada distorce a amostra e pode contrariar as políticas das plataformas. Se a empresa quer tratar um problema, ofereça um canal privado sem impedir que o cliente publique sua opinião.' },
        { heading: 'O que evitar no convite', body: 'Evite comprar avaliações, criar perfis falsos, oferecer brindes ou descontos em troca de nota, pressionar durante o atendimento e prometer benefícios para quem avaliar. Também vale evitar mensagens genéricas em massa: um convite claro, no momento certo, tende a gerar comentários mais úteis.' },
        { heading: 'Como medir se a rotina funcionou', body: 'Acompanhe volume novo de avaliações, proporção de avaliações respondidas, temas recorrentes e evolução da percepção em períodos comparáveis. A nota média isolada pode esconder mudanças: um tema crítico pode cair sem que a média se mova muito. Registre as ações e observe as avaliações seguintes.' },
      ]}
      faq={[
        {
          question: 'Posso oferecer desconto ou brinde por uma avaliação Google?',
          answer: 'Não é uma boa prática e pode contrariar as políticas do Google. O convite deve ser voluntário e não condicionado a uma nota ou benefício. Avaliações incentivadas artificialmente também reduzem a confiança de quem lê.',
        },
        {
          question: 'Devo pedir avaliação apenas para clientes satisfeitos?',
          answer: 'Não selecione clientes pela nota esperada. Peça a todos os clientes reais, com um caminho simples e sem pressão. Se houver insatisfação, ofereça um canal privado para resolver, mas não impeça a pessoa de publicar uma avaliação honesta.',
        },
        {
          question: 'Quantas avaliações devo tentar conseguir por mês?',
          answer: 'Não existe um número universal. O volume depende da quantidade de clientes, da capacidade de atendimento e da experiência oferecida. Uma cadência consistente e sustentável é mais útil do que picos artificiais.',
        },
      ]}
    />
  );
}
