import type { Metadata } from 'next';
import { getMeta, getSegmentos, minimo } from '@/lib/data';
import { n, mesPorExtenso, mesCurto } from '@/lib/format';
import { JsonLd, breadcrumb, urlAbsoluta, OG_IMAGE, FONTE_URL, publisher } from '@/lib/seo';
import { Faq } from '@/components/Faq';
import { Migalhas } from '@/components/Migalhas';

const titulo = 'Metodologia do Índice Filtra.AI: fonte, janelas e limites dos dados';
const descricao = 'Como o Índice conta estabelecimentos ativos, aberturas e baixas por município e segmento a partir do CNPJ aberto da Receita Federal, e o que os números não mostram.';

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
  const faq = [
    { pergunta: 'De onde vêm os números do Índice?', resposta: `Do cadastro aberto de CNPJ publicado pela Receita Federal, na competência ${mesPorExtenso(meta.competencia)}. O Filtra.AI apenas agrega: conta estabelecimentos por município e segmento.` },
    { pergunta: 'O que significa “aberturas nos últimos 12 meses”?', resposta: `É a quantidade de estabelecimentos com data de início de atividade entre ${mesCurto(meta.janela.inicio)} e ${mesCurto(meta.janela.fim)}, qualquer que seja a situação atual. Não é um saldo líquido de empresas.` },
    { pergunta: 'Por que alguns municípios não têm página?', resposta: `Só publicamos combinações com pelo menos ${n(minimo())} estabelecimentos ativos. Abaixo disso, a contagem diz pouco e a página seria vazia de informação.` },
    { pergunta: 'O Índice mostra nomes, endereços ou contatos de empresas?', resposta: 'Não. O processamento lê apenas situação cadastral, datas, atividade econômica principal e localização, e grava somente contagens agregadas.' },
  ];
  return (
    <>
      <JsonLd data={breadcrumb([{ nome: 'Índice', caminho: '/' }, { nome: 'Metodologia', caminho: '/metodologia' }])} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name: 'Índice Filtra.AI: estabelecimentos por município e segmento',
          description: descricao,
          url: urlAbsoluta('/metodologia'),
          inLanguage: 'pt-BR',
          dateModified: meta.geradoEm,
          temporalCoverage: meta.competencia,
          isBasedOn: FONTE_URL,
          creator: publisher,
          publisher,
        }}
      />
      <Migalhas itens={[{ nome: 'Índice', href: '/' }, { nome: 'Metodologia' }]} />
      <h1>Metodologia do Índice Filtra.AI</h1>
      <p className="lead">
        O Índice agrega o cadastro aberto de CNPJ da Receita Federal ({' '}
        <a href={meta.fonte.url || FONTE_URL} rel="noopener">fonte</a>) em contagens por município e segmento. Competência atual: {mesPorExtenso(meta.competencia)}.
        Dados gerados em {new Date(meta.geradoEm).toLocaleDateString('pt-BR')}.
      </p>

      <h2>Definições</h2>
      <ul>
        <li><strong>Ativos:</strong> estabelecimentos com situação cadastral “ativa” na competência.</li>
        <li><strong>Matrizes:</strong> entre os ativos, os que são matriz (os demais são filiais).</li>
        <li><strong>Abertos em 12 meses:</strong> data de início de atividade entre {mesCurto(meta.janela.inicio)} e {mesCurto(meta.janela.fim)}, em qualquer situação atual.</li>
        <li><strong>Baixas em 12 meses:</strong> situação “baixada” com data da situação na mesma janela.</li>
        <li><strong>Segmento:</strong> definido pela atividade econômica (CNAE) principal do estabelecimento.</li>
      </ul>

      <h2>Segmentos e classes CNAE</h2>
      <table>
        <thead><tr><th>Segmento</th><th>Classe CNAE</th></tr></thead>
        <tbody>
          {segs.map((s) => (
            <tr key={s.slug}><td>{s.nome}</td><td>{s.classes.join(', ')}</td></tr>
          ))}
        </tbody>
      </table>

      <h2>Limite mínimo e privacidade</h2>
      <p>
        Só são publicadas combinações município × segmento com ao menos {n(minimo())} estabelecimentos ativos. Nenhum nome, endereço, telefone, e-mail ou
        dado de sócio é lido ou armazenado.
      </p>

      <h2>O que os números não mostram</h2>
      <ul>
        <li>Não medem faturamento, qualidade nem reputação; apenas existência cadastral.</li>
        <li>Estabelecimento ativo no cadastro pode estar sem operação real.</li>
        <li>Quem tem mais de uma atividade é contado só pela principal.</li>
        <li>Os dados têm defasagem em relação à data de publicação da Receita.</li>
      </ul>
      {meta.linhasLidas ? (
        <p className="nota">Nesta competência foram lidas {n(meta.linhasLidas)} linhas de estabelecimentos{meta.linhasNoEscopo ? `, das quais ${n(meta.linhasNoEscopo)} nos segmentos acompanhados` : ''}.</p>
      ) : null}

      <h2>Como citar</h2>
      <p>“Índice Filtra.AI, com base no CNPJ aberto da Receita Federal, competência {mesPorExtenso(meta.competencia)}. filtraai.com/indice”.</p>
      <Faq itens={faq} />
    </>
  );
}
