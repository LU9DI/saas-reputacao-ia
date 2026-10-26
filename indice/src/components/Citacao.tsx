import { getMeta } from '@/lib/data';
import { dataCurta, mesPorExtenso } from '@/lib/format';
import { urlAbsoluta } from '@/lib/seo';

/**
 * Citação pronta, com competência, data de geração e URL canônica.
 * Não inventa autor pessoa física: a autoria é a entidade editorial Filtra.AI.
 */
export function Citacao({
  caminho = '/',
  titulo = 'Índice Filtra.AI: estabelecimentos ativos por município e segmento',
}: {
  caminho?: string;
  titulo?: string;
}) {
  const meta = getMeta();
  return (
    <section className="citacao-bloco">
      <h2>Como citar esta página</h2>
      <blockquote className="citacao">
        Filtra.AI. <em>{titulo}</em>. Competência {mesPorExtenso(meta.competencia)}. Dados gerados em {dataCurta(meta.geradoEm)}.
        {' '}Disponível em {urlAbsoluta(caminho)}.
      </blockquote>
      <p className="nota">
        Ao citar, informe a competência e a data de geração. Não atribua ao Filtra.AI números que não estejam nesta página.
      </p>
    </section>
  );
}
