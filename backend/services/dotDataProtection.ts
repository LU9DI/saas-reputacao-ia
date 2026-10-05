const SENSITIVE_PATTERNS: Array<[RegExp, string]> = [
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[e-mail protegido]'],
  [/(?:\+?\d[\d\s().-]{8,}\d)/g, '[telefone protegido]'],
  [/\b(?:CPF|CNPJ)\s*[:#-]?\s*\d[\d.\/-]{8,}\b/gi, '[documento protegido]'],
  [/\b(?:https?:\/\/)?(?:www\.)?[^\s/]+\.(?:com|com\.br|net|org|io)(?:\/[^\s]*)?/gi, '[link protegido]'],
];

export function protectDotText(value: unknown, maxLength = 700): string {
  let text = String(value ?? '').slice(0, maxLength);
  for (const [pattern, replacement] of SENSITIVE_PATTERNS) text = text.replace(pattern, replacement);
  return text;
}

export function protectDotObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.slice(0, 100).map(protectDotObject);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (/^(email|phone|mobilephone|fax|address|street|zip|postalcode|cpf|cnpj|token|access_token|refresh_token|authorization)$/i.test(key)) {
        out[key] = '[protegido]';
      } else if (typeof item === 'string') {
        out[key] = protectDotText(item, 700);
      } else {
        out[key] = protectDotObject(item);
      }
    }
    return out;
  }
  return value;
}
