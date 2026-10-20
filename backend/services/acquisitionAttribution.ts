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
    const cleaned = raw.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, limit);
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


export type AcquisitionEventRow = {
  lead_id?: unknown;
  event_type?: unknown;
  source?: unknown;
  occurred_at?: unknown;
  metadata_json?: unknown;
};

export function summarizeAcquisitionEvents(events: AcquisitionEventRow[]) {
  type LeadSummary = {
    attribution: AcquisitionAttribution;
    consented: boolean;
    diagnosed: boolean;
    lastEventAt: string;
  };
  const leads = new Map<string, LeadSummary>();

  for (const event of events) {
    const leadId = typeof event.lead_id === 'string' ? event.lead_id.trim() : '';
    if (!leadId) continue;
    const eventType = String(event.event_type || '');
    if (eventType !== 'consent.granted' && eventType !== 'diagnostic.completed') continue;

    let metadata: Record<string, unknown> = {};
    try {
      const parsed = typeof event.metadata_json === 'string' ? JSON.parse(event.metadata_json) : {};
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) metadata = parsed;
    } catch {
      metadata = {};
    }

    const previous = leads.get(leadId);
    const attribution = sanitizeAcquisitionAttribution(metadata.attribution);
    const hasAttribution = Object.values(attribution).some(Boolean);
    const priorHasAttribution = previous && Object.values(previous.attribution).some(Boolean);
    const eventAt = String(event.occurred_at || '');
    leads.set(leadId, {
      attribution: hasAttribution ? attribution : (priorHasAttribution ? previous.attribution : attribution),
      consented: Boolean(previous?.consented || eventType === 'consent.granted'),
      diagnosed: Boolean(previous?.diagnosed || eventType === 'diagnostic.completed'),
      lastEventAt: eventAt > (previous?.lastEventAt || '') ? eventAt : (previous?.lastEventAt || eventAt),
    });
  }

  const groups = new Map<string, {
    source: string;
    medium: string;
    campaign: string;
    content: string;
    leads: Set<string>;
    diagnosed: Set<string>;
  }>();
  const consented = new Set<string>();
  const diagnosed = new Set<string>();

  for (const [leadId, summary] of leads) {
    if (summary.consented) consented.add(leadId);
    if (summary.diagnosed) diagnosed.add(leadId);
    const a = summary.attribution;
    const source = a.utm_source || 'direct/unknown';
    const medium = a.utm_medium || 'unknown';
    const campaign = a.utm_campaign || 'unattributed';
    const content = a.utm_content || 'unspecified';
    const key = JSON.stringify([source, medium, campaign, content]);
    const group = groups.get(key) || { source, medium, campaign, content, leads: new Set<string>(), diagnosed: new Set<string>() };
    group.leads.add(leadId);
    if (summary.diagnosed) group.diagnosed.add(leadId);
    groups.set(key, group);
  }

  const campaigns = Array.from(groups.values())
    .map((group) => ({
      source: group.source,
      medium: group.medium,
      campaign: group.campaign,
      content: group.content,
      consented_leads: group.leads.size,
      completed_diagnostics: group.diagnosed.size,
    }))
    .sort((a, b) => b.consented_leads - a.consented_leads || b.completed_diagnostics - a.completed_diagnostics);

  return {
    totals: {
      consented_leads: consented.size,
      completed_diagnostics: diagnosed.size,
    },
    campaigns,
  };
}
