import type { Metadata } from 'next';
import { getMeta, getSegmentos, minimo } from '@/lib/data';
import { n, mesPorExtenso, mesCurto, dataCurta } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE, datasetDoIndice, FONTE_URL, FONTE_DADOS_ABERTOS_URL, SUPORTE_URL, CONSUMIDOR_URL } from '@/lib/seo';
import { Citacao } from '@/components/Citacao';
import { Definicao } from '@/components/Definicao';
import { Faq, type ItemFaq } from '@/components/Faq';
import { FonteDados } from '@/components/FonteDados';
import { Migalhas } from '@/components/Migalhas';

const titulo = 'Metodologia do Índice Filtra.AI: fonte, período, fórmulas e limites';
const descricao = 'Fonte, universo, fórmulas e limites do Índice Filtra.AI, que conta estabelecimentos ativos por município e segmento com dados do CNPJ da Receita Federal.';

export const metadata: Metadata = {
  title: { absolute: titulo },
  description: descricao,
  alternates: { canonical: urlAbsoluta('/metodologia') },
  openGraph: { title: titulo, description: descricao, url: urlAbsoluta('/metodologia'), type: 'article', locale: 'pt_BR', siteName: 'Filtra.AI', images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: titulo, description: descricao, images: [OG_IMAGE] },
};

export default function Page() {
  const meta = getMeta();
  const segs = getSegmentos();
  const comp = mesPorExtenso(meta.competencia);
  const janela = `${mesCurto(meta.janela.inicio)} a ${mesCurto(meta.janela.fim)}`;
  const faq: ItemFaq[] = [
    {
      pergunta: 'O Índice Filtra.AI mede a reputação das empresas?',
      resposta: 'Não. O Índice conta estabelecimentos com situação cadastral ativa no CNPJ e atividade econômica principal em um dos segmentos acompanhados. Nota, comentários, faturamento, qualidade do atendimento e participação de mercado não fazem parte do conjunto de dados.',
    },
    {
      pergunta: 'Os números do Índice são estimativas?',
      resposta: `Não. Todos os indicadores publicados são contagens diretas da base aberta do CNPJ, na competência ${comp}. Não usamos amostragem, extrapolação, modelo estatístico ou imputação. O que não existe na fonte aparece como indisponível, não como zero.`,
    },
    {
      pergunta: 'Por que nem todo município tem página no Índice?',
      resposta: `Só publicamos uma combinação município × segmento com pelo menos ${n(minimo())} estabelecimentos ativos. Abaixo disso, a contagem isolada diz pouco e a página repetiria conteúdo sem informação suficiente. O município continua incluído nos totais do segmento no estado e no Brasil.`,
    },
    {
      pergunta: 'O que é um estabelecimento ativo?',
      resposta: `É um CNPJ com situação cadastral “ativa” na competência ${comp}, cuja atividade econômica principal está na classe CNAE do segmento. Matriz e filial contam separadamente. A situação ativa é cadastral: não garante que o local esteja em funcionamento.`,
    },
    {
      pergunta: 'Aberturas e baixas formam um saldo líquido?',
      resposta: `Não. Aberturas contam estabelecimentos com data de início de atividade na janela de ${janela}, qualquer que seja a situação atual. Baixas contam CNPJs com situação “baixada” e data da situação na mesma janela. Os universos não são simétricos e a base pode revisar registros.`,
    },
    {
      pergunta: 'Com que frequência o Índice é atualizado?',
      resposta: `A ingestão é mensal, com rotina programada para o dia 15, e pode atrasar ou falhar. A página exibe a competência e a data de geração efetivamente processadas. Não há atualização em tempo real nem garantia de publicação em um dia fixo.`,
    },
    {
      pergunta: 'O Índice usa dados do Consumidor.gov.br ou avaliações do Google?',
      resposta: 'Não. O Índice usa apenas o cadastro aberto de CNPJ da Receita Federal. Reclamações no Consumidor.gov.br e avaliações do Google são outros universos, com outra unidade de contagem, e não se somam aos estabelecimentos ativos. Se citadas em conteúdo editorial, são apresentadas separadamente.',
    },
    {
      pergunta: 'Como contestar um número do Índice?',
      resposta: `Envie a URL da página, o número contestado e a competência para o suporte. Vamos conferir a agregação e a fonte. Se o erro estiver no Índice, corrigimos a ingestão e reprocessamos; se o dado estiver correto no cadastro da Receita, a correção do registro é feita nos canais da própria Receita.`,
    },
  ];

  return (
    <>
      <JsonLd data={breadcrumb([{ nome: 'Índice', caminho: '/' }, { nome: 'Metodologia', caminho: '/metodologia' }])} />
      <JsonLd data={datasetDoIndice(meta)} />
      <Migalhas itens={[{ nome: 'Índice', href: '/' }, { nome: 'Metodologia' }]} />
      <h1>Metodologia do Índice Filtra.AI</h1>
      <p className="lead">
        O Índice Filtra.AI é um levantamento mensal de estabelecimentos com CNPJ ativo, classificados pela atividade
        econômica principal (CNAE) e agregados por estado e município. Esta página descreve a fonte, o universo, as
        fórmulas, a frequência de atualização, os limites e o canal de contestação.
      </p>

      <Definicao termo="O que o Índice mede">
        <p>
          O Índice mede a quantidade de estabelecimentos com situação cadastral ativa no Cadastro Nacional da Pessoa
          Jurídica (CNPJ), por município e por segmento definido pela atividade econômica principal. Também conta, dentro
          dessa mesma base, quantos são matrizes, quantos iniciaram atividade nos últimos 12 meses e quantos tiveram o CNPJ
          baixado no período.
        </p>
      </Definicao>

      <Definicao termo="O que o Índice não mede">
        <p>
          O Índice não mede reputação, nota, qualidade, faturamento, lucro, número de clientes, participação de mercado ou
          o total de empresas brasileiras. Também não mede negócios informais, empresas sem CNPJ nem estabelecimentos cuja
          atividade aparece apenas como secundária no cadastro. Ausência de dado não é tratada como zero.
        </p>
      </Definicao>

      <FonteDados />
      <table>
        <caption>Parâmetros da competência publicada. Datas e janelas vêm do arquivo de metadados gerado na ingestão.</caption>
        <thead>
          <tr><th scope="col">Parâmetro</th><th scope="col">Valor</th><th scope="col">Como ler</th></tr>
        </thead>
        <tbody>
          <tr><th scope="row">Fonte primária</th><td><a href={FONTE_URL} rel="noopener">CNPJ — Dados Abertos, Receita Federal</a></td><td>Cadastro público, sem dados de contato ou sócios no Índice.</td></tr>
          <tr><th scope="row">Competência</th><td>{comp}</td><td>Mês de referência da situação cadastral.</td></tr>
          <tr><th scope="row">Data de geração</th><td><time dateTime={meta.geradoEm}>{dataCurta(meta.geradoEm)}</time></td><td>Quando a base foi processada, não a data de acesso à página.</td></tr>
          <tr><th scope="row">Janela de eventos</th><td>{janela}</td><td>12 meses fechados antes da competência, usados em aberturas e baixas.</td></tr>
          <tr><th scope="row">Frequência</th><td>Mensal</td><td>Rotina programada para o dia 15; atrasos e falhas são possíveis.</td></tr>
          <tr><th scope="row">Página oficial</th><td><a href={FONTE_DADOS_ABERTOS_URL} rel="noopener">Dados Abertos — Receita Federal</a></td><td>Origem dos arquivos e do layout publicado.</td></tr>
        </tbody>
      </table>

      {(meta.linhasLidas || meta.linhasNoEscopo || meta.arquivosEstabelecimentos || meta.municipiosSemNomeIbge) ? (
        <table>
          <caption>Volume processado nesta competência. Números operacionais da ingestão, não indicadores de mercado.</caption>
          <thead>
            <tr><th scope="col">Item</th><th scope="col" className="num">Valor</th><th scope="col">Observação</th></tr>
          </thead>
          <tbody>
            {meta.arquivosEstabelecimentos ? <tr><th scope="row">Arquivos de estabelecimentos</th><td className="num">{n(meta.arquivosEstabelecimentos)}</td><td>Partes do arquivo de estabelecimentos processadas.</td></tr> : null}
            {meta.linhasLidas ? <tr><th scope="row">Linhas lidas</th><td className="num">{n(meta.linhasLidas)}</td><td>Linhas de estabelecimentos lidas na base.</td></tr> : null}
            {meta.linhasNoEscopo ? <tr><th scope="row">Linhas nos segmentos</th><td className="num">{n(meta.linhasNoEscopo)}</td><td>Linhas cuja atividade principal está nos segmentos acompanhados.</td></tr> : null}
            {meta.municipiosSemNomeIbge ? <tr><th scope="row">Códigos sem nome no IBGE</th><td className="num">{n(meta.municipiosSemNomeIbge)}</td><td>Mantidos com o nome do cadastro da Receita quando não houve correspondência.</td></tr> : null}
          </tbody>
        </table>
      ) : null}

      <h2>Universo: segmentos, unidade e geografia</h2>
      <p>
        O universo é formado por estabelecimentos com CNPJ, situação cadastral ativa na competência e atividade econômica
        principal em uma das classes CNAE abaixo. A unidade de contagem é o estabelecimento, não a empresa controladora:
        matriz e filial do mesmo grupo contam separadamente.
      </p>
      <table>
        <caption>Segmentos acompanhados e classes CNAE usadas para classificar a atividade principal.</caption>
        <thead><tr><th scope="col">Segmento</th><th scope="col">Classe CNAE</th><th scope="col">Critério de entrada</th></tr></thead>
        <tbody>
          {segs.map((s) => (
            <tr key={s.slug}><th scope="row">{s.nome}</th><td>{s.classes.join(', ')}</td><td>Atividade principal na classe {s.classes.join(', ')} e situação ativa.</td></tr>
          ))}
        </tbody>
      </table>
      <p className="nota">
        A página de um município só existe quando há pelo menos {n(minimo())} estabelecimentos ativos em um segmento. O
        município sem página continua nos totais do segmento no estado e no Brasil. Nomes de municípios vêm do IBGE quando
        há correspondência; sem ela, usa-se o nome do cadastro da Receita.
      </p>

      <h2>Critérios e fórmulas</h2>
      <table>
        <caption>Definição operacional de cada indicador. “Observado” significa contagem direta na base, sem estimativa.</caption>
        <thead>
          <tr><th scope="col">Indicador</th><th scope="col">Critério</th><th scope="col">Fórmula ou denominador</th><th scope="col">Tipo</th></tr>
        </thead>
        <tbody>
          <tr><th scope="row">Estabelecimentos ativos</th><td>Situação cadastral “ativa” na competência.</td><td>Contagem de CNPJs; matriz e filial separadas.</td><td>Observado</td></tr>
          <tr><th scope="row">Matrizes</th><td>Entre os ativos, indicador de matriz/filial igual a matriz.</td><td><code>matrizes ÷ ativos × 100</code></td><td>Observado</td></tr>
          <tr><th scope="row">Aberturas em 12 meses</th><td>Data de início de atividade na janela, qualquer situação atual.</td><td>Contagem de estabelecimentos na janela.</td><td>Observado</td></tr>
          <tr><th scope="row">Baixas em 12 meses</th><td>Situação “baixada” com data da situação na janela.</td><td>Contagem de CNPJs baixados na janela.</td><td>Observado</td></tr>
          <tr><th scope="row">Parcela no estado</th><td>Ativos do município no segmento sobre o total do estado.</td><td><code>ativos(município, segmento) ÷ ativos(UF, segmento) × 100</code></td><td>Observado</td></tr>
          <tr><th scope="row">Parcela no Brasil</th><td>Ativos do município no segmento sobre o total nacional.</td><td><code>ativos(município, segmento) ÷ ativos(Brasil, segmento) × 100</code></td><td>Observado</td></tr>
          <tr><th scope="row">Ranking</th><td>Ordem decrescente de ativos entre municípios com ao menos um estabelecimento do segmento.</td><td>Empates dividem a mesma posição; não se limita às páginas publicadas.</td><td>Observado</td></tr>
          <tr><th scope="row">Cobertura das páginas</th><td>Ativos nas células com página sobre o total do segmento.</td><td><code>ativos nas páginas ÷ ativos no segmento × 100</code></td><td>Observado</td></tr>
        </tbody>
      </table>
      <p>
        Os denominadores de estado e Brasil incluem todos os municípios da base, inclusive os que não têm página. Por
        isso, a soma dos ativos exibidos nas páginas pode ser menor que o total do segmento. A diferença é cobertura, não
        erro de arredondamento.
      </p>

      <h2>Observado, estimado e indisponível</h2>
      <p>
        Nenhum indicador publicado é estimado por amostragem, modelo, extrapolação ou imputação. A separação abaixo existe
        para evitar que uma ausência de dado seja lida como zero ou como uma estimativa de mercado.
      </p>
      <table>
        <caption>O que é contagem direta, o que não é estimado e o que não existe na fonte.</caption>
        <thead><tr><th scope="col">Categoria</th><th scope="col">Indicadores</th><th scope="col">Como o Índice trata</th></tr></thead>
        <tbody>
          <tr><th scope="row">Observado</th><td>Ativos, matrizes, aberturas, baixas, subclasses CNAE, ranking e cobertura.</td><td>Contagem direta; pode mudar se a Receita revisar a base.</td></tr>
          <tr><th scope="row">Estimado</th><td>Nenhum indicador publicado.</td><td>Não usamos amostragem, modelo ou imputação.</td></tr>
          <tr><th scope="row">Indisponível</th><td>Total de empresas do município, faturamento, reputação, clientes, mercado, informalidade e causas de abertura ou baixa.</td><td>Não é exibido como zero nem como estimativa; simplesmente não faz parte do Índice.</td></tr>
        </tbody>
      </table>

      <h2>Atualização e revisões</h2>
      <p>
        A ingestão é mensal, com rotina programada para o dia 15. Os dados só são publicados depois da revisão e do merge
        do PR de dados e de um novo build/deploy do app; a home tem revalidação de 24 horas, mas as páginas pré-geradas de
        estado, município e segmento mudam no próximo build. A data de geração exibida e o <code>dateModified</code> do
        JSON-LD são a data efetiva do processamento, não a data de acesso.
      </p>
      <p>
        Se a Receita revisar um registro, a próxima ingestão recalcula os agregados e substitui os números publicados. O
        Índice não mantém um histórico público de versões por competência; por isso, ao citar, informe a competência e a
        data de geração.
      </p>

      <h2>Limitações</h2>
      <ul>
        <li><strong>Ativo no cadastro não significa em funcionamento.</strong> A situação cadastral pode estar ativa mesmo com a operação parada.</li>
        <li><strong>A atividade principal define o segmento.</strong> Quem exerce a atividade apenas como secundária não é contado nesse segmento.</li>
        <li><strong>Classificação CNAE não é senso comum.</strong> Um negócio pode ser popularmente conhecido como restaurante e estar classificado em outra atividade.</li>
        <li><strong>O mínimo de {n(minimo())} esconde municípios pequenos.</strong> Eles entram nos totais do estado e do Brasil, mas não têm página própria.</li>
        <li><strong>Aberturas e baixas não são sucesso e falência.</strong> São eventos cadastrais, em universos diferentes, e não formam saldo.</li>
        <li><strong>Há defasagem e revisão.</strong> A base publicada pela Receita pode não refletir o mês corrente e pode ser corrigida retroativamente.</li>
        <li><strong>Correlação não é causalidade.</strong> Mais estabelecimentos em um município não significam mercado melhor, mais qualidade ou mais demanda.</li>
        <li><strong>O Índice não mede reputação.</strong> Nota, comentários e reclamações são outro universo e não entram nos números.</li>
      </ul>

      <h2>Consumidor.gov.br e outras fontes</h2>
      <p>
        O Índice não usa <a href={CONSUMIDOR_URL} rel="noopener">Consumidor.gov.br</a>, avaliações do Google, redes sociais,
        dados de mercado ou estimativas populacionais. Reclamações no Consumidor.gov.br são outro universo: dependem de
        adesão das empresas ao sistema e medem reclamações registradas, não estabelecimentos ativos. Se um conteúdo do
        Filtra.AI citar essa base, ela será apresentada separadamente, com período e denominador próprios.
      </p>
      <table>
        <caption>Bases citadas em conteúdo do Filtra.AI e o que cada uma mede.</caption>
        <thead><tr><th scope="col">Base</th><th scope="col">O que mede</th><th scope="col">Entra no Índice?</th></tr></thead>
        <tbody>
          <tr><th scope="row">CNPJ — Dados Abertos (Receita Federal)</th><td>Situação cadastral, atividade principal e localização de estabelecimentos.</td><td>Sim, é a única fonte das contagens.</td></tr>
          <tr><th scope="row">Consumidor.gov.br</th><td>Reclamações registradas por consumidores em empresas participantes.</td><td>Não; universo separado.</td></tr>
          <tr><th scope="row">Avaliações do Google</th><td>Nota e comentários publicados por clientes.</td><td>Não; universo separado.</td></tr>
        </tbody>
      </table>

      <h2>Como interpretar</h2>
      <ul>
        <li>Dez restaurantes ativos significam dez CNPJs com situação ativa e atividade principal na classe CNAE do segmento, não necessariamente dez restaurantes abertos ao público.</li>
        <li>Para comparar municípios de tamanhos diferentes, use a participação e o total; o ranking sozinho favorece municípios maiores.</li>
        <li>Uma variação mensal pode refletir atualização cadastral, correção de CNAE ou mudança de situação, não apenas abertura ou fechamento real.</li>
        <li>O Índice serve para dimensionar o universo cadastral de um segmento, não para avaliar a qualidade ou a reputação dos negócios.</li>
      </ul>

      <h2>Como contestar</h2>
      <p>
        Se você identificou erro de município, CNAE, período ou contagem, envie a URL da página, o número contestado e a
        competência para o <a href={SUPORTE_URL} rel="noopener">suporte do Filtra.AI</a>. Vamos conferir a agregação e a
        fonte. Se o erro estiver no Índice, corrigimos a ingestão e reprocessamos os agregados. Não alteramos contagens
        individualmente sem conferir o cadastro.
      </p>
      <p className="nota">
        Correções de situação cadastral, atividade ou dados da empresa são feitas nos canais da Receita Federal, não no
        Índice. O Filtra.AI não edita o cadastro oficial.
      </p>

      <Faq itens={faq} />

      <Citacao caminho="/metodologia" titulo="Metodologia do Índice Filtra.AI" />
    </>
  );
}
