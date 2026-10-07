import crypto from 'crypto';

type Lead = {
  email: string;
  company?: string | null;
  source?: string | null;
  consent_at?: string | null;
};

const HUBSPOT_BASE = 'https://api.hubapi.com';
const BREVO_BASE = 'https://api.brevo.com/v3';

function clean(value: unknown, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function hubspotKey() {
  return clean(process.env.HUBSPOT_SERVICE_KEY, 500);
}

function brevoKey() {
  return clean(process.env.BREVO_API_KEY, 500);
}

async function jsonFetch(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 1000) }; }
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(body).slice(0, 1200)}`);
  return body;
}

async function hubspotSearchContact(email: string, key: string) {
  const body = await jsonFetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts/search`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
      properties: ['email', 'firstname', 'lastname', 'company', 'lifecyclestage', 'hs_lead_status'],
      limit: 1,
    }),
  });
  return body.results?.[0] || null;
}

async function hubspotUpsert(lead: Lead) {
  const key = hubspotKey();
  if (!key) return { enabled: false };

  const email = clean(lead.email, 254).toLowerCase();
  const company = clean(lead.company, 200);
  const properties: Record<string, string> = {
    email,
    lifecyclestage: 'lead',
    hs_lead_status: 'NEW',
  };
  if (company) properties.company = company;

  const existing = await hubspotSearchContact(email, key);
  let contact: any;
  if (existing?.id) {
    contact = await jsonFetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts/${existing.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties }),
    });
  } else {
    contact = await jsonFetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties }),
    });
  }

  const contactId = String(contact.id || existing?.id || '');
  if (company && contactId) {
    const domain = company.includes('.') ? company.toLowerCase() : '';
    if (domain) {
      const companySearch = await jsonFetch(`${HUBSPOT_BASE}/crm/v3/objects/companies/search`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filterGroups: [{ filters: [{ propertyName: 'domain', operator: 'EQ', value: domain }] }],
          properties: ['name', 'domain'],
          limit: 1,
        }),
      });
      const companyRecord = companySearch.results?.[0];
      if (companyRecord?.id) {
        await jsonFetch(`${HUBSPOT_BASE}/crm/v4/objects/contacts/${contactId}/associations/companies/${companyRecord.id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 1 }),
        });
      }
    }
  }

  return { enabled: true, contactId, created: !existing?.id };
}

async function brevoUpsert(lead: Lead) {
  const key = brevoKey();
  if (!key) return { enabled: false };

  const email = clean(lead.email, 254).toLowerCase();
  const attributes: Record<string, string> = {};
  const company = clean(lead.company, 200);
  if (company) attributes.COMPANY = company;
  if (lead.source) attributes.ACQUISITION_SOURCE = clean(lead.source, 120);
  if (lead.consent_at) attributes.CONSENT_AT = clean(lead.consent_at, 80);

  const body = {
    email,
    attributes,
    updateEnabled: true,
    listIds: [2],
  };

  await jsonFetch(`${BREVO_BASE}/contacts`, {
    method: 'POST',
    headers: { 'api-key': key, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });

  return { enabled: true, listId: 2 };
}

export async function syncConsentedAcquisitionLead(lead: Lead) {
  const results: Record<string, unknown> = {};
  if (hubspotKey()) {
    try { results.hubspot = await hubspotUpsert(lead); }
    catch (error: any) { results.hubspot = { enabled: true, ok: false, error: clean(error?.message, 1000) }; }
  } else {
    results.hubspot = { enabled: false, reason: 'HUBSPOT_SERVICE_KEY not configured' };
  }

  if (brevoKey()) {
    try { results.brevo = await brevoUpsert(lead); }
    catch (error: any) { results.brevo = { enabled: true, ok: false, error: clean(error?.message, 1000) }; }
  } else {
    results.brevo = { enabled: false, reason: 'BREVO_API_KEY not configured' };
  }

  return {
    ok: Object.values(results).every((r: any) => r?.ok !== false),
    sync_id: crypto.randomUUID(),
    results,
  };
}
