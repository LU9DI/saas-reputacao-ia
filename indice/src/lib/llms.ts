import {
  coberturaDoSegmento,
  getMeta,
  getMunicipio,
  getPagina,
  getSegmento,
  getSegmentos,
  minimo,
  municipiosDaUF,
  resumoDoIndice,
  segmentosDoMunicipio,
  ufsComDados,
} from './data';
import { dataCurta, mesCurto, mesPorExtenso, n, pct } from './format';
import { BASE, FONTE_DADOS_ABERTOS_URL, FONTE_URL } from './seo';
import { UFS, ufDeSlug } from './ufs';
import { anosPublicadosDoSegmento, getPaginaRanking, nomeDoMunicipio } from './rankings';

/**
 * Representações em texto para agentes (GEO/AEO).
 *
 * Convenção emergente, não padrão: o Google declara não usar llms.txt. O custo
 * é baixo porque tudo é derivado dos mesmos dados do site, e o HTML continua
 * sendo a URL canônica. Nenhum texto aqui inventa número ou promete indexação.
 */

const html = (caminho: string) => `${BASE}${caminho === '/' ? '' : caminho}`;
const md = (caminho: string) => `${BASE}/md${caminho === '/' ? '' : caminho}`;

function cabecalho(caminho: string) {
  const meta = getMeta();
  const linhas = [
    `Fonte canônica: ${html(caminho)}`,
    'Idioma: pt-BR',
    `Atualizado: ${meta.geradoEm.slice(0, 10)}`,
    `Competência: ${meta.competencia}`,
  ];
  return `> ${linhas.join(' · ')}\n`;
}

function limites() {
  return [
    `O Índice cobre apenas os ${getSegmentos().length} segmentos acompanhados, definidos pela atividade econômica principal (CNAE).`,
    `Só publica páginas para combinações município × segmento com pelo menos ${n(minimo())} estabelecimentos ativos. Abaixo disso a rota responde 404 e fica fora do sitemap.`,
    'Conta estabelecimentos (matriz e filial separadamente), não empresas únicas.',
    'Não mede reputação, nota, faturamento, qualidade, participação de mercado nem o total de empresas brasileiras.',
    'Não inclui negócios informais, empresas sem CNPJ nem atividades que aparecem apenas como secundárias no cadastro.',
    'Não usa amostragem, extrapolação ou imputação. O que não existe na fonte aparece como indisponível, não como zero.',
  ];
}

function fonte() {
  const meta = getMeta();
  return [
    `- Fonte primária: ${meta.fonte.nome} — ${FONTE_URL}`,
    `- Portal de dados abertos: ${FONTE_DADOS_ABERTOS_URL}`,
    `- Competência: ${mesPorExtenso(meta.competencia)}`,
    `- Janela de aberturas e baixas: ${mesCurto(meta.janela.inicio)} a ${mesCurto(meta.janela.fim)}`,
    `- Data de geração: ${dataCurta(meta.geradoEm)}`,
  ].join('\n');
}

function tabelaSegmentos() {
  const comp = mesPorExtenso(getMeta().competencia);
  const linhas = getSegmentos().map((seg) => {
    const c = coberturaDoSegmento(seg.slug);
    return `| ${seg.nome} | ${n(c.total)} | ${n(c.municipiosComPagina)} de ${n(c.municipiosNoSegmento)} | ${pct(c.totalNasPaginas, c.total)} |`;
  });
  return [
    `| Segmento | Ativos no Brasil (${comp}) | Municípios com página | Cobertura nas páginas |`,
    '| --- | ---: | ---: | ---: |',
    ...linhas,
  ].join('\n');
}

function listaEstados() {
  return ufsComDados()
    .map(
      (u) =>
        `- ${u.nome} (${u.sigla}): ${html(`/${u.sigla.toLowerCase()}`)} — ${n(u.municipios)} municípios com página, ${n(u.estabelecimentos)} estabelecimentos nas páginas`,
    )
    .join('\n');
}

function listaRankings() {
  const linhas = getSegmentos().flatMap((s) => {
    const anos = anosPublicadosDoSegmento(s.slug);
    return anos.length
      ? [`## ${s.nome}`, ...anos.map((a) => `- Aberturas de ${s.curto} em ${a}: ${html(`/rankings/aberturas/${s.slug}/${a}`)} · Markdown: ${md(`/rankings/aberturas/${s.slug}/${a}`)}`)]
      : [];
  });
  return linhas.length ? [`- Hub de rankings: ${html('/rankings/aberturas')} · Markdown: ${md('/rankings/aberturas')}`, '', ...linhas] : [];
}

function listaAtivos() {
  const linhas = getSegmentos().map((s) => `- ${s.nome}: ${html(`/rankings/ativos/${s.slug}`)}`);
  return linhas.length ? [`- Hub de rankings de ativos: ${html('/rankings/ativos')}`, '', ...linhas] : [];
}

export function llmsIndex(): string {
  const meta = getMeta();
  const resumo = resumoDoIndice();
  const comp = mesPorExtenso(meta.competencia);
  return [
    '# Índice Filtra.AI',
    '',
    '> Contagens mensais de estabelecimentos com CNPJ ativo por município e segmento, derivadas do cadastro aberto da Receita Federal do Brasil.',
    '',
    'O Índice Filtra.AI é uma publicação de dados abertos do Filtra.AI. Ele agrega estabelecimentos por situação cadastral, atividade econômica principal (CNAE) e município. Não mede reputação, faturamento ou qualidade e não é o total de empresas brasileiras.',
    '',
    `Na competência ${comp}, os ${resumo.segmentos} segmentos somam ${n(resumo.ativosNosSegmentos)} estabelecimentos ativos em todos os municípios da base. As páginas publicadas cobrem ${n(resumo.ativosNasPaginas)} deles (${pct(resumo.ativosNasPaginas, resumo.ativosNosSegmentos)}) em ${n(resumo.municipiosComPagina)} municípios de ${resumo.ufs} estados.`,
    '',
    '## Páginas principais',
    `- Home do Índice: ${html('/')}`,
    `- Metodologia (fonte, fórmulas, limites e contestação): ${html('/metodologia')}`,
    `- Sitemap do Índice: ${html('/sitemap-index.xml')}`,
    `- Versão em Markdown da home: ${md('/')}`,
    '',
    '## Estados',
    listaEstados(),
    '',
    '## Rankings de aberturas por ano',
    ...listaRankings(),
    '',
    '## Rankings de estabelecimentos ativos',
    ...listaAtivos(),
    '',
    '## Segmentos acompanhados',
    getSegmentos().map((s) => `- ${s.nome} (${s.slug}; CNAE ${s.classes.join(', ')})`).join('\n'),
    '',
    '## Versões em Markdown',
    'As páginas principais, as UFs e os rankings de aberturas têm uma versão `.md` com o mesmo dado, sem navegação nem scripts, em `https://filtraai.com/indice/md/<caminho>`. A URL canônica continua sendo a página HTML. As versões `.md` ficam fora do sitemap e são descobertas por este arquivo.',
    '',
    '## Limites',
    ...limites().map((l) => `- ${l}`),
    '',
    '## Fonte e atualização',
    fonte(),
    '',
    'A ingestão é mensal, com rotina programada para o dia 15, e pode atrasar ou falhar. A página exibe a competência e a data de geração efetivamente processadas; não há atualização em tempo real nem garantia de publicação em um dia fixo.',
    '',
    'Publicar este arquivo, o sitemap ou os dados não promete indexação, ranqueamento ou citação em buscadores e assistentes.',
    '',
  ].join('\n');
}

export function llmsFull(): string {
  const meta = getMeta();
  const resumo = resumoDoIndice();
  const comp = mesPorExtenso(meta.competencia);
  return [
    '# Índice Filtra.AI — referência completa',
    '',
    '## O que é',
    'O Índice Filtra.AI é um levantamento mensal de estabelecimentos com CNPJ ativo nos segmentos acompanhados, agregados por estado e município a partir do cadastro aberto da Receita Federal. Ele conta unidades cadastradas — matrizes e filiais separadamente — e não mede reputação, faturamento nem o total de empresas brasileiras.',
    '',
    '## Números da competência',
    `- Competência: ${comp}`,
    `- Estabelecimentos ativos nos ${resumo.segmentos} segmentos (Brasil): ${n(resumo.ativosNosSegmentos)}`,
    `- Estabelecimentos nas páginas publicadas: ${n(resumo.ativosNasPaginas)} (${pct(resumo.ativosNasPaginas, resumo.ativosNosSegmentos)})`,
    `- Municípios com página: ${n(resumo.municipiosComPagina)}`,
    `- Estados com dados: ${resumo.ufs}`,
    '',
    '## Cobertura por segmento',
    tabelaSegmentos(),
    '',
    '## Metodologia resumida',
    '1. Lemos os arquivos públicos de estabelecimentos do CNPJ e validamos o layout antes de agregar.',
    '2. Classificamos cada estabelecimento pela atividade econômica principal (CNAE) nos segmentos acompanhados.',
    '3. Contamos por município: estabelecimentos ativos, quantos são matriz, aberturas e baixas na janela de 12 meses e a distribuição por subclasse CNAE.',
    `4. Publicamos páginas apenas para combinações com pelo menos ${n(minimo())} estabelecimentos ativos.`,
    '5. O ranking compara municípios dentro do segmento; empates dividem a mesma posição.',
    '',
    '## O que não é medido',
    ...limites().map((l) => `- ${l}`),
    '',
    '## Como citar',
    `Índice Filtra.AI, competência ${comp}, gerado em ${dataCurta(meta.geradoEm)}. Disponível em ${html('/')}. Fonte primária: ${meta.fonte.nome}.`,
    '',
    '## Páginas e representações',
    `- Home: ${html('/')} · Markdown: ${md('/')}`,
    `- Metodologia: ${html('/metodologia')} · Markdown: ${md('/metodologia')}`,
    `- Sitemap: ${html('/sitemap-index.xml')}`,
    ...listaRankings(),
    ...listaAtivos(),
    ...ufsComDados().map(
      (u) => `- ${u.nome} (${u.sigla}): ${html(`/${u.sigla.toLowerCase()}`)} · Markdown: ${md(`/${u.sigla.toLowerCase()}`)}`,
    ),
    '',
    '## Fonte e atualização',
    fonte(),
    '',
    'A ingestão é mensal e pode atrasar ou falhar. Não há atualização em tempo real. Publicar este arquivo, o sitemap ou os dados não promete indexação, ranqueamento ou citação em buscadores e assistentes.',
    '',
  ].join('\n');
}

type Markdown = { htmlUrl: string; corpo: string };

export function markdownDaPagina(caminho: string[]): Markdown | null {
  const meta = getMeta();
  const comp = mesPorExtenso(meta.competencia);
  const partes = caminho.filter(Boolean);
  if (partes.some((p) => p !== p.toLowerCase())) return null;

  if (partes.length === 0) {
    const resumo = resumoDoIndice();
    return {
      htmlUrl: html('/'),
      corpo: [
        cabecalho('/'),
        '',
        '# Estabelecimentos ativos por município e segmento no Brasil',
        '',
        `O Índice Filtra.AI reúne contagens mensais de estabelecimentos com CNPJ ativo nos ${resumo.segmentos} segmentos acompanhados, por estado e município, na competência ${comp}.`,
        '',
        `- Estabelecimentos ativos nos segmentos: ${n(resumo.ativosNosSegmentos)}`,
        `- Estabelecimentos nas páginas publicadas: ${n(resumo.ativosNasPaginas)}`,
        `- Municípios com página: ${n(resumo.municipiosComPagina)}`,
        `- Estados com dados: ${resumo.ufs}`,
        '',
        '## Cobertura por segmento',
        tabelaSegmentos(),
        '',
        '## Estados',
        listaEstados(),
        '',
        '## Limites',
        ...limites().map((l) => `- ${l}`),
        '',
        '## Fonte',
        fonte(),
        '',
      ].join('\n'),
    };
  }

  if (partes.length === 1 && partes[0] === 'metodologia') {
    return {
      htmlUrl: html('/metodologia'),
      corpo: [
        cabecalho('/metodologia'),
        '',
        '# Metodologia do Índice Filtra.AI',
        '',
        `O Índice mede a quantidade de estabelecimentos com situação cadastral ativa no CNPJ, por município e por segmento definido pela atividade econômica principal, na competência ${comp}. Também conta matrizes, aberturas e baixas na janela de ${mesCurto(meta.janela.inicio)} a ${mesCurto(meta.janela.fim)}.`,
        '',
        '## Etapas',
        '1. Ingestão dos arquivos públicos de estabelecimentos do CNPJ, com validação de layout antes da agregação.',
        '2. Classificação pela atividade econômica principal (CNAE) nos segmentos acompanhados.',
        `3. Agregação por município e segmento; publicação apenas a partir de ${n(minimo())} estabelecimentos ativos.`,
        '4. Ranking de competição dentro do segmento, com empates na mesma posição.',
        '',
        '## O que não é medido',
        ...limites().map((l) => `- ${l}`),
        '',
        '## Fonte e atualização',
        fonte(),
        '',
        'A ingestão é mensal, com rotina programada para o dia 15, e pode atrasar ou falhar. A página informa a competência e a data de geração efetivamente processadas.',
        '',
      ].join('\n'),
    };
  }

  if (partes[0] === 'rankings' && partes[1] === 'aberturas') {
    if (partes.length === 2) {
      return {
        htmlUrl: html('/rankings/aberturas'),
        corpo: [
          cabecalho('/rankings/aberturas'),
          '',
          '# Rankings de aberturas por ano',
          '',
          `Municípios com mais estabelecimentos abertos por ano completo, contados pela data de início de atividade na base da Receita Federal, competência ${comp}. Só anos fechados têm ranking; aberturas e baixas são eventos distintos e não formam saldo.`,
          '',
          ...listaRankings(),
          '',
          '## Limites',
          ...limites().map((l) => `- ${l}`),
          '',
          '## Fonte',
          fonte(),
          '',
        ].join('\n'),
      };
    }
    if (partes.length === 4) {
      const p = getPaginaRanking(partes[2], partes[3]);
      if (!p) return null;
      const caminho = `/rankings/aberturas/${partes[2]}/${partes[3]}`;
      return {
        htmlUrl: html(caminho),
        corpo: [
          cabecalho(caminho),
          '',
          `# Ranking de aberturas de ${p.seg.nome} em ${p.ano} por município`,
          '',
          p.resposta,
          '',
          `- Aberturas no Brasil em ${p.ano}: ${n(p.ranking.total)}`,
          `- Municípios com ao menos uma abertura: ${n(p.ranking.municipiosComAbertura)}`,
          `- Estados com abertura registrada: ${n(p.ranking.porUF.length)}`,
          '',
          '## Os 10 municípios com mais aberturas',
          '| Posição | Município | Aberturas | Parcela |',
          '| ---: | --- | ---: | ---: |',
          ...p.ranking.ordenado.slice(0, 10).map(
            (item) => `| ${item.posicao} | ${nomeDoMunicipio(item.uf, item.municipio)} (${item.uf}) | ${n(item.v)} | ${pct(item.v, p.ranking.total)} |`,
          ),
          '',
          '## Limites',
          ...limites().map((l) => `- ${l}`),
          '',
          '## Fonte',
          fonte(),
          '',
        ].join('\n'),
      };
    }
    return null;
  }

  const sigla = ufDeSlug(partes[0]);
  if (!sigla) return null;

  if (partes.length === 1) {
    const municipios = municipiosDaUF(sigla);
    if (!municipios.length) return null;
    const coberturas = getSegmentos()
      .map((seg) => ({ seg, c: coberturaDoSegmento(seg.slug, sigla) }))
      .filter(({ c }) => c.totalNasPaginas > 0);
    const totalEstado = coberturas.reduce((t, x) => t + x.c.total, 0);
    const totalPublicado = coberturas.reduce((t, x) => t + x.c.totalNasPaginas, 0);
    return {
      htmlUrl: html(`/${partes[0]}`),
      corpo: [
        cabecalho(`/${partes[0]}`),
        '',
        `# Estabelecimentos ativos por segmento em ${UFS[sigla]} (${sigla})`,
        '',
        `${UFS[sigla]} tem ${n(totalPublicado)} estabelecimentos ativos nas páginas publicadas do Índice, em ${n(municipios.length)} municípios, na competência ${comp}. Isso cobre ${pct(totalPublicado, totalEstado)} dos ${n(totalEstado)} estabelecimentos dos segmentos acompanhados no estado.`,
        '',
        '## Cobertura por segmento',
        '| Segmento | Ativos no estado | Municípios com página | Cobertura nas páginas |',
        '| --- | ---: | ---: | ---: |',
        ...coberturas.map(
          ({ seg, c }) =>
            `| ${seg.nome} | ${n(c.total)} | ${n(c.municipiosComPagina)} de ${n(c.municipiosNoSegmento)} | ${pct(c.totalNasPaginas, c.total)} |`,
        ),
        '',
        '## Municípios com página',
        ...municipios.map(
          (m) =>
            `- ${m.mun.nome}: ${html(`/${partes[0]}/${m.mun.slug}`)} — ${n(m.total)} estabelecimentos em ${n(m.segmentos)} segmentos`,
        ),
        '',
        '## Limites',
        ...limites().map((l) => `- ${l}`),
        '',
        '## Fonte',
        fonte(),
        '',
      ].join('\n'),
    };
  }

  if (partes.length === 2) {
    const mun = getMunicipio(sigla, partes[1]);
    if (!mun) return null;
    const segs = segmentosDoMunicipio(sigla, partes[1]);
    if (!segs.length) return null;
    const total = segs.reduce((t, s) => t + s.reg.a, 0);
    return {
      htmlUrl: html(`/${partes[0]}/${partes[1]}`),
      corpo: [
        cabecalho(`/${partes[0]}/${partes[1]}`),
        '',
        `# Estabelecimentos ativos por segmento em ${mun.nome} (${sigla})`,
        '',
        `${mun.nome} tem ${n(total)} estabelecimentos ativos nos ${segs.length} segmentos acompanhados com página, na competência ${comp}.`,
        '',
        '| Segmento | Ativos | Matrizes | Aberturas (12 meses) | Baixas (12 meses) |',
        '| --- | ---: | ---: | ---: | ---: |',
        ...segs.map(
          ({ seg, reg }) =>
            `| ${seg.nome} (${html(`/${partes[0]}/${partes[1]}/${seg.slug}`)}) | ${n(reg.a)} | ${n(reg.m)} | ${n(reg.ab)} | ${n(reg.ba)} |`,
        ),
        '',
        '## Limites',
        ...limites().map((l) => `- ${l}`),
        '',
        '## Fonte',
        fonte(),
        '',
      ].join('\n'),
    };
  }

  if (partes.length === 3) {
    const pagina = getPagina(sigla, partes[1], partes[2]);
    if (!pagina) return null;
    const seg = getSegmento(partes[2]);
    if (!seg) return null;
    const { reg } = pagina;
    return {
      htmlUrl: html(`/${partes[0]}/${partes[1]}/${partes[2]}`),
      corpo: [
        cabecalho(`/${partes[0]}/${partes[1]}/${partes[2]}`),
        '',
        `# ${seg.nome} em ${pagina.mun.nome} (${sigla}): ${n(reg.a)} estabelecimentos ativos`,
        '',
        `${pagina.mun.nome} tem ${n(reg.a)} estabelecimentos com CNPJ ativo de ${seg.curto} na competência ${comp}, segundo o cadastro aberto da Receita Federal.`,
        '',
        `- Posição no estado: ${pagina.rankUF}º de ${n(pagina.totalRankUF)} municípios do segmento`,
        `- Posição no Brasil: ${pagina.rankBR}º de ${n(pagina.totalRankBR)} municípios do segmento`,
        `- Matrizes: ${n(reg.m)}`,
        `- Aberturas na janela de 12 meses: ${n(reg.ab)}`,
        `- Baixas na janela de 12 meses: ${n(reg.ba)}`,
        `- Participação no segmento no estado: ${pct(reg.a, pagina.totalUF)}`,
        `- Participação no segmento no Brasil: ${pct(reg.a, pagina.totalBR)}`,
        '',
        `## Outros segmentos em ${pagina.mun.nome}`,
        ...pagina.outrosSegmentos.map(
          ({ seg: s, reg: r }) => `- ${s.nome}: ${n(r.a)} ativos — ${html(`/${partes[0]}/${partes[1]}/${s.slug}`)}`,
        ),
        '',
        '## Limites',
        ...limites().map((l) => `- ${l}`),
        '',
        '## Fonte',
        fonte(),
        '',
      ].join('\n'),
    };
  }

  return null;
}



