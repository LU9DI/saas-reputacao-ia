import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // `any` em integrações legadas: tipagem estrita é um esforço separado.
      // Mantém visível como aviso (sem bloquear 100+ pontos de uma vez).
      '@typescript-eslint/no-explicit-any': 'warn',
      // Diagnóstico do React Compiler (não habilitado neste build):
      // a memoização manual continua válida em runtime; mantém como aviso.
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
