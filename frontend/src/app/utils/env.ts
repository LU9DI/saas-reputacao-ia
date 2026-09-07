import { getApiBase, listApiBases } from './apiFailover';

/**
 * Leitura de env pública do Next.
 * NEXT_PUBLIC_API_URL passa pelo failover (sticky / primary).
 */
export function getEnv(name: string): string {
  if (name === 'NEXT_PUBLIC_API_URL') {
    return getApiBase();
  }
  if (typeof process !== 'undefined' && process.env[name]) {
    return process.env[name] as string;
  }
  if (name === 'NEXT_PUBLIC_APP_URL') return 'http://127.0.0.1:3000';
  if (name === 'NEXT_PUBLIC_API_URL_BACKUP') return '';
  return 'http://127.0.0.1:5000';
}

/** Todas as URLs de API configuradas (principal + backup). */
export function getApiUrls(): string[] {
  return listApiBases();
}
