const usageUrl = process.env.VERCEL_USAGE_URL?.trim();
const token = process.env.VERCEL_API_TOKEN?.trim();
const webhookUrl = process.env.WEBHOOK_URL?.trim();
const secret = process.env.FAILOVER_MONITOR_SECRET?.trim();
const enabled = String(process.env.ENABLE_90_MONITOR || '').toLowerCase() === 'true';

if (!enabled) {
  console.log('90% monitor disabled');
  process.exit(0);
}

if (!usageUrl || !token || !webhookUrl || !secret) {
  throw new Error('Required: VERCEL_USAGE_URL, VERCEL_API_TOKEN, WEBHOOK_URL, FAILOVER_MONITOR_SECRET');
}

const response = await fetch(usageUrl, {
  headers: {
    Authorization: 'Bearer ' + token,
    Accept: 'application/json',
  },
});
if (!response.ok) throw new Error('Vercel usage endpoint failed: ' + response.status);

const data = await response.json() as { currentSpend?: number; budgetAmount?: number };
const currentSpend = Number(data.currentSpend);
const budgetAmount = Number(data.budgetAmount);

if (!Number.isFinite(currentSpend) || !Number.isFinite(budgetAmount) || budgetAmount <= 0) {
  throw new Error('VERCEL_USAGE_URL must return currentSpend and budgetAmount');
}

const percent = (currentSpend / budgetAmount) * 100;
if (percent < 90) {
  console.log('Spend ' + percent.toFixed(2) + '% — no failover');
  process.exit(0);
}

const webhook = await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-filtra-monitor-secret': secret,
  },
  body: JSON.stringify({
    source: '90pct-monitor',
    thresholdPercent: 90,
    currentSpend,
    budgetAmount,
  }),
});

if (!webhook.ok) throw new Error('Failover webhook returned ' + webhook.status);
console.log('90% threshold sent');
