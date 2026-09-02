export function getEnv(name: string): string {
  if (process.env[name]) return process.env[name];
  if (name === 'NEXT_PUBLIC_APP_URL') return 'http://127.0.0.1:3000';
  return 'http://127.0.0.1:5000';
}
