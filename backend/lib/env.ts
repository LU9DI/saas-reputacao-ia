/**
 * Validação de variáveis de ambiente na subida.
 * Falha cedo com mensagem clara em vez de erro misterioso depois.
 */

export type EnvReport = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function validateEnv(): EnvReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const jwt = process.env.JWT_SECRET || '';
  if (!jwt) {
    errors.push('JWT_SECRET é obrigatório (mín. 32 caracteres).');
  } else if (jwt.length < 32) {
    errors.push('JWT_SECRET deve ter pelo menos 32 caracteres.');
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    warnings.push('STRIPE_SECRET_KEY ausente — checkout retornará 503 até configurar.');
  }

  const recovery = process.env.ADMIN_RECOVERY_SECRET || '';
  if (!recovery || recovery.length < 12) {
    warnings.push(
      'ADMIN_RECOVERY_SECRET ausente ou curta — recuperação de senha do admin fica desativada.'
    );
  }

  if (!process.env.GROQ_API_KEY) {
    warnings.push('GROQ_API_KEY ausente — recursos de IA ficarão indisponíveis.');
  }

  if (!process.env.SMTP_HOST) {
    warnings.push('SMTP não configurado — links de reset aparecem só no log do servidor.');
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function assertEnvOrExit(): void {
  const report = validateEnv();
  for (const w of report.warnings) {
    console.warn(`⚠️  ${w}`);
  }
  if (!report.ok) {
    for (const e of report.errors) {
      console.error(`❌ ${e}`);
    }
    process.exit(1);
  }
}
