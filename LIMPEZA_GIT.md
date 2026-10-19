# Higiene do repositório Git

Este documento descreve práticas seguras para manter o repositório Filtra.AI organizado.

## Regras

- Não versionar `.env`, credenciais, tokens, bancos locais (`*.db`, `*.sqlite`) ou diretórios de build/cache.
- Conferir `.gitignore` antes de adicionar artefatos gerados.
- Não remover bancos ou arquivos de configuração de produção como parte de uma limpeza genérica.
- Não reescrever o histórico compartilhado nem usar `git push --force` para remover arquivos.
- Antes de remover um arquivo, verificar imports, referências, scripts de build, workflows e uso em runtime.
- Fazer a limpeza em branch própria e validar os testes aplicáveis antes de abrir PR.

## Se um segredo ou dado sensível foi versionado

Remover o arquivo do último commit não elimina cópias do histórico. Rotacione/revogue o segredo primeiro e siga um procedimento de resposta a incidente; reescrita de histórico exige planejamento e coordenação explícitos.

## Verificação local

```bash
git status --short
git ls-files | grep -Ei '(^|/)(\.env|.*\.(db|sqlite))$'
```

O segundo comando deve ser revisado manualmente: arquivos de exemplo como `.env.example` podem ser legítimos e não devem ser removidos.
