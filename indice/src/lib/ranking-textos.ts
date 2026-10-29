import { getMeta, getSegmento, rankingDoSegmento, totalDoSegmento, type LinhaRanking, type Segmento } from './data';
import { mesPorExtenso, n } from './format';
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
  totalMunicipios: number;
  totalEscopo: number;
  comp: string;
  faq: ItemFaq[];
};

export function modeloDoRanking(segSlug: string, uf?: string): ModeloRanking | null {
  const seg = getSegmento(segSlug);
  if (!seg) return null;
  const todosAtivos = rankingDoSegmento(segSlug, 'a', uf);
  if (!todosAtivos.length) return null;
  const meta = getMeta();
  const comp = mesPorExtenso(meta.competencia);
  const escopo = uf ? `em ${UFS[uf]}` : 'no Brasil';
  const porAtivos = todosAtivos.slice(0, LIMITE_RANKING);
  const totalEscopo = totalDoSegmento(segSlug, uf);

  const titulo = `Municípios com mais ${seg.curto} ${escopo}: ranking de ${comp}`;
  const lead = `${lideres(porAtivos, 'a', 'estabelecimentos ativos')} entre os municípios ${uf ? `de ${UFS[uf]}` : 'do Brasil'} com página no Índice, segundo o cadastro de CNPJ da Receita Federal (competência ${comp}). O ranking considera estabelecimentos com situação cadastral ativa e atividade principal no segmento. Ele não mede reputação.`;
  const descricao = `Ranking de municípios ${escopo} por estabelecimentos ativos de ${seg.curto}. Fonte: CNPJ aberto da Receita Federal, ${comp}.`;

  const faq: ItemFaq[] = [
    {
      pergunta: `Qual município tem mais ${seg.curto} ${escopo}?`,
      resposta: `${lideres(porAtivos, 'a', 'estabelecimentos com CNPJ ativo')}, na competência ${comp}. O ranking considera a atividade principal na classe CNAE ${seg.classes.join(', ')}.`,
    },
    {
      pergunta: 'Como este ranking é calculado?',
      resposta: `Cada município é ordenado pelo número de estabelecimentos com CNPJ ativo no segmento. Matriz e filial contam separadamente. Municípios empatados dividem a mesma posição. Só entram municípios com ao menos ${n(meta.minimoParaIndexar)} estabelecimentos ativos no segmento.`,
    },
    {
      pergunta: 'O ranking indica os melhores lugares para esse tipo de negócio?',
      resposta: 'Não. Ele só conta estabelecimentos cadastrados. Demanda, concorrência por habitante, faturamento e reputação não fazem parte dos dados.',
    },
  ];
  return { seg, uf, escopo, titulo, descricao, lead, porAtivos, totalMunicipios: todosAtivos.length, totalEscopo, comp, faq };
}
