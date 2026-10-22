import crypto from 'crypto';

type Lead = {
  email: string;
  company?: string | null;
  source?: string | null;
  consent_at?: string | null;
};

const HUBSPOT_BASE = 'https://api.hubapi.com';
const FREE_EMAIL_DOMAINS = new Set(['gmail.com','outlook.com','hotmail.com','live.com','icloud.com','yahoo.com','proton.me','protonmail.com']);
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
  if (contactId) {
    const domain = email.split('@')[1]?.toLowerCase() || '';
    const companyName = company || domain;
    if (!domain || FREE_EMAIL_DOMAINS.has(domain)) return { enabled: true, contactId, created: !existing?.id };
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
      let companyRecord = companySearch.results?.[0];
      if (!companyRecord?.id && companyName && domain) {
        companyRecord = await jsonFetch(`${HUBSPOT_BASE}/crm/v3/objects/companies`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ properties: { name: companyName, domain } }),
        });
      }
      if (companyRecord?.id) {
        await jsonFetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts/${contactId}/associations/companies/${companyRecord.id}/1`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: '{}',
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
  // Keep Brevo payload limited to standard contact data; consent is enforced by the caller.

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
  // External CRM/marketing writes remain opt-in even when API keys exist.
  // This prevents a deployment from activating sync merely by inheriting secrets.
  if (process.env.ACQUISITION_CRM_SYNC_ENABLED !== 'true') {
    return {
      ok: true,
      sync_id: crypto.randomUUID(),
      results: {
        hubspot: { enabled: false, reason: 'ACQUISITION_CRM_SYNC_ENABLED is not true' },
        brevo: { enabled: false, reason: 'ACQUISITION_CRM_SYNC_ENABLED is not true' },
      },
    };
  }
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
