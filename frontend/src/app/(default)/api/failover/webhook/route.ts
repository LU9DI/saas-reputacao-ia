import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  classifySpendEvent,
  shouldRespectCooldown,
} from '../../../../../lib/failoverCore';
import {
  getFailoverState,
  isEventProcessed,
  markEventProcessed,
  setFailoverState,
} from '../../../../lib/failoverState';

export const runtime = 'nodejs';
const COOLDOWN_MS = 300_000;

function signatureFor(body: string, secret: string) {
  return crypto.createHmac('sha1', secret).update(body, 'utf8').digest('hex');
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const body = await request.text();
  const monitorSecret = process.env.FAILOVER_MONITOR_SECRET?.trim();
  const internalSecret = request.headers.get('x-filtra-monitor-secret');

  let payload: {
    budgetAmount?: number;
    currentSpend?: number;
    thresholdPercent?: number;
    teamId?: string;
    eventId?: string;
    source?: string;
  };

  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const isInternalMonitor = Boolean(
    monitorSecret &&
    internalSecret &&
    safeEqual(internalSecret, monitorSecret),
  );

  if (!isInternalMonitor) {
    const secret = process.env.VERCEL_WEBHOOK_SECRET?.trim();
    const signature = request.headers.get('x-vercel-signature');
    if (!secret || !signature || !safeEqual(signature, signatureFor(body, secret))) {
      return NextResponse.json({ error: 'invalid_signature' }, { status: 403 });
    }
  }

  const eventId =
    payload.eventId ||
    crypto.createHash('sha256').update(body, 'utf8').digest('hex');

  if (await isEventProcessed(eventId)) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const action = classifySpendEvent({
    ...payload,
    eventId,
    source: isInternalMonitor ? '90pct-monitor' : 'vercel',
  });

  if (action === 'failover') {
    const current = await getFailoverState();
    if (
      current.origin !== 'fallback' ||
      !shouldRespectCooldown(current.changedAt || null, Date.now(), COOLDOWN_MS)
    ) {
      await setFailoverState(
        'fallback',
        isInternalMonitor
          ? 'spend-90-monitor'
          : 'spend-threshold-' + String(payload.thresholdPercent ?? 0),
        eventId,
      );
    }
  }

  await markEventProcessed(eventId);
  return NextResponse.json({
    ok: true,
    action,
    thresholdPercent: payload.thresholdPercent ?? null,
    source: isInternalMonitor ? '90pct-monitor' : 'vercel',
  });
}
