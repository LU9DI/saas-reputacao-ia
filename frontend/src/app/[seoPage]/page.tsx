import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SeoLanding } from '../components/SeoLanding';
import { OG_IMAGE_META } from '../lib/socialMetadata';

type SeoPage = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  sections: { heading: string; body: string }[];
  faq: { question: string; answer: string }[];
};

const PAGES: SeoPage[] = [
  {
    slug: 'software-gestao-avaliacoes-google',
    title: 'Software para gestão de avaliações Google | Filtra.AI',
    description: 'Organize avaliações Google, acompanhe temas recorrentes e transforme feedback em prioridades operacionais com o Filtra.AI.',
    h1: 'Software para gestão de avaliações Google',
    lead: 'Quando as avaliações ficam espalhadas entre perfis, planilhas e conversas internas, a equipe perde contexto. O Filtra.AI ajuda a transformar feedback em uma rotina de análise e melhoria.',
    sections: [
      { heading: 'O que avaliar antes de escolher um software', body: 'Confira se a solução se encaixa no volume de avaliações, no número de responsáveis e na rotina real da equipe. Defina quem acompanha os novos comentários, quem investiga problemas e como as ações serão revisadas.' },
      { heading: 'Mais do que acompanhar a nota', body: 'A média resume a percepção em um número, mas não explica o motivo. Agrupe temas como atendimento, prazo, ambiente, qualidade e comunicação para identificar problemas recorrentes e pontos fortes que merecem ser preservados.' },
      { heading: 'Como começar sem interromper a operação', body: 'Escolha uma unidade ou período de teste, registre os principais temas e combine uma revisão semanal. Um piloto pequeno permite verificar aderência e valor antes de mudar processos em toda a empresa.' },
      { heading: 'Transforme análise em ação', body: 'Cada padrão identificado deve ter um responsável, uma ação possível e uma data para revisão. Sem esse passo, relatórios viram apenas mais uma tela; com acompanhamento, feedback passa a orientar decisões.' },
    ],
    faq: [
      { question: 'Um software de avaliações garante mais estrelas?', answer: 'Não. Uma ferramenta pode ajudar a organizar sinais e melhorar processos, mas a nota depende da experiência real dos clientes e não há garantia de resultado ou de posição no Google.' },
      { question: 'Como comparar soluções de gestão de avaliações?', answer: 'Compare fontes de dados compatíveis, facilidade de uso, análise de temas, colaboração entre responsáveis, exportação de dados, suporte e custo total. Valide as funções em um piloto antes de contratar.' },
      { question: 'Por onde começar?', answer: 'Escolha uma unidade, defina três temas prioritários e acompanhe se a equipe consegue transformar os sinais em ações verificáveis durante o período de teste.' },
    ],
  },
  {
    slug: 'software-reputacao-online',
    title: 'Software de gestão de reputação online | Filtra.AI',
    description: 'Conheça uma abordagem prática para organizar avaliações, feedback de clientes e prioridades de reputação online.',
    h1: 'Software de gestão de reputação online',
    lead: 'Reputação não é apenas uma nota pública. Ela reúne experiências, expectativas e a forma como a empresa responde aos problemas. Um processo consistente começa por organizar esses sinais.',
    sections: [
      { heading: 'Reúna sinais que hoje ficam dispersos', body: 'Comentários públicos, pesquisas e mensagens de atendimento podem contar partes diferentes da mesma experiência. Estabeleça uma rotina para registrar os temas recorrentes e encaminhar cada assunto à equipe que pode agir.' },
      { heading: 'Encontre causas, não apenas sintomas', body: 'Uma sequência de reclamações sobre demora pode apontar para capacidade, comunicação ou processo. Leia os comentários no contexto, compare períodos equivalentes e evite concluir que um caso isolado representa toda a operação.' },
      { heading: 'Crie uma cadência de gestão', body: 'Revise os sinais semanalmente, priorize problemas por frequência e impacto, atribua responsáveis e acompanhe se as ações foram concluídas. Compartilhe também os elogios para entender quais práticas funcionam.' },
      { heading: 'Avalie o progresso com indicadores claros', body: 'Acompanhe volume e recência de avaliações, temas recorrentes, tempo de resposta quando mensurável e ações concluídas. Combine indicadores quantitativos com leitura qualitativa para evitar decisões baseadas em uma única métrica.' },
    ],
    faq: [
      { question: 'Gestão de reputação online é só responder avaliações?', answer: 'Não. Responder com respeito é importante, mas o processo também inclui identificar padrões, encaminhar problemas, reconhecer boas práticas e acompanhar melhorias.' },
      { question: 'Uma ferramenta substitui o atendimento?', answer: 'Não. A tecnologia organiza informação e pode acelerar análises; a equipe continua responsável por investigar os fatos e resolver situações com contexto.' },
      { question: 'Quanto tempo leva para ver mudanças?', answer: 'Depende do volume de feedback, da capacidade de execução e da natureza dos problemas. Defina uma linha de base e acompanhe tendências ao longo de períodos comparáveis, sem prometer prazos universais.' },
    ],
  },
  {
    slug: 'responder-avaliacoes-google',
    title: 'Como organizar respostas às avaliações Google | Filtra.AI',
    description: 'Monte um processo para responder avaliações Google com consistência, contexto e foco em resolver a experiência do cliente.',
    h1: 'Como organizar respostas às avaliações Google',
    lead: 'Respostas úteis não são textos genéricos copiados em série. Elas reconhecem o que a pessoa relatou, evitam expor dados privados e indicam um próximo passo realista.',
    sections: [
      { heading: 'Classifique antes de responder', body: 'Separe elogios, dúvidas, reclamações operacionais e casos sensíveis. Uma crítica sobre cobrança exige um encaminhamento diferente de um comentário sobre horário ou atendimento.' },
      { heading: 'Use uma estrutura simples', body: 'Agradeça o retorno, reconheça o ponto específico, explique o que pode ser verificado e convide a continuar em um canal privado quando houver dados pessoais. Não confirme informações de conta ou atendimento publicamente.' },
      { heading: 'Evite respostas que pioram o problema', body: 'Não discuta, não culpe o cliente, não publique informações pessoais e não prometa uma solução antes de verificar os fatos. Em críticas legítimas, uma resposta defensiva pode ampliar a percepção negativa.' },
      { heading: 'Feche o ciclo internamente', body: 'Registrar a causa e acompanhar a correção é tão importante quanto publicar uma resposta. Se o mesmo tema reaparece, revise o processo em vez de apenas trocar o texto usado na resposta.' },
    ],
    faq: [
      { question: 'Devo responder todas as avaliações?', answer: 'Procure manter uma rotina consistente e priorize casos recentes, dúvidas e reclamações que precisam de encaminhamento. As respostas devem ser humanas, específicas e compatíveis com a situação.' },
      { question: 'Posso usar IA para rascunhar respostas?', answer: 'IA pode ajudar a preparar um rascunho, mas uma pessoa deve revisar fatos, tom, privacidade e compromissos antes de publicar.' },
      { question: 'Como responder uma avaliação injusta?', answer: 'Mantenha a calma, não revele dados privados e responda apenas ao que pode ser verificado. Se houver violação das políticas da plataforma, avalie os canais oficiais de denúncia, sem depender da remoção como única solução.' },
    ],
  },
  {
    slug: 'gestao-avaliacoes-multiplas-unidades',
    title: 'Gestão de avaliações para empresas com várias unidades | Filtra.AI',
    description: 'Compare padrões de feedback entre filiais sem perder o contexto local. Estruture prioridades, responsáveis e acompanhamento por unidade.',
    h1: 'Gestão de avaliações para empresas com várias unidades',
    lead: 'Em redes com várias filiais, uma média consolidada esconde diferenças importantes. A gestão precisa mostrar o panorama da marca e, ao mesmo tempo, apontar onde cada unidade pode agir.',
    sections: [
      { heading: 'Compare unidades com critérios consistentes', body: 'Use períodos equivalentes e considere diferenças de volume, perfil de público e sazonalidade. Uma classificação única pode destacar prioridades, mas não explica sozinha as causas por trás de cada resultado.' },
      { heading: 'Separe padrões da rede de problemas locais', body: 'Se um tema aparece em várias unidades, pode exigir uma mudança central. Se aparece em uma única filial, a resposta talvez esteja em treinamento, escala, infraestrutura ou execução local.' },
      { heading: 'Defina responsabilidade sem burocracia', body: 'Atribua um responsável local e um ponto focal central. Combine como registrar ações, quando escalar um risco e em qual reunião os temas recorrentes serão revisados.' },
      { heading: 'Transforme comparação em melhoria', body: 'Use as unidades com bons resultados para investigar práticas que podem ser replicadas, sem presumir que uma ação funciona igualmente em todos os contextos. Teste, adapte e acompanhe o resultado.' },
    ],
    faq: [
      { question: 'É justo comparar todas as filiais pela nota média?', answer: 'Não isoladamente. Volume, sazonalidade, perfil dos clientes e contexto operacional afetam a leitura. Combine a nota com temas, recência e ações concluídas.' },
      { question: 'Quem deve responder avaliações de uma rede?', answer: 'Defina uma política comum de tom e privacidade, mas deixe claro quem pode responder em cada unidade e quando um caso deve ser escalado.' },
      { question: 'Como encontrar problemas que se repetem em várias unidades?', answer: 'Classifique comentários por tema e período, procure recorrências e valide a hipótese com as equipes locais antes de mudar o processo central.' },
    ],
  },
  {
    slug: 'relatorios-reputacao-online',
    title: 'Relatório de reputação online: o que acompanhar | Filtra.AI',
    description: 'Saiba quais indicadores e temas incluir em um relatório de reputação para orientar decisões, não apenas apresentar gráficos.',
    h1: 'Relatórios de reputação online que ajudam a decidir',
    lead: 'Um relatório útil responde três perguntas: o que mudou, por que isso pode ter acontecido e qual ação será tomada. Mais gráficos não significam, necessariamente, mais clareza.',
    sections: [
      { heading: 'Indicadores básicos', body: 'Acompanhe volume de avaliações, distribuição de notas, recência, temas recorrentes e proporção de comentários respondidos quando esses dados estiverem disponíveis. Defina período e fonte para que comparações sejam reproduzíveis.' },
      { heading: 'Inclua evidências qualitativas', body: 'Duas operações com a mesma nota podem ter problemas completamente diferentes. Use exemplos representativos, retire dados pessoais e explique o contexto sem transformar comentários isolados em tendências.' },
      { heading: 'Compare períodos equivalentes', body: 'Considere sazonalidade, mudanças de volume e acontecimentos operacionais. Uma variação mensal pode refletir uma amostra pequena, então sinalize limitações e evite conclusões precipitadas.' },
      { heading: 'Termine com plano de ação', body: 'Para cada prioridade, registre evidência, responsável, ação e data de revisão. No relatório seguinte, verifique se a ação foi executada e se o sinal mudou.' },
    ],
    faq: [
      { question: 'Qual é o melhor indicador de reputação?', answer: 'Não existe um único indicador suficiente. Combine tendências de avaliação com temas, volume, recência e evidências operacionais.' },
      { question: 'Com que frequência devo gerar o relatório?', answer: 'A frequência depende do volume e da capacidade de resposta. Uma revisão semanal pode servir para operações ativas, enquanto a visão executiva pode ser mensal; valide o ritmo com os responsáveis.' },
      { question: 'Uma nota maior significa melhor SEO local?', answer: 'Não necessariamente. A visibilidade local depende de vários fatores e não deve ser inferida apenas pela nota média.' },
    ],
  },
  {
    slug: 'monitorar-avaliacoes-google',
    title: 'Como monitorar avaliações Google com consistência | Filtra.AI',
    description: 'Crie uma rotina de monitoramento de avaliações Google para detectar temas recorrentes, reclamações recentes e oportunidades de melhoria.',
    h1: 'Como monitorar avaliações Google com consistência',
    lead: 'Monitorar não é apenas olhar a nota de vez em quando. É perceber mudanças, entender a causa provável e garantir que a informação chegue a quem pode agir.',
    sections: [
      { heading: 'Defina o que merece atenção', body: 'Combine critérios como reclamações recentes, repetição de um tema, risco à segurança, dúvidas sem resposta e mudanças inesperadas no volume. A prioridade deve refletir impacto, não apenas a nota atribuída.' },
      { heading: 'Crie uma rotina compatível com o volume', body: 'Determine quem verifica novos comentários e em qual frequência. Em períodos de maior movimento, aumente a cadência; em operações menores, uma rotina agendada pode evitar que o monitoramento dependa da memória de alguém.' },
      { heading: 'Encaminhe o sinal para a equipe certa', body: 'Feedback sobre atendimento, produto, cobrança e infraestrutura costuma exigir responsáveis diferentes. Classificar e encaminhar reduz a chance de a mesma reclamação circular sem solução.' },
      { heading: 'Meça o fechamento do ciclo', body: 'Além de registrar o comentário, acompanhe se houve investigação, resposta quando apropriada e correção operacional. A recorrência do mesmo tema é um sinal para revisar a solução adotada.' },
    ],
    faq: [
      { question: 'Monitorar avaliações significa responder em tempo real?', answer: 'Não necessariamente. A cadência deve refletir volume e risco. Casos sensíveis podem exigir atenção imediata, enquanto outros podem seguir uma rotina definida.' },
      { question: 'Devo olhar apenas avaliações negativas?', answer: 'Não. Elogios revelam práticas que funcionam e dúvidas recorrentes mostram oportunidades para melhorar a comunicação.' },
      { question: 'Como evitar alertas demais?', answer: 'Agrupe temas, defina níveis de prioridade e revise regras quando a equipe recebe sinais demais sem conseguir agir.' },
    ],
  },
  {
    slug: 'analise-sentimento-avaliacoes',
    title: 'Análise de sentimento em avaliações de clientes | Filtra.AI',
    description: 'Entenda como combinar sentimento, temas e contexto para interpretar avaliações de clientes com mais precisão.',
    h1: 'Análise de sentimento em avaliações de clientes',
    lead: 'Classificar um comentário como positivo ou negativo é só o começo. Para decidir o que fazer, a equipe precisa entender o tema, o contexto e a intensidade do problema relatado.',
    sections: [
      { heading: 'Sentimento não é diagnóstico', body: 'Um texto positivo pode apontar uma falha importante, e uma crítica pode conter elogios a outras partes da experiência. Leia sentimento junto com assunto, recorrência e contexto.' },
      { heading: 'Agrupe temas úteis à operação', body: 'Categorias como atendimento, prazo, qualidade, ambiente, cobrança e comunicação ajudam a encaminhar cada sinal. Adapte as categorias ao negócio em vez de usar uma taxonomia genérica para tudo.' },
      { heading: 'Revise ambiguidades', body: 'Ironia, abreviações e frases curtas podem confundir classificadores automáticos. Faça amostragens manuais, registre erros e mantenha supervisão humana para decisões sensíveis.' },
      { heading: 'Converta padrões em hipóteses testáveis', body: 'Quando um tema cresce, investigue período, unidade e processo relacionado. Trate a análise como evidência para formular uma hipótese, não como prova automática da causa.' },
    ],
    faq: [
      { question: 'A análise por IA é sempre correta?', answer: 'Não. Modelos podem errar em ironia, ambiguidade e contexto. Revise amostras e mantenha uma pessoa responsável por decisões importantes.' },
      { question: 'Sentimento positivo é igual a satisfação?', answer: 'Não. O tom do texto é apenas um sinal. Considere o assunto, a expectativa do cliente e o contexto da experiência.' },
      { question: 'Como começar a análise?', answer: 'Escolha um conjunto representativo de comentários, defina temas relevantes, valide a classificação manualmente e use os resultados para priorizar investigações.' },
    ],
  },
  {
    slug: 'pesquisa-satisfacao-clientes',
    title: 'Pesquisa de satisfação de clientes: como agir sobre respostas | Filtra.AI',
    description: 'Estruture pesquisas de satisfação com perguntas claras, leitura de padrões e um processo para fechar o ciclo com os clientes.',
    h1: 'Pesquisa de satisfação de clientes que leva a ações',
    lead: 'Coletar respostas sem agir desgasta a confiança. Uma pesquisa útil começa com uma pergunta clara e termina com uma decisão, uma comunicação ou uma melhoria verificável.',
    sections: [
      { heading: 'Faça perguntas que gerem decisão', body: 'Evite questionários longos quando uma pergunta objetiva resolve a dúvida. Pergunte sobre uma etapa específica da experiência e deixe espaço para contexto quando isso ajudar a entender o motivo da resposta.' },
      { heading: 'Combine escala e comentário aberto', body: 'Uma nota facilita comparar respostas; o comentário explica o que a pessoa viveu. Não interprete uma média como retrato completo quando o número de respostas for pequeno ou enviesado.' },
      { heading: 'Feche o ciclo com o cliente', body: 'Defina quem acompanha respostas críticas, qual prazo é razoável e como a equipe dará retorno. Nunca prometa contato ou correção se não houver capacidade para cumprir.' },
      { heading: 'Conecte pesquisa e avaliações públicas com cuidado', body: 'Pesquisas privadas e avaliações públicas são fontes diferentes. Use-as para aprender sobre a experiência, mas não condicione benefícios nem direcione apenas clientes satisfeitos para publicar avaliações.' },
    ],
    faq: [
      { question: 'Qual é a taxa de resposta ideal?', answer: 'Ela varia por canal, público e momento. Acompanhe a evolução e a representatividade das respostas em vez de adotar um único número como regra universal.' },
      { question: 'Devo pedir uma avaliação pública depois da pesquisa?', answer: 'Convites devem ser neutros e não condicionados à nota dada na pesquisa. Não filtre o convite para favorecer avaliações positivas.' },
      { question: 'Como lidar com uma resposta muito negativa?', answer: 'Priorize entender o ocorrido, ofereça um canal adequado para tratar detalhes e registre o que será feito. Preserve os dados pessoais e acompanhe o desfecho.' },
    ],
  },
  {
    slug: 'avaliacoes-google-medicos',
    title: 'Gestão de avaliações Google para consultórios médicos | Filtra.AI',
    description: 'Organize feedback sobre atendimento, agendamento e experiência em consultórios sem expor dados de pacientes.',
    h1: 'Gestão de avaliações Google para consultórios médicos',
    lead: 'A reputação de um consultório envolve confiança, acesso, comunicação e experiência de atendimento. A resposta pública precisa respeitar a privacidade e nunca confirmar que alguém é paciente.',
    sections: [
      { heading: 'Separe experiência de informação clínica', body: 'Comentários podem mencionar espera, agendamento, recepção, comunicação e estrutura. Trate publicamente apenas o necessário e nunca revele, confirme ou discuta informações de saúde ou vínculo com o consultório.' },
      { heading: 'Responda com privacidade', body: 'Agradeça o retorno de forma neutra e convide a pessoa a usar um canal oficial para tratar detalhes. Não peça dados clínicos, documentos ou informações pessoais em uma resposta pública.' },
      { heading: 'Identifique gargalos operacionais', body: 'Temas recorrentes sobre telefone, confirmação, atraso ou instruções podem revelar pontos de fricção. Valide o padrão com a equipe antes de alterar o processo.' },
      { heading: 'Peça feedback de forma ética', body: 'Use convites neutros, sem pressionar pacientes e sem oferecer vantagem por uma avaliação positiva. A participação deve ser voluntária e não interferir na assistência.' },
    ],
    faq: [
      { question: 'Posso confirmar publicamente que a pessoa foi atendida?', answer: 'Evite confirmar ou revelar qualquer vínculo ou informação de saúde. Responda de forma neutra e direcione a pessoa a um canal privado apropriado.' },
      { question: 'Como responder uma reclamação sobre espera?', answer: 'Reconheça a preocupação sem expor dados, investigue o fluxo internamente e informe um canal de contato sem prometer fatos ainda não verificados.' },
      { question: 'Como usar avaliações para melhorar o consultório?', answer: 'Agrupe temas operacionais, proteja a privacidade, verifique recorrências e atribua responsáveis por melhorias em agendamento, comunicação e recepção.' },
    ],
  },
  {
    slug: 'avaliacoes-google-dentistas',
    title: 'Avaliações Google para clínicas odontológicas | Filtra.AI',
    description: 'Entenda como organizar feedback sobre agendamento, atendimento e experiência em clínicas odontológicas com atenção à privacidade.',
    h1: 'Avaliações Google para clínicas odontológicas',
    lead: 'Para uma clínica odontológica, feedback pode apontar problemas de acesso, comunicação, recepção e conforto. A gestão deve aprender com esses sinais sem expor informações clínicas.',
    sections: [
      { heading: 'Organize temas ao longo da jornada', body: 'Separe agendamento, recepção, tempo de espera, comunicação, ambiente e acompanhamento. Essa organização permite que cada área veja quais melhorias estão sob seu controle.' },
      { heading: 'Proteja a confidencialidade', body: 'Não confirme publicamente que alguém recebeu tratamento, não discuta procedimentos e não solicite informações clínicas em comentários. Use canais privados adequados para qualquer apuração.' },
      { heading: 'Transforme padrões em melhorias', body: 'Se o mesmo problema aparece em diferentes avaliações, verifique se existe uma causa operacional comum. Registre uma ação, um responsável e uma data de revisão.' },
      { heading: 'Convites neutros para feedback', body: 'Peça feedback sem selecionar apenas pessoas satisfeitas, sem pressionar e sem atrelar benefícios a uma nota. O objetivo é ouvir experiências genuínas, não controlar a opinião pública.' },
    ],
    faq: [
      { question: 'Como responder uma crítica sobre tratamento?', answer: 'Não confirme detalhes do tratamento nem discuta informações clínicas em público. Reconheça a preocupação de forma neutra e ofereça um canal privado adequado.' },
      { question: 'Posso pedir avaliações após a consulta?', answer: 'Você pode fazer convites neutros e voluntários, desde que não pressione nem selecione pessoas com base na satisfação esperada.' },
      { question: 'O que devo acompanhar além da nota?', answer: 'Observe temas, recência, dúvidas sem resposta e padrões operacionais, sempre protegendo informações que possam identificar pacientes.' },
    ],
  },
  {
    slug: 'avaliacoes-google-imobiliarias',
    title: 'Gestão de avaliações Google para imobiliárias | Filtra.AI',
    description: 'Organize feedback sobre atendimento, visitas, comunicação e pós-venda para identificar melhorias na experiência imobiliária.',
    h1: 'Gestão de avaliações Google para imobiliárias',
    lead: 'A experiência imobiliária envolve etapas longas e diferentes interlocutores. Avaliações podem revelar falhas de comunicação, atrasos, expectativas desalinhadas ou práticas que os clientes valorizam.',
    sections: [
      { heading: 'Separe as etapas da jornada', body: 'Classifique feedback sobre primeiro contato, visita, documentação, negociação, entrega e pós-venda. Isso ajuda a identificar em qual etapa a experiência perde consistência.' },
      { heading: 'Evite responder no calor do momento', body: 'Não publique detalhes de contrato, endereço, valores ou conversas privadas. Verifique os fatos com a equipe e responda ao ponto geral com respeito e objetividade.' },
      { heading: 'Aprenda com padrões recorrentes', body: 'Reclamações repetidas sobre retorno lento podem indicar falta de responsável ou expectativa pouco clara. Defina prazos internos e acompanhe se a mudança reduz a recorrência.' },
      { heading: 'Use feedback para padronizar qualidade', body: 'Em equipes com vários corretores ou unidades, compartilhe práticas que funcionam e defina padrões mínimos de comunicação sem ignorar diferenças entre tipos de negociação.' },
    ],
    faq: [
      { question: 'Como responder uma reclamação sobre negociação?', answer: 'Evite divulgar dados contratuais ou pessoais. Reconheça a preocupação, verifique os fatos e convide a pessoa para um canal privado apropriado.' },
      { question: 'Vale comparar corretores pela nota?', answer: 'Não use a nota isolada como avaliação de desempenho. Considere contexto, volume, tipo de atendimento e evidências operacionais, com critérios transparentes.' },
      { question: 'Como melhorar a consistência entre unidades?', answer: 'Identifique temas recorrentes, estabeleça padrões de comunicação e acompanhe ações em períodos comparáveis.' },
    ],
  },
  {
    slug: 'avaliacoes-google-academias',
    title: 'Gestão de avaliações Google para academias | Filtra.AI',
    description: 'Analise feedback sobre atendimento, limpeza, lotação, equipamentos e experiência dos alunos para priorizar melhorias.',
    h1: 'Gestão de avaliações Google para academias',
    lead: 'Avaliações de academias frequentemente refletem a rotina: atendimento, manutenção, limpeza, lotação, horários e clareza das regras. Organizar esses temas ajuda a priorizar o que mais afeta a experiência.',
    sections: [
      { heading: 'Classifique por assunto e momento', body: 'Separe comentários sobre matrícula, primeira visita, equipamentos, vestiários, aulas, atendimento e cancelamento. Temas diferentes exigem responsáveis e soluções diferentes.' },
      { heading: 'Observe padrões por horário e unidade', body: 'Uma reclamação sobre lotação pode depender do horário ou da unidade. Registre contexto suficiente para investigar sem presumir que a experiência é igual para todos.' },
      { heading: 'Responda sem expor dados de contrato', body: 'Não discuta publicamente pagamentos, saúde ou dados de matrícula. Reconheça a preocupação e encaminhe detalhes para um canal privado seguro.' },
      { heading: 'Acompanhe se a melhoria funcionou', body: 'Se a equipe alterar manutenção, escala ou comunicação, acompanhe a evolução dos temas ao longo de períodos comparáveis. Registre também os pontos positivos para preservar o que funciona.' },
    ],
    faq: [
      { question: 'Como lidar com reclamações de lotação?', answer: 'Investigue por unidade e faixa horária, explique apenas o que foi verificado e avalie medidas operacionais. Evite prometer que não haverá lotação sem evidência.' },
      { question: 'Devo responder críticas sobre cobrança?', answer: 'Responda de forma neutra e direcione a apuração para um canal privado, sem expor contrato ou dados de pagamento.' },
      { question: 'Como usar avaliações em uma rede de academias?', answer: 'Compare unidades com contexto, identifique temas comuns e deixe claro quem é responsável por cada melhoria.' },
    ],
  },
  {
    slug: 'alternativa-planilhas-avaliacoes',
    title: 'Alternativa a planilhas para organizar avaliações de clientes | Filtra.AI',
    description: 'Saiba quando planilhas deixam de funcionar para acompanhar avaliações e como estruturar uma rotina mais consistente de feedback.',
    h1: 'Quando trocar planilhas por um processo de gestão de avaliações',
    lead: 'Planilhas podem funcionar no início. O problema aparece quando várias pessoas atualizam versões diferentes, temas não são comparáveis e ninguém sabe se uma reclamação virou ação.',
    sections: [
      { heading: 'Sinais de que o processo ficou pequeno', body: 'Procure duplicidade, registros incompletos, atraso para responder, ausência de responsáveis e dificuldade para comparar unidades. Se esses problemas se repetem, o custo operacional pode superar a simplicidade da planilha.' },
      { heading: 'Defina o fluxo antes de escolher a ferramenta', body: 'Mapeie entrada do feedback, classificação, encaminhamento, resposta, ação corretiva e revisão. Automatizar um fluxo indefinido só acelera a confusão.' },
      { heading: 'Compare o custo total', body: 'Considere horas de consolidação, erros, treinamento, licenças e esforço de manutenção. Uma ferramenta vale a pena quando reduz fricção ou melhora a qualidade das decisões, não apenas porque tem mais funções.' },
      { heading: 'Faça uma migração pequena', body: 'Teste com uma equipe ou unidade, preserve o histórico necessário e combine como serão medidos o tempo gasto, a qualidade dos registros e o acompanhamento de ações.' },
    ],
    faq: [
      { question: 'Preciso abandonar planilhas imediatamente?', answer: 'Não. Primeiro identifique o gargalo. Uma planilha bem mantida pode bastar para baixo volume; migre quando a colaboração, o volume ou a análise se tornarem difíceis.' },
      { question: 'O que comparar em uma ferramenta?', answer: 'Verifique adequação ao fluxo, fontes suportadas, colaboração, exportação, controle de acesso, suporte e custo total.' },
      { question: 'Como saber se a mudança funcionou?', answer: 'Compare a linha de base com o piloto: tempo para consolidar, registros completos, ações com responsável e recorrência dos temas.' },
    ],
  },
  {
    slug: 'centralizar-avaliacoes-unidades',
    title: 'Como centralizar avaliações de várias unidades | Filtra.AI',
    description: 'Organize uma visão central de avaliações sem perder contexto local, responsabilidades e ações por unidade.',
    h1: 'Como centralizar avaliações de várias unidades',
    lead: 'Centralizar não deve significar tirar autonomia das equipes locais. O objetivo é criar uma visão comum dos sinais e preservar contexto suficiente para que cada unidade resolva o que está sob seu controle.',
    sections: [
      { heading: 'Padronize categorias e definições', body: 'Use um conjunto comum de temas para permitir comparação, mas documente como classificar casos ambíguos. Sem definições consistentes, duas unidades podem registrar o mesmo problema de formas diferentes.' },
      { heading: 'Mantenha o contexto local', body: 'Cada registro deve permitir entender unidade, período e assunto sem expor dados pessoais desnecessários. A visão consolidada ajuda a detectar padrões; a visão local ajuda a investigar causas.' },
      { heading: 'Estabeleça regras de escalonamento', body: 'Defina quais temas precisam de resposta local, quais exigem suporte central e quais representam risco que merece atenção imediata. Isso evita tanto gargalos quanto problemas sem dono.' },
      { heading: 'Revise o processo regularmente', body: 'Compare a qualidade dos registros, a velocidade de encaminhamento e o fechamento das ações. Ajuste categorias e responsabilidades quando a operação mudar.' },
    ],
    faq: [
      { question: 'Quem deve ser dono do processo?', answer: 'Normalmente há um responsável central pelo padrão e responsáveis locais pela investigação e execução. O desenho exato deve refletir a estrutura da empresa.' },
      { question: 'Como evitar rankings injustos entre unidades?', answer: 'Compare períodos e volumes equivalentes, documente limitações e não use a nota como único indicador de desempenho.' },
      { question: 'É possível começar sem integrar todos os sistemas?', answer: 'Sim. Um piloto com escopo limitado pode validar categorias, responsabilidades e rotina antes de ampliar integrações ou fontes.' },
    ],
  },
  {
    slug: 'gestao-reputacao-franquias',
    title: 'Gestão de reputação para franquias | Filtra.AI',
    description: 'Crie padrões de acompanhamento de avaliações para franqueadoras e franqueados, com contexto local e ações rastreáveis.',
    h1: 'Gestão de reputação para franquias e franqueados',
    lead: 'A marca é compartilhada, mas a experiência acontece em cada unidade. Uma operação de franquias precisa de padrões claros, visibilidade central e espaço para corrigir problemas locais.',
    sections: [
      { heading: 'Crie um padrão operacional comum', body: 'Defina tom de resposta, categorias de feedback, prazos internos e regras para casos sensíveis. O padrão reduz improviso, mas deve permitir adaptações legítimas ao contexto local.' },
      { heading: 'Separe responsabilidade da franqueadora e da unidade', body: 'Temas de produto, política ou comunicação podem exigir ação central; questões de equipe, horário ou infraestrutura podem ser locais. Registre a atribuição para evitar que problemas circulem sem decisão.' },
      { heading: 'Use os melhores sinais para treinar a rede', body: 'Identifique práticas associadas a feedback positivo e compartilhe o aprendizado com contexto. Não presuma causalidade a partir de uma nota isolada; teste a prática em outras unidades.' },
      { heading: 'Acompanhe ações e reincidência', body: 'Uma crítica respondida não significa que o problema foi resolvido. Acompanhe se a causa foi tratada e se o tema volta a aparecer em períodos seguintes.' },
    ],
    faq: [
      { question: 'A franqueadora deve responder por todas as unidades?', answer: 'Isso depende do modelo operacional. O importante é definir responsáveis, padrão de qualidade e quando uma situação deve ser escalada.' },
      { question: 'Como comparar franqueados?', answer: 'Use critérios transparentes e contexto de volume, período e operação. Evite tratar a nota média como avaliação completa da unidade.' },
      { question: 'Como transformar avaliações em padrão de rede?', answer: 'Agrupe temas recorrentes, valide causas com as unidades e converta aprendizados em treinamento ou ajustes de processo verificáveis.' },
    ],
  },
  {
    slug: 'reputacao-google-ecommerce-local',
    title: 'Reputação Google para lojas físicas e operações omnichannel | Filtra.AI',
    description: 'Organize feedback sobre atendimento, retirada, entrega e suporte em operações que combinam loja física e canais digitais.',
    h1: 'Reputação Google em operações físicas e omnichannel',
    lead: 'Quando o cliente compra online e retira na loja, ou resolve um problema por diferentes canais, a experiência atravessa equipes. As avaliações podem revelar onde essa passagem de responsabilidade falha.',
    sections: [
      { heading: 'Classifique o feedback pelo ponto da jornada', body: 'Separe atendimento em loja, retirada, entrega, disponibilidade, troca e suporte. A mesma nota pode refletir etapas distintas, então encaminhe o sinal para a área responsável.' },
      { heading: 'Evite prometer o que não controla', body: 'Respostas públicas devem reconhecer a preocupação e explicar o próximo passo verificável. Não exponha dados de pedido nem prometa prazos sem confirmar a operação.' },
      { heading: 'Compare loja e canal sem misturar tudo', body: 'Se o comentário envolve uma compra digital e uma retirada local, registre ambos os contextos. Isso ajuda a identificar falhas de integração em vez de atribuir o problema automaticamente a uma equipe.' },
      { heading: 'Transforme recorrência em melhoria', body: 'Temas repetidos sobre estoque, comunicação ou retirada devem gerar investigação e ação com responsável. Acompanhe se a mudança reduz a recorrência e se outras unidades enfrentam o mesmo padrão.' },
    ],
    faq: [
      { question: 'Avaliações Google representam toda a experiência de compra?', answer: 'Não. São uma fonte útil, mas não representam necessariamente todos os clientes nem todos os canais. Combine-as com outras evidências disponíveis.' },
      { question: 'Como responder sobre um pedido específico?', answer: 'Não publique números de pedido ou dados pessoais. Direcione a pessoa a um canal oficial e verifique os fatos antes de responder sobre o caso.' },
      { question: 'Como separar problemas locais de problemas centrais?', answer: 'Classifique por etapa da jornada, unidade e tema, e valide padrões com as equipes envolvidas antes de decidir quem deve corrigir.' },
    ],
  },
];

const BASE = 'https://filtraai.com';

export function generateStaticParams() {
  return PAGES.map(({ slug }) => ({ seoPage: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ seoPage: string }> }): Promise<Metadata> {
  const { seoPage } = await params;
  const page = PAGES.find((item) => item.slug === seoPage);
  if (!page) return { title: 'Página não encontrada | Filtra.AI' };
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `${BASE}/${page.slug}` },
    openGraph: { type: 'website', url: `${BASE}/${page.slug}`, title: page.title, description: page.description, images: [OG_IMAGE_META] },
    twitter: { card: 'summary_large_image', title: page.title, description: page.description, images: [OG_IMAGE_META.url] },
  };
}

export default async function ProgrammaticSeoPage({ params }: { params: Promise<{ seoPage: string }> }) {
  const { seoPage } = await params;
  const page = PAGES.find((item) => item.slug === seoPage);
  if (!page) notFound();

  return (
    <SeoLanding
      h1={page.h1}
      lead={page.lead}
      breadcrumbHref={`/${page.slug}`}
      contextLinks={[
        { href: '/planos', title: 'Planos do Filtra.AI', description: 'Veja opções para começar.' },
        { href: '/auditoria-gratuita', title: 'Auditoria gratuita', description: 'Faça um diagnóstico inicial.' },
        { href: '/gestao-de-reputacao-online', title: 'Gestão de reputação online', description: 'Conecte avaliações, feedback e melhoria contínua.' },
        { href: '/avaliacoes-google', title: 'Gestão de avaliações Google', description: 'Estruture a rotina de acompanhamento.' },
        { href: '/analise-de-avaliacoes-com-ia', title: 'Análise de avaliações com IA', description: 'Identifique padrões nos comentários.' },
      ]}
      sections={page.sections}
      faq={page.faq}
    />
  );
}
