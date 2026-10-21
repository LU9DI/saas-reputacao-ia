# Diagnóstico de SEO — Google Search Console (19/10/2026)

## Escopo e limitações

Análise dos arquivos exportados do Search Console em 19 de outubro de 2026. O relatório de desempenho está filtrado para os últimos três meses, mas o gráfico exportado contém apenas as datas de 29/09 a 17/10/2026. O relatório de cobertura contém observações entre 28/09 e 11/10/2026. São amostras pequenas e recentes; não permitem afirmar tendência de longo prazo nem causalidade.

## Sinais observados

### Desempenho de pesquisa

- A tabela de páginas soma 119 impressões e 2 cliques nas linhas exportadas. A soma pode não representar todo o tráfego da propriedade, porque o Search Console exporta linhas limitadas.
- Brasil: 47 impressões, 0 cliques, posição média 40,53.
- Portugal: 29 impressões, 0 cliques, posição média 56,76.
- Computador: 83 impressões, 2 cliques, posição média 42,88; celular: 33 impressões, 0 cliques, posição média 47,76.
- Consulta “gestão de reputação online”: 18 impressões, 0 cliques, posição média 82,33.
- Consulta “gerir reputação organização”: 10 impressões, 0 cliques, posição média 60,5.
- Consulta “pacotes seo local”: 6 impressões, 0 cliques, posição média 27,83.
- Página `/blog/gestao-reputacao-online-guia`: 32 impressões, 0 cliques, posição média 76,25.
- Página `/gestao-de-reputacao-online`: 18 impressões, 0 cliques, posição média 76.
- Página inicial: 30 impressões, 0 cliques, posição média 3,67; é necessário inspecionar consultas associadas antes de atribuir a posição a uma palavra-chave relevante ou alterar o snippet por causa do CTR.
- Página `/agencias`: 8 impressões, 0 cliques, posição média 7,12; `/parceiros`: 7 impressões, 0 cliques, posição média 4,86. Precisam de mais dados por consulta antes de uma mudança específica.

### Indexação

No gráfico de cobertura exportado, o último ponto disponível é 11/10/2026: 42 URLs indexadas e 90 não indexadas. O relatório lista 80 URLs “detectadas, mas não indexadas”, 3 “rastreadas, mas não indexadas”, 3 redirecionadas, 2 com `noindex` e 2 cópias sem canônica selecionada pelo usuário.

As exclusões por redirecionamento e `noindex` podem ser intencionais e não devem ser corrigidas em massa. O grupo “detectadas, mas não indexadas” é a prioridade para uma inspeção URL a URL, mas este export não inclui a lista de URLs por motivo; portanto, não é possível identificar quais páginas específicas devem ser mantidas, consolidadas ou excluídas apenas com este arquivo.

## Mudanças aplicadas nesta PR

1. Separada a intenção de busca entre a página comercial e o guia informacional:
   - página comercial: “Software de gestão de reputação online”;
   - guia: “Como fazer gestão de reputação online: guia prático”.
2. O guia recebeu um plano de 30 dias, uma matriz de execução e indicadores concretos para aumentar sua utilidade, sem acrescentar estatísticas não verificadas.
3. Atualizado `dateModified` do Article schema e `lastModified` das duas páginas no sitemap para a data real da alteração.
4. Mantidos canonical URLs existentes; não foram criados redirecionamentos, removidas páginas ou alteradas regras de indexação sem evidência URL a URL.

## Próximas ações prioritárias

1. Exportar do Search Console a tabela de páginas de cada motivo de exclusão, especialmente “detectada, mas não indexada”, com URLs completas.
2. Inspecionar as páginas prioritárias e verificar status HTTP, canonical declarada/selecionada, renderização, conteúdo principal, links internos e presença no sitemap.
3. Exportar desempenho por consulta e página com janela de 28 dias e comparação com os 28 dias anteriores; segmentar Brasil e dispositivos.
4. Revisar a indexação de URLs localizadas e páginas de baixo valor com base na lista real, não por suposição.
5. Após publicação, acompanhar por URL impressões, cliques, CTR e posição em 14, 28 e 56 dias. Não declarar sucesso antes de haver amostra suficiente.

## Restrições

Nenhum deploy, alteração em produção ou pedido de indexação foi executado. A PR continua em rascunho até revisão e aprovação.
