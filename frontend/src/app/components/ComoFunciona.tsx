/**
 * Texto didático e formal sobre o funcionamento do Filtra.IA.
 * Exibido abaixo dos planos na ativação e no login.
 */
export function ComoFunciona() {
  const passos = [
    {
      titulo: '1. O cliente avalia pelo seu link ou QR Code',
      texto:
        'Em vez de ir direto ao Google, o cliente acessa a página de avaliação da sua empresa. Ali ele indica a nota de 1 a 5 estrelas, de forma simples e rápida.',
    },
    {
      titulo: '2. Notas altas (4 e 5) seguem para o Google',
      texto:
        'Quando a experiência é positiva, o sistema registra a avaliação e encaminha o cliente à página oficial do Google Reviews do seu estabelecimento, para que a nota pública seja concluída lá.',
    },
    {
      titulo: '3. Notas baixas (1 a 3) permanecem privadas',
      texto:
        'Críticas e insatisfações são retidas no painel da empresa. Elas não são enviadas automaticamente ao Google, permitindo que a equipe trate o caso internamente e proteja a reputação digital.',
    },
    {
      titulo: '4. Inteligência artificial apoia a resposta',
      texto:
        'Nas avaliações negativas, o sistema pode sugerir uma resposta empática e profissional. Essa sugestão fica disponível no painel para uso da gerência — não é publicada sozinha em redes externas.',
    },
    {
      titulo: '5. Painel, métricas e continuidade do serviço',
      texto:
        'No painel você acompanha volume de avaliações, críticas retidas e alertas. O período de testes dura sete dias. Após a assinatura, o acesso segue conforme o plano contratado; em caso de cancelamento da mensalidade, o uso permanece até o fim do ciclo já pago.',
    },
  ];

  return (
    <section
      aria-labelledby="como-funciona-titulo"
      className="w-full max-w-4xl mx-auto mt-10 mb-6"
    >
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-6 md:px-10 py-8 md:py-10 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-200/90 mb-2">
            Filtra.IA
          </p>
          <h2
            id="como-funciona-titulo"
            className="text-xl md:text-2xl font-bold tracking-tight"
          >
            Como funciona o sistema
          </h2>
          <p className="mt-3 text-sm md:text-[15px] text-slate-300 leading-relaxed max-w-2xl">
            O Filtra.IA organiza o fluxo de avaliações da sua empresa: valoriza as
            experiências positivas no Google e trata as críticas com discrição,
            inteligência e controle gerencial.
          </p>
        </div>

        {/* Corpo */}
        <div className="px-6 md:px-10 py-8 md:py-10 space-y-8">
          <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-indigo-200 pl-4">
            A proposta é didática e transparente: o cliente avalia uma única vez;
            o sistema decide o caminho conforme a nota, sempre em benefício da
            reputação e da qualidade do atendimento.
          </p>

          <ol className="space-y-6">
            {passos.map((p) => (
              <li key={p.titulo} className="group">
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight group-hover:text-indigo-700 transition-colors">
                  {p.titulo}
                </h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                  {p.texto}
                </p>
              </li>
            ))}
          </ol>

          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Em síntese
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong className="font-semibold text-slate-900">Notas 4 e 5</strong> —
              o cliente é direcionado ao Google Reviews para publicar a avaliação
              pública.{' '}
              <strong className="font-semibold text-slate-900">Notas 1, 2 e 3</strong> —
              o feedback permanece privado no painel, com apoio de resposta
              sugerida por inteligência artificial, para a empresa resolver o
              problema antes que ele se torne público.
            </p>
          </div>

          <p className="text-xs text-slate-400 text-center leading-relaxed pt-1">
            Pagamentos processados de forma segura. A assinatura mensal poderá ser
            cancelada a qualquer momento, com direito de uso até o último dia do
            período já pago.
          </p>
        </div>
      </div>
    </section>
  );
}
