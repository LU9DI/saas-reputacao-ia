import { redirect } from 'next/navigation';

/**
 * Dot ainda não validado em localhost.
 * Esta rota existe só para sobrescrever qualquer build antigo e redirecionar.
 */
export default function DotOfflinePage() {
  redirect('/');
}
