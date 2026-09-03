/**
 * Explicação formal, didática e profissional sobre o funcionamento do Filtra.IA.
 * Exibida abaixo dos planos na ativação (7 dias) e no login.
 */
export function ComoFunciona() {
  return (
    <section
      aria-labelledby="como-funciona-titulo"
      className="w-full max-w-4xl mx-auto mt-10 mb-8"
    >
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-6 md:px-10 py-9 md:py-11 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-200/90 mb-2">
            Filtra.IA — Orientação ao cliente
          </p>
          <h2
            id="como-funciona-titulo"
            className="text-xl md:text-2xl font-bold tracking-tight"
          >
            Como funciona o sistema de gestão de avaliações
          </h2>
          <p className="mt-4 text-sm md:text-[15px] text-slate-300 leading-relaxed max-w-3xl">
            Este documento resume, de forma clara e objetiva, o funcionamento do
            Filtra.IA: da coleta da opinião do cliente à proteção da reputação da
            empresa, passando pelo uso do Google Reviews e pelo apoio da
            inteligência artificial no tratamento das críticas.
          </p>
        </div>

        <div className="px-6 md:px-10 py-9 md:py-11 space-y-10 text-sm text-slate-600 leading-relaxed">
          {/* Introdução */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              Finalidade do serviço
            </h3>
            <p>
              O Filtra.IA foi desenvolvido para empresas que desejam fortalecer a
              presença digital positiva e, ao mesmo tempo, tratar reclamações com
              discrição e profissionalismo. Em vez de enviar todo e qualquer
              comentário diretamente às plataformas públicas, o sistema organiza o
              fluxo de avaliações conforme a nota atribuída pelo cliente.
            </p>
            <p>
              Na prática, avaliações favoráveis são encaminhadas ao ambiente
              público do Google, enquanto manifestações de insatisfação permanecem
              sob controle interno da empresa, permitindo análise, correção de
              processos e resposta adequada antes de qualquer exposição pública
              indesejada.
            </p>
          </div>

          {/* Passo a passo */}
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              Funcionamento passo a passo
            </h3>

            <div className="space-y-5">
              <div>
                <h4 className="font-semibold text-slate-900">
                  1. Disponibilização do canal de avaliação
                </h4>
                <p className="mt-1.5">
                  Após a ativação — seja pelo período de testes de sete dias ou
                  pela assinatura de um plano —, a empresa recebe um link exclusivo
                  e um QR Code. Esses elementos podem ser utilizados no balcão, no
                  cardápio, na embalagem, no WhatsApp ou em qualquer ponto de
                  contato com o cliente. O objetivo é concentrar a primeira etapa
                  da avaliação em um ambiente controlado pela própria empresa, e
                  não em um formulário genérico de terceiros.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900">
                  2. Registro da nota pelo cliente
                </h4>
                <p className="mt-1.5">
                  Ao acessar o link ou o QR Code, o cliente informa, de maneira
                  simples, a nota de 1 a 5 estrelas referente à experiência
                  vivenciada. Essa etapa é rápida e não exige cadastro complexo.
                  A partir da nota escolhida, o sistema determina automaticamente o
                  caminho seguinte, conforme as regras descritas abaixo.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900">
                  3. Notas altas (4 e 5 estrelas): encaminhamento ao Google Reviews
                </h4>
                <p className="mt-1.5">
                  Quando o cliente atribui nota 4 ou 5, o Filtra.IA interpreta a
                  experiência como positiva. Nesses casos, o sistema registra a
                  informação internamente e direciona o cliente à página oficial de
                  avaliação do Google associada ao estabelecimento — desde que o
                  link do Google Reviews tenha sido cadastrado pela empresa.
                </p>
                <p className="mt-2">
                  Cabe destacar que a publicação definitiva no Google depende da
                  confirmação do próprio cliente na plataforma do Google, em
                  conformidade com as regras daquele serviço. O Filtra.IA não
                  publica avaliações em nome do usuário; apenas facilita o caminho
                  para que experiências positivas se tornem avaliações públicas na
                  ficha do negócio.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900">
                  4. Notas baixas (1, 2 e 3 estrelas): retenção privada
                </h4>
                <p className="mt-1.5">
                  Quando a nota é igual ou inferior a 3, o sistema adota conduta
                  distinta. O cliente é convidado a descrever o ocorrido em campo
                  próprio, e essa manifestação permanece no painel da empresa,
                  sem redirecionamento automático ao Google. Trata-se de uma
                  medida deliberada de proteção da reputação: a crítica chega
                  primeiro à gestão, e não à vitrine pública da internet.
                </p>
                <p className="mt-2">
                  Assim, a equipe pode esclarecer o episódio, oferecer
                  ressarcimento quando cabível, treinar colaboradores ou ajustar
                  processos operacionais, reduzindo o risco de danos à imagem
                  digital do estabelecimento.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900">
                  5. Apoio da inteligência artificial
                </h4>
                <p className="mt-1.5">
                  Nas avaliações negativas, o Filtra.IA pode gerar, por meio de
                  inteligência artificial, uma sugestão de resposta empática e
                  profissional, bem como etiquetas (tags) que resumem o teor do
                  comentário. Essas sugestões destinam-se exclusivamente ao uso
                  interno da empresa no painel. Não há publicação automática da
                  resposta em redes sociais ou no Google.
                </p>
                <p className="mt-2">
                  Nos planos que contemplam relatório mensal, a inteligência
                  artificial também contribui para a análise consolidada do
                  período, identificando sentimentos predominantes e eventuais
                  gargalos operacionais recorrentes.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900">
                  6. Painel de gestão
                </h4>
                <p className="mt-1.5">
                  O painel reúne as avaliações recebidas, as críticas privadas, as
                  métricas de volume e satisfação, os alertas de crise e os links
                  operacionais (página de avaliação, widget e QR Code). É nesse
                  ambiente que a empresa acompanha o dia a dia da reputação e toma
                  decisões com base em dados concretos, e não apenas em percepções
                  isoladas.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900">
                  7. Período de testes, assinatura e cancelamento
                </h4>
                <p className="mt-1.5">
                  Novos clientes podem iniciar um período de testes de sete dias,
                  sem exigência de cartão de crédito nessa etapa. Para continuar
                  após o trial, ou para contratar diretamente, basta escolher um
                  dos planos e concluir o pagamento na página segura do Stripe.
                </p>
                <p className="mt-2">
                  A assinatura mensal poderá ser cancelada a qualquer momento. Em
                  caso de cancelamento antes do término do ciclo de cobrança, o
                  acesso ao sistema permanece ativo até o último dia do período já
                  pago, sem cobrança adicional no mês seguinte. O encerramento do
                  acesso ocorre de forma automática somente após essa data.
                </p>
              </div>
            </div>
          </div>

          {/* Síntese */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-5 md:px-6 py-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Síntese operacional
            </p>
            <p>
              <strong className="text-slate-900 font-semibold">Notas 4 e 5:</strong>{' '}
              o cliente é conduzido ao Google Reviews para registrar a avaliação
              pública do estabelecimento, reforçando a reputação digital positiva.
            </p>
            <p>
              <strong className="text-slate-900 font-semibold">Notas 1, 2 e 3:</strong>{' '}
              o feedback permanece privado no painel da empresa, com possibilidade
              de sugestão de resposta por inteligência artificial, permitindo
              tratamento interno antes de qualquer exposição pública.
            </p>
            <p>
              Em ambos os casos, a empresa mantém visibilidade sobre o que ocorre
              com seus clientes e dispõe de instrumentos concretos para melhorar o
              atendimento e preservar a imagem do negócio.
            </p>
          </div>

          <p className="text-xs text-slate-400 text-center leading-relaxed pt-1 max-w-2xl mx-auto">
            O Filtra.IA não substitui o Google Reviews; organiza o caminho até ele
            quando a experiência é positiva e resguarda a empresa quando há
            insatisfação a ser resolvida com responsabilidade.
          </p>
        </div>
      </div>
    </section>
  );
}
