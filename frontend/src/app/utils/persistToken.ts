/** Salva token JWT no localStorage (filtra_token). */
export function persistFiltraToken(token?: string | null) {
  if (!token) return;
  try {
    localStorage.setItem('filtra_token', token);
  } catch {
    /* private mode */
  }
}

export function readFiltraToken(): string | null {
  try {
    return localStorage.getItem('filtra_token');
  } catch {
    return null;
  }
}
