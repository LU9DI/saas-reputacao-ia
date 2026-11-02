# FILTRA DOT — Recuperação do repositório-alvo

**Data:** 2026-11-02
**Objetivo:** determinar se o repositório-alvo original (`C:\Users\lucas\work\saas-dot`, branch
`fix/dot-autorizacao-aprovacao`, HEAD `88305729e6…310ce`) ainda está disponível, íntegro e com as
alterações anteriores preservadas.
**Modo da operação:** somente leitura. Nenhum `commit`, `push`, `merge`, `cherry-pick`, `reset`,
`clean`, `checkout` destrutivo ou `fetch` foi executado. Nenhum teste foi rodado nesta etapa.

## Classificação

**`AGUARDANDO ACESSO AO REPOSITÓRIO-ALVO` — repositório-alvo NÃO ENCONTRADO neste ambiente.**

O clone disponível aqui (`/workspace`, `LU9DI/saas-reputacao-ia`) **não é** o repositório-alvo e não
contém nenhum vestígio do trabalho descrito (branch, relatórios PHASE2/PHASE3/FINAL_AUDIT, harness
PostgreSQL, 35 modificados + 49 não rastreados). A auditoria **não pode continuar** até o
repositório correto ser disponibilizado. A validação PostgreSQL da etapa anterior permanece
**inválida para o repositório-alvo** e não deve ser reaproveitada.

---

## 1. Verificação 1 — o caminho `C:\Users\lucas\work\saas-dot` existe?

**Não.** Evidências:

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Caminho estilo Windows | `ls '/c/Users/lucas/work/saas-dot'` | `No such file or directory` |
| Montagens de host/disco Windows | `ls /mnt` | vazio |
| Diretórios `saas-dot*` no sistema | `find / -maxdepth 5 -type d -name 'saas-dot*'` | nenhum |
| Diretórios com `saas` no nome | `find / -maxdepth 6 -type d -name '*saas*'` | nenhum |
| Repositórios git no sistema | `find / -maxdepth 5 -type d -name '.git'` | apenas `/workspace/.git` |
| Repositórios bare/espelhos | `find / -maxdepth 6 -type d -name '*.git'` | nenhum além de `/workspace/.git` |

O ambiente é Linux, com apenas um volume (`/workspace` em `/dev/nvme0n13`). Não existe `/mnt/c`,
`C:` nem qualquer ponte para a máquina Windows onde o repositório-alvo residia.

**Consequência:** integridade e preservação das alterações locais do repositório-alvo **não podem
ser verificadas** por este ambiente.

## 2. Verificação 2 — branch, HEAD, remotes e `git status --porcelain` do clone disponível

```
origin  https://github.com/LU9DI/saas-reputacao-ia.git (fetch/push)
worktree: /workspace  9d87d452 [cline/ae79k7nx]

branch: cline/ae79k7nx
HEAD:   9d87d45296bbe3d256a62697b361fa81753cfe5b
main:   4e6439ea8f7d3da734f3fe0a1664768b44d04a3d
git status --porcelain: (vazio — árvore limpa)
git stash list: (vazio)
```

Reflog (prova de que o clone nasceu nesta sessão, sem trabalho anterior):

```
9d87d452 HEAD@{2026-11-02}: commit: docs(dot): corrigir tamanho do log e HEAD final registrado
614e79dc HEAD@{2026-11-02}: commit: docs(dot): registrar segunda execução e estado final…
5008d8d1 HEAD@{2026-11-02}: commit: docs(dot): relatório da validação PostgreSQL e adendo de risco F3
dcba4e63 HEAD@{2026-11-02}: commit: test(dot): harness PostgreSQL real…
4e6439ea HEAD@{2026-11-02}: checkout: moving from main to cline/ae79k7nx
4e6439ea HEAD@{2026-11-02}: clone: from https://github.com/LU9DI/saas-reputacao-ia.git
```

## 3. Verificação 3 — a branch `fix/dot-autorizacao-aprovacao` está disponível localmente?

**Não. Não existe localmente, nem em `origin`, nem como PR.**

| Verificação | Resultado |
| --- | --- |
| `git branch --list '*dot-autorizacao*'` | vazio |
| `git rev-parse --verify refs/heads/fix/dot-autorizacao-aprovacao` | `fatal: Needed a single revision` |
| `git branch -r --list '*dot-autorizacao*'` | vazio |
| `git ls-remote --heads origin \| grep -i dot-autoriza` | vazio |
| PRs (abertos + fechados + mergeados, limite 300) com `autoriza` no título/head | nenhum (o único casamento por “pin” foi `#150 chore/indice-keepalive` — “**pin**g periódico”) |

Branches remotas no clone: **174 refs** em `refs/remotes/*`; `refs/pull/*/head` no remoto: **163**.
Nenhuma se chama `fix/dot-autorizacao-aprovacao`.

## 4. Verificação 4 — o commit `88305729e6…310ce` está presente?

**Presente, mas com conteúdo não relacionado à autorização do Dot.**

```
$ git cat-file -t 88305729
commit
$ git log -1 --format='%H%n%an <%ae>%n%ad%n%s' 88305729
88305729e6035e56f66fee4b4bc63117ca9310ce
Lucas <bostavacabosta@gmail.com>
Thu Oct 29 20:41:52 2026 -0300
perf(indice): reduzir alocação de memória na geração do sitemap (#159)
```

- É **ancestral de `main`**: `git rev-list --count 88305729..main` = **12 commits**.
- Nesse ponto existem os serviços do Dot (`backend/services/dot*.ts`, `backend/routes/dot*.ts`).
- **Não** existem, na árvore desse commit, `docs/FILTRA_DOT_*` nem
  `backend/tests/postgres.dot.integration.test.ts` (`git ls-tree -r --name-only 88305729 | grep -iE
  'FILTRA_DOT|postgres\.dot'` → vazio).
- `git log 88305729..main -- 'backend/services/dot*' 'backend/routes/dot*' 'backend/tests/dot*'` →
  vazio: os 12 commits posteriores não tocam o Dot.

Como o Git endereça por conteúdo, esse SHA é **idêntico** em qualquer repositório que o contenha.
Logo, o “HEAD de referência” do pedido corresponde, neste histórico, a um commit de performance do
sitemap; a branch que deveria carregá-lo como trabalho de autorização do Dot **não é rastreável
daqui**.

## 5. Verificação 5 — alterações locais, não rastreados, relatórios e backups

No clone disponível a árvore está limpa; o único conteúdo “local” são os 3 commits da etapa
anterior (enviados a `origin/cline/ae79k7nx`):

| Arquivo | Origem |
| --- | --- |
| `backend/tests/postgres.dot.integration.test.ts` | commit `dcba4e63` (etapa anterior) |
| `backend/tests/support/dotConcurrencyWorker.ts` | commit `dcba4e63` |
| `backend/scripts/run-dot-pg-validation.sh` | commit `5008d8d1` |
| `docs/FILTRA_DOT_OPERATIONAL_VALIDATION.md` | commits `5008d8d1`, `614e79dc`, `9d87d452` |
| `docs/FILTRA_DOT_OPERATIONAL_VALIDATION_ADDENDUM.md` | commit `5008d8d1` |

Backups / artefatos procurados e **não encontrados**:

| Procurado | Resultado |
| --- | --- |
| `git stash list` | vazio |
| Diretórios `*backup*` no disco | apenas `/workspace/backend/lib/backup.ts` (código de backup do produto) |
| `*.bundle`, `*.orig`, `*.bak` | nenhum |
| Tags git | nenhuma |
| Objetos inalcançáveis (`git fsck --unreachable --no-reflogs`) | **nenhum** — não há commits órfãos recuperáveis |
| `refs/backup/*` | apenas `origin/backup/dot-company-execution-green-20261006` (branch remota antiga do Dot) |
| Arquivos ignorados na árvore | apenas `.cline-home/` |

**As “35 alterações modificadas + 49 não rastreadas” do repositório-alvo não têm nenhum vestígio
aqui.**


## 6. Verificação 6 — localização dos artefatos citados

| Artefato | Existe no clone? | Onde aparece | Evidência |
| --- | --- | --- | --- |
| `docs/FILTRA_DOT_PHASE2.md` | **Não** | em nenhum ref | varredura de 174 refs + `git log --all -- 'docs/FILTRA_DOT*'` |
| `docs/FILTRA_DOT_PHASE3.md` | **Não** | em nenhum ref | idem |
| `docs/FILTRA_DOT_FINAL_AUDIT.md` | **Não** | em nenhum ref | idem |
| `backend/tests/postgres.dot.integration.test.ts` | **Sim, apenas** na branch `cline/ae79k7nx` | criado nesta auditoria, não é do alvo | `git log --all -- 'backend/tests/postgres.dot*'` → só `dcba4e63` e `5008d8d1` |
| `docs/FILTRA_DOT_OPERATIONAL_VALIDATION*.md` | **Sim** | `cline/ae79k7nx` | criado nesta auditoria |

Varreduras executadas (nenhuma escrita):

1. `for r in $(git for-each-ref …); do git ls-tree -r --name-only "$r" | grep -iE 'FILTRA_DOT|postgres\.dot|dot.*integration'` — **174 refs**, únicos achados: `refs/heads/cline/ae79k7nx` e `refs/remotes/origin/cline/ae79k7nx`.
2. `git log --all --oneline --name-only -- 'docs/FILTRA_DOT*'` — apenas os 3 commits da etapa anterior.
3. `gh search code 'FILTRA_DOT_FINAL_AUDIT' --repo LU9DI/saas-reputacao-ia` — sem resultados.
4. `gh search code 'postgres.dot.integration' --repo LU9DI/saas-reputacao-ia` — sem resultados.
5. `gh api repos/LU9DI/saas-reputacao-ia/pulls/{n}/files` nos **25 PRs** cujo título/head menciona “dot” — nenhum contém `FILTRA_DOT*` nem `postgres.dot*`.

**Conclusão:** os três relatórios anteriores e o harness do repositório-alvo **nunca existiram** no
`LU9DI/saas-reputacao-ia`. Eles pertencem a um repositório diferente (`saas-dot`) que não está
acessível aqui.

## 7. Verificação 7 — implementação efetiva de PIN, sessões administrativas, lockout e expiração

**Nenhuma dessas funcionalidades existe no código do Dot em nenhum ref deste repositório.**

| Procura | Escopo | Resultado |
| --- | --- | --- |
| `pin_hash`, `pin_attempts`, `dot_sessions`, `session_expires`, `expires_at` | `backend/` em `origin/main`, `origin/security/dot-http-only-session`, `origin/backup/dot-company-execution-green-20261006`, `origin/codex/dot-final-reconcile-20261017`, `origin/codex/dot-real-internal-execution`, `origin/feat/filtra-dot-localhost`, `origin/fix/dot-capability-contract` | apenas `expires_at` de **PIX** (`backend/routes/pixRoutes.ts`, branch `feat/filtra-dot-localhost`) |
| `locked_until` | `backend/` nos mesmos refs | apenas `acquisition_locked_until` (**lock de captação de leads**, `backend/routes/acquisitionRoutes.ts`) — nada de PIN |
| `\bpin\b`, `lockout`, `tentativas_invalidas` | `backend/services/dot*`, `backend/routes/dot*` | **zero** ocorrências |
| PRs Dot e arquivos com `pin`/`session`/`lockout`/`autoriz` | 25 PRs relacionados a Dot | **nenhum** |
| Sessão administrativa server-side | `backend/lib/auth.ts`, `backend/routes/dotRoutes.ts` | `security/dot-http-only-session` usa **cookie HttpOnly com JWT** (`saas_auth_token`, `setAuthCookie`), sem tabela de sessão, sem `expires_at` de sessão e sem revogação server-side |
| Estado da sessão no Dot | `backend/routes/dotRoutes.ts` (main e `cline/ae79k7nx`) | histórico de chat em `Map` de memória (`sessions`), sem expiração e sem persistência |

Autenticação do Dot hoje: JWT (`verifyAccessToken`) + `findEmpresa` + `empresaTemAcesso`;
autorização por `dot_agent_permissions`/`dot_access_audit`. Não há PIN, não há lockout por
tentativas e não há sessão administrativa expirável.

**Implicação direta:** os cenários 2 e 3 da solicitação original (lockout de PIN e expiração de
sessão) **não podem ser testados em nenhum código deste repositório** — nem no alvo, enquanto o alvo
não for disponibilizado para inspeção.

## 8. Diferenças entre o repositório-alvo e o clone usado na validação PostgreSQL

| Dimensão | Repositório-alvo (`saas-dot`) | Clone desta validação (`saas-reputacao-ia`) |
| --- | --- | --- |
| Localização | `C:\Users\lucas\work\saas-dot` (Windows) | `/workspace` (Linux, container) |
| Branch de trabalho | `fix/dot-autorizacao-aprovacao` (esperada) | `cline/ae79k7nx` (criada nesta auditoria, a partir de `main`) |
| HEAD | `88305729e6…310ce` (esperado como trabalho de autorização) | `9d87d452` (3 commits desta auditoria) |
| Base | desconhecida | `main` = `4e6439ea`; `88305729` é ancestral, 12 commits atrás |
| Árvore de trabalho | 35 modificados + 49 não rastreados (relatado) | limpa; nenhuma alteração não rastreada |
| Relatórios PHASE2/PHASE3/FINAL_AUDIT | existiriam, segundo o relato | **inexistentes** em todo o histórico |
| Harness `postgres.dot.integration.test.ts` | existiria, segundo o relato | **inexistente**; o atual foi escrito nesta auditoria |
| PIN / lockout / sessão com expiração | a validar no alvo | **não implementados** (seção 7) |
| Resultado da validação PostgreSQL (12/12) | **não aplicável** | válido apenas para este clone, sobre o harness criado aqui |

**Nenhum resultado da etapa anterior deve ser transportado para o alvo**: o código, a branch e os
testes são diferentes. A única coisa reutilizável é o *desenho* do harness e o script de
provisionamento do PostgreSQL descartável, que precisam ser reaplicados e revalidados no alvo.


## 9. Próximo passo exato para continuar a validação no repositório correto

**Passo 0 (bloqueante, do lado do usuário):** disponibilizar o repositório-alvo neste ambiente.
Qualquer uma das opções abaixo resolve:

1. Publicar o repositório-alvo num remoto acessível (ex.: `git remote add target <url>` e
   `git push target fix/dot-autorizacao-aprovacao` a partir da máquina Windows); **ou**
2. Empacotar e anexar a cópia de trabalho **completa** (incluindo `.git`, para preservar os 35
   modificados e os 49 não rastreados):
   `git -C C:\Users\lucas\work\saas-dot bundle create saas-dot.bundle --all` e
   `git -C C:\Users\lucas\work\saas-dot stash create` (ou copiar a pasta inteira).

**Passo 1 — inspeção read-only no alvo** (nesta ordem, sem testar nada):

```bash
cd <caminho-do-alvo>
git status --porcelain          # deve mostrar ~35 M + 49 ??
git rev-parse --abbrev-ref HEAD # deve ser fix/dot-autorizacao-aprovacao
git rev-parse HEAD              # deve começar por 88305729e6… e terminar em 310ce
git remote -v
ls docs/FILTRA_DOT_PHASE2.md docs/FILTRA_DOT_PHASE3.md docs/FILTRA_DOT_FINAL_AUDIT.md
ls backend/tests/postgres.dot.integration.test.ts
git grep -niE 'pin_hash|locked_until|dot_sessions|session_expires' -- backend
```

**Passo 2 — diff sem modificar nada:** `git diff` (não `git diff HEAD` após stash) e
`git diff --stat` para inventariar as 35 alterações; `git status --porcelain` para os 49 não
rastreados. Comparar com o que os relatórios PHASE2/PHASE3/FINAL_AUDIT descrevem.

**Passo 3 — decidir a matriz de testes no alvo**, com base no que existir de fato:
- se PIN/lockout/sessão existirem no alvo → portar o desenho dos cenários 2 e 3 desta auditoria
  (`backend/tests/postgres.dot.integration.test.ts` como referência) para o harness do alvo;
- se não existirem → registrar como pendentes, como já feito aqui, e **não** classificar como
  aprovada.

**Passo 4 — validação PostgreSQL no alvo**, reaproveitando apenas a receita:
`backend/scripts/run-dot-pg-validation.sh` (PostgreSQL 17.11 em `127.0.0.1:55432`, banco
`filtra_dot_test`, diretório temporário exclusivo), com
`DOT_PG_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55432/filtra_dot_test` e `NODE_ENV=test`.
Sem definir `FILTRA_DOT_ENABLED` nem `FILTRA_DOT_SCHEDULER_ENABLED`.

**Passo 5 — só então** atualizar o relatório de validação do alvo e emitir classificação
(`VALIDAÇÃO OPERACIONAL APROVADA` / `AGUARDANDO POSTGRESQL DE TESTE` / `VALIDAÇÃO REPROVADA`).

Enquanto o Passo 0 não for atendido, a classificação permanece
**`AGUARDANDO ACESSO AO REPOSITÓRIO-ALVO`**.

## 10. O que NÃO foi feito nesta etapa (conformidade com as regras)

| Regra | Cumprimento |
| --- | --- |
| 1. Sem commit/push/merge/cherry-pick | ✅ nenhum executado (HEAD deste clone segue em `9d87d452`) |
| 2. Sem reset/clean/checkout destrutivo | ✅ nenhum executado |
| 3. Não reverter os 3 commits do outro clone | ✅ intactos em `cline/ae79k7nx` e em `origin/cline/ae79k7nx` |
| 4. Não modificar o outro repositório | ✅ nenhum arquivo de código, dado ou ref foi alterado; a única adição é este relatório, **não rastreado e não commitado** |
| 5. Não ativar as flags do Dot | ✅ `FILTRA_DOT_ENABLED` e `FILTRA_DOT_SCHEDULER_ENABLED` continuam não definidas |
| 6. Não executar testes que alterem bancos/arquivos antes de inspecionar | ✅ nenhum teste executado; nenhum banco iniciado; inspeção 100% leitura |
| 7. Não presumir aplicáveis os resultados PostgreSQL do outro clone | ✅ resultados explicitamente descartados para o alvo (seção 8) |

Estado do Git ao final desta etapa:

```
branch: cline/ae79k7nx
HEAD:   9d87d45296bbe3d256a62697b361fa81753cfe5b   (inalterado)
novo arquivo não rastreado: docs/FILTRA_DOT_REPOSITORY_RECOVERY.md
```

## 11. Conclusão

1. O repositório-alvo **não está disponível** neste ambiente: o caminho Windows não existe, não há
   montagem do host e não há outro repositório git além do clone usado na validação anterior.
2. A branch `fix/dot-autorizacao-aprovacao` **não existe** localmente, em `origin` (174 refs) nem
   entre os 163 refs de PR.
3. O commit `88305729e6035e56f66fee4b4bc63117ca9310ce` **existe** neste clone, mas é
   `perf(indice)… sitemap (#159)` — não é trabalho de autorização do Dot.
4. Os relatórios `FILTRA_DOT_PHASE2.md`, `FILTRA_DOT_PHASE3.md`, `FILTRA_DOT_FINAL_AUDIT.md` e o
   harness `postgres.dot.integration.test.ts` do alvo **nunca existiram** neste repositório.
5. As 35 alterações e 49 arquivos não rastreados do alvo **não foram preservados aqui** e não há
   objetos órfãos recuperáveis (`git fsck` sem inalcançáveis).
6. PIN, lockout e sessão administrativa com expiração **não existem** em nenhum ref deste
   repositório — logo, também não podem ser validados aqui.
7. A validação PostgreSQL anterior é **específica do clone** `saas-reputacao-ia` e não serve como
   evidência para o alvo.

**Classificação:** `AGUARDANDO ACESSO AO REPOSITÓRIO-ALVO`.

