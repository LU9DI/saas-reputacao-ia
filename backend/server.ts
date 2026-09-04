/**
 * ============================================================================
 * 🚀 GITHUB SPEC KIT - METADADOS DE ESPECIFICAÇÃO E CONSTITUIÇÃO DO MICRO-SAAS
 * ============================================================================
 *
 * @meta github-spec-kit: true
 * @version 1.2.0
 * @framework Next.js 14 (Frontend) | Node 24 + Express + SQLite (Backend)
 *
 * /constitution (Regras e Padrões de Arquitetura Imutáveis)
 * -------------------------------------------------------------
 * 1. SEGURANÇA: Isolamento estrito de dados por ID da empresa (Tenant Isolation).
 *    Cada funcionário tem **senha própria** (hash bcrypt) porém a **autenticação do
 *    painel usa o mesmo CNPJ da empresa** como identificador de tenant.
 * 2. AUTENTICAÇÃO: Stateless via JWT (24h). O payload do token contém
 *    `nome_funcionario` e `empresa_id` de forma isolada (sem e‑mail).
 * 3. IDIOMAS: Suporte nativo a PT, EN, ES via dicionários estáticos puros de
 *    tradução.
 * 4. CANAL UNIVERSAL: Rastreamento omnicanal via parâmetro `origin` no banco de dados.
 *
 * /plan (Tabela de Precificação, Limites Globais e Regras de IA)
 * --------------------------------------------------
 * - INICIAL (R$ 69,90/mês | R$ 49,90/mês no anual): 150 feedbacks/mês.
 * - PRO (R$ 109,90/mês | R$ 99,90/mês no anual): 400 feedbacks/mês.
 * - ULTRA (R$ 199,90/mês | R$ 149,90/mês no anual): 800 feedbacks/mês. IA + 1 relatório PDF/mês.
 * - CORPORATIVO (R$ 499,90/mês | R$ 429,90/mês no anual): 3.500 feedbacks/mês. Dashboard multi-unidades.
 * - REI (R$ 999,90/mês | R$ 899,90/mês no anual): 10.000 feedbacks/mês. IA prioritária e relatórios avançados.
 *
 * /specify (O Comportamento Desejado do Fluxo Atual)
 * -----------------------------------------------------
 * - TELA DE ATIVAÇÃO (`/ativar` ou `/`): Cadastro (Nome, CNPJ, E-mail, Senha) para iniciar 7 dias grátis.
 *   Grade de planos exibida abaixo. Cliques nos planos redirecionam para inserção de cartão no Stripe.
 * - TELA DE LOGIN (`/login`): Rota isolada para o uso diário de clientes ativos.
 * - RECUPERAÇÃO DE SENHA: via e-mail (`/api/auth/forgot-password` + `/api/auth/reset-password`).
 *
 * /tasks
 * -------------------------------------------------
 * [x] Task 1: Centralizar e unificar o motor de IA no arquivo `server.ts`.
 * [x] Task 2: Atualizar o ID do modelo da Groq para `openai/gpt-oss-120b`.
 * [x] Task wire: Stripe + recuperação de senha + trial com e-mail/senha.
 * ============================================================================
 */
