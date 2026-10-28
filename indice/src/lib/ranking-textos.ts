import { getMeta, getSegmento, rankingDoSegmento, totalDoSegmento, type LinhaRanking, type Segmento } from './data';
import { mesCurto, mesPorExtenso, minuscula, n } from './format';
import { UFS } from './ufs';
import type { ItemFaq } from '@/components/Faq';

export const LIMITE_RANKING = 50;

const nomeMun = (l: LinhaRanking) => `${l.mun.nome} (${l.mun.uf})`;

/** "A (n), B (n) e C (n)"; empates na primeira posição são ditos como empate, não como liderança. */
function lideres(linhas: LinhaRanking[], campo: 'a' | 'ab', unidade: string): string {
  const topo = linhas.filter((l) => l.pos === 1);
  if (topo.length > 1) {
    return `${topo.slice(0, 3).map(nomeMun).join(', ')}${topo.length > 3 ? ' e outros' : ''} empatam na primeira posição, com ${n(topo[0][campo])} ${unidade}`;
  }
  const [a, b, c] = linhas;
  const resto = [b, c].filter(Boolean).map((l) => `${nomeMun(l)} (${n(l[campo])})`);
  return `${nomeMun(a)} lidera com ${n(a[campo])} ${unidade}${resto.length ? `, seguido de ${resto.join(' e ')}` : ''}`;
}

export type ModeloRanking = {
  seg: Segmento;
  uf?: string;
  escopo: string; // "no Brasil" | "em São Paulo"
  titulo: string;
  descricao: string;
  lead: string;
  porAtivos: LinhaRanking[];
  porAberturas: LinhaRanking[];
  totalMunicipios: number;
  totalEscopo: number;
  comp: string;
  janela: string;
  faq: ItemFaq[];
};

export function modeloDoRanking(segSlug: string, uf?: string): ModeloRanking | null {
  const seg = getSegmento(segSlug);
  if (!seg) return null;
  const todosAtivos = rankingDoSegmento(segSlug, 'a', uf);
  if (!todosAtivos.length) return null;
  const todosAbert = rankingDoSegmento(segSlug, 'ab', uf);
  const meta = getMeta();
  const comp = mesPorExtenso(meta.competencia);
  const janela = `${mesCurto(meta.janela.inicio)} a ${mesCurto(meta.janela.fim)}`;
  const escopo = uf ? `em ${UFS[uf]}` : 'no Brasil';
  const porAtivos = todosAtivos.slice(0, LIMITE_RANKING);
  const porAberturas = todosAbert.slice(0, LIMITE_RANKING);
  const totalEscopo = totalDoSegmento(segSlug, uf);

  const titulo = `Municípios com mais ${seg.curto} ${escopo}: ranking de ${comp}`;
  const lead = `${lideres(porAtivos, 'a', 'estabelecimentos ativos')} entre os municípios ${uf ? `de ${UFS[uf]}` : 'do Brasil'} com página no Índice, segundo o cadastro de CNPJ da Receita Federal (competência ${comp}). Em aberturas entre ${janela}, ${minuscula(lideres(porAberturas, 'ab', 'estabelecimentos que iniciaram atividade'))}.`;
  const descricao = `Ranking de municípios ${escopo} por estabelecimentos ativos de ${seg.curto} e por aberturas em 12 meses. Fonte: CNPJ aberto da Receita Federal, ${comp}.`;

  const faq: ItemFaq[] = [
    {
      pergunta: `Qual município tem mais ${seg.curto} ${escopo}?`,
      resposta: `${lideres(porAtivos, 'a', 'estabelecimentos com CNPJ ativo')}, na competência ${comp}. O ranking considera a atividade principal na classe CNAE ${seg.classes.join(', ')}.`,
    },
    {
      pergunta: 'Como este ranking é calculado?',
      resposta: `Cada município é ordenado pelo número de estabelecimentos com CNPJ ativo no segmento (ou, na segunda tabela, pelo número que iniciou atividade entre ${janela}). Matriz e filial contam separadamente. Municípios empatados dividem a mesma posição. Só entram municípios com ao menos ${n(meta.minimoParaIndexar)} estabelecimentos ativos no segmento.`,
    },
    {
      pergunta: 'O ranking de aberturas mostra qual município cresce mais?',
      resposta: `Não necessariamente. Ele usa o número absoluto de estabelecimentos que iniciaram atividade na janela, incluindo os que depois tiveram o CNPJ baixado; não é taxa de crescimento nem saldo. Municípios maiores tendem a ficar no topo por terem mais estabelecimentos.`,
    },
    {
      pergunta: 'O ranking indica os melhores lugares para esse tipo de negócio?',
      resposta: 'Não. Ele só conta estabelecimentos cadastrados. Demanda, concorrência por habitante, faturamento e reputação não fazem parte dos dados.',
    },
  ];
  return { seg, uf, escopo, titulo, descricao, lead, porAtivos, porAberturas, totalMunicipios: todosAtivos.length, totalEscopo, comp, janela, faq };
}
