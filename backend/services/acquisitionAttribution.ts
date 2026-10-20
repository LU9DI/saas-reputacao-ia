const ATTRIBUTION_LIMITS = {
  utm_source: 80,
  utm_medium: 80,
  utm_campaign: 120,
  utm_content: 120,
  utm_term: 120,
  landing_path: 240,
  referrer_origin: 160,
} as const;

export type AcquisitionAttribution = Partial<Record<keyof typeof ATTRIBUTION_LIMITS, string>>;

/**
 * Accept only campaign fields that are useful for aggregate attribution.
 * Do not persist arbitrary query parameters, full referrer URLs, or user data.
 */
export function sanitizeAcquisitionAttribution(value: unknown): AcquisitionAttribution {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const output: AcquisitionAttribution = {};

  for (const [key, limit] of Object.entries(ATTRIBUTION_LIMITS) as Array<[keyof typeof ATTRIBUTION_LIMITS, number]>) {
    const raw = input[key];
    if (typeof raw !== 'string') continue;
    const cleaned = raw.replace(/[\\u0000-\\u001f\\u007f]/g, '').trim().slice(0, limit);
    if (!cleaned) continue;
    if (key === 'referrer_origin') {
      try {
        const parsed = new URL(cleaned);
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') output[key] = parsed.origin;
      } catch {
        // Ignore malformed referrer values.
      }
      continue;
    }
    if (key === 'landing_path') {
      output[key] = cleaned.startsWith('/') && !cleaned.startsWith('//') ? cleaned.split(/[?#]/, 1)[0].slice(0, limit) : '/';
      continue;
    }
    output[key] = cleaned;
  }

  return output;
}
