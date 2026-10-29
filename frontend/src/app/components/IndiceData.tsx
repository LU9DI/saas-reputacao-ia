import Link from 'next/link';
import snapshot from '../../generated/indice-snapshot.json';

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function mesPorExtenso(competencia: string) {
  const [ano, mes] = competencia.split('-');
  const nome = MESES[Number(mes) - 1] || competencia;
  return `${nome} de ${ano}`;
}

function dataCurta(iso: string) {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

const n = (valor: number) => valor.toLocaleString('pt-BR');

type SegmentoSlug = keyof typeof snapshot.segmentos;

/**
 * Bloco AEO com dado próprio do Índice Filtra.AI.
 *
 * Resposta direta + tabela + fonte + data + limites. É o tipo de conteúdo que
 * buscadores e motores generativos conseguem citar com verificação.
 */
export function IndiceData({ segmento }: { segmento?: SegmentoSlug }) {
  const dados = segmento ? snapshot.segmentos[segmento] : null;
  const ativos = dados ? dados.ativos : snapshot.todos.ativos;
  const municipios = dados ? dados.municipiosComPagina : snapshot.todos.municipiosComPagina;
  const estados = dados ? dados.estados : snapshot.todos.estados;
  const competencia = mesPorExtenso(snapshot.competencia);
  const recorte = dados ? `de ${dados.curto}` : 'nos nove segmentos acompanhados';
  const titulo = dados
    ? `Quantos ${dados.curto} com CNPJ ativo existem no Brasil?`
    : 'Quantos estabelecimentos ativos o Índice Filtra.AI acompanha?';
  const top = dados ? dados.topEstados : [];

  return (
    <section
      aria-labelledby="indice-data-titulo"
      className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
    >
      <h2 id="indice-data-titulo" className="text-lg font-semibold text-zinc-100">
        {titulo}
      </h2>

      <p className="text-sm leading-relaxed text-zinc-300">
        <strong className="text-zinc-100">Resposta direta:</strong> na competência {competencia}, o
        Índice Filtra.AI contabiliza <strong className="text-zinc-100">{n(ativos)}</strong>{' '}
        estabelecimentos com CNPJ ativo {recorte} no Brasil, em {n(municipios)} municípios com página
        publicada e {estados} estados. São contagens diretas do cadastro aberto de CNPJ da Receita
        Federal, não estimativas.
      </p>

      {top.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] border-collapse text-left text-sm">
            <caption className="pb-2 text-left text-xs text-zinc-500">
              Estados com mais estabelecimentos ativos {recorte}, competência {competencia}. Contagem
              de estabelecimentos, não de empresas únicas.
            </caption>
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                <th scope="col" className="py-2 pr-3 font-medium">Estado</th>
                <th scope="col" className="py-2 text-right font-medium">Estabelecimentos ativos</th>
              </tr>
            </thead>
            <tbody>
              {top.map((estado) => (
                <tr key={estado.uf} className="border-b border-zinc-900/80">
                  <th scope="row" className="py-2 pr-3 font-normal text-zinc-300">
                    {estado.nome} ({estado.uf})
                  </th>
                  <td className="py-2 text-right tabular-nums text-zinc-100">{n(estado.ativos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs leading-relaxed text-zinc-500">
        Fonte:{' '}
        <a href={snapshot.fonte.url} rel="noopener" className="underline hover:text-zinc-300">
          {snapshot.fonte.nome}
        </a>
        . Competência {competencia}, base gerada em {dataCurta(snapshot.geradoEm)}.{' '}
        <Link href="/indice/metodologia" className="underline hover:text-zinc-300">
          Metodologia do Índice
        </Link>{' '}
        e{' '}
        <Link href="/indice" className="underline hover:text-zinc-300">
          recortes por estado e município
        </Link>
        . O Índice mede estabelecimentos com situação cadastral ativa e não mede reputação, nota,
        faturamento ou qualidade.
      </p>
    </section>
  );
}
