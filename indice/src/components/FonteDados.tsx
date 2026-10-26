import Link from 'next/link';
import { getMeta } from '@/lib/data';
import { dataCurta, mesCurto, mesPorExtenso } from '@/lib/format';
import { FONTE_DADOS_ABERTOS_URL, FONTE_URL } from '@/lib/seo';

/**
 * Fonte, competência e janela no mesmo bloco, perto das tabelas.
 * A data exibida é a data real de geração da base, não a data de acesso.
 */
export function FonteDados({ compacto = false }: { compacto?: boolean }) {
  const meta = getMeta();
  return (
    <aside className="fonte" aria-labelledby="fonte-titulo">
      <h2 id="fonte-titulo">Fonte e período dos dados</h2>
      <dl>
        <div>
          <dt>Fonte primária</dt>
          <dd>
            <a href={FONTE_URL} rel="noopener">CNPJ — Dados Abertos, Receita Federal do Brasil</a>
          </dd>
        </div>
        <div>
          <dt>Competência</dt>
          <dd>{mesPorExtenso(meta.competencia)}</dd>
        </div>
        <div>
          <dt>Dados gerados em</dt>
          <dd><time dateTime={meta.geradoEm}>{dataCurta(meta.geradoEm)}</time></dd>
        </div>
        <div>
          <dt>Aberturas e baixas</dt>
          <dd>janela de 12 meses: {mesCurto(meta.janela.inicio)} a {mesCurto(meta.janela.fim)}</dd>
        </div>
        {!compacto && (
          <div>
            <dt>Página oficial</dt>
            <dd><a href={FONTE_DADOS_ABERTOS_URL} rel="noopener">Dados Abertos — Receita Federal</a></dd>
          </div>
        )}
      </dl>
      <p>
        Contagens de estabelecimentos com CNPJ, não de empresas únicas nem de reputação.
        {' '}<Link href="/metodologia">Metodologia e limites</Link>.
      </p>
    </aside>
  );
}
