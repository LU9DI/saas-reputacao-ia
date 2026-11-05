/**
 * Testes da política de analytics (sem DOM, sem rede).
 *
 * O módulo testado é TypeScript puro, então roda direto com o type stripping
 * nativo do Node 22.18+/24: `node --test scripts/test-analytics.mjs`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CONVERSION_EVENTS,
  DEFAULT_MEASUREMENT_ID,
  GA4_EVENTS,
  canonicalPageLocation,
  contactChannelFromHref,
  createGtagShim,
  dedupeKey,
  isEventAllowedOnPath,
  isPageViewPath,
  isPrivatePath,
  isTrackableHost,
  looksLikePersonalData,
  normalizeMeasurementId,
  normalizePath,
  resolveMeasurementId,
  sanitizeEventParams,
} from '../src/app/lib/analyticsPolicy.ts';

test('Measurement ID só é aceito no formato G-', () => {
  assert.equal(normalizeMeasurementId('G-ABC1234XYZ'), 'G-ABC1234XYZ');
  assert.equal(normalizeMeasurementId(' G-ABC1234XYZ '), 'G-ABC1234XYZ');
  assert.equal(normalizeMeasurementId('UA-12345-1'), null);
  assert.equal(normalizeMeasurementId('G-'), null);
  assert.equal(normalizeMeasurementId('G-abc def'), null);
  assert.equal(normalizeMeasurementId(undefined), null);
});

test('ID efetivo: env válida ganha; sem env usa o ID real da propriedade', () => {
  assert.match(DEFAULT_MEASUREMENT_ID, /^G-[A-Z0-9]{4,20}$/);
  assert.equal(resolveMeasurementId('G-OUTRO123'), 'G-OUTRO123');
  assert.equal(resolveMeasurementId(''), DEFAULT_MEASUREMENT_ID);
  assert.equal(resolveMeasurementId(undefined), DEFAULT_MEASUREMENT_ID);
  assert.equal(resolveMeasurementId('UA-12345-1'), DEFAULT_MEASUREMENT_ID);
});

test('page_view: só rotas públicas', () => {
  for (const path of ['/', '/en', '/indice', '/avaliacoes-google', '/blog/x', '/planos', '/teste']) {
    assert.equal(isPageViewPath(path), true, `${path} deveria medir page_view`);
  }
  for (const path of [
    '/admin',
    '/admin/dashboard',
    '/painel/abc',
    '/login',
    '/pagamento-ok',
    '/avaliacao/123',
    '/preview',
    '/preview/teste',
    '/dot',
  ]) {
    assert.equal(isPageViewPath(path), false, `${path} não deveria medir page_view`);
  }
});

test('área privada bloqueia eventos livres', () => {
  assert.equal(isPrivatePath('/painel/abc'), true);
  assert.equal(isPrivatePath('/painelize'), false);
  assert.equal(isEventAllowedOnPath('login', '/login'), true);
  assert.equal(isEventAllowedOnPath('purchase', '/painel/abc'), true);
  assert.equal(isEventAllowedOnPath('report_generated', '/painel/abc'), true);
  assert.equal(isEventAllowedOnPath('generate_lead', '/painel/abc'), false);
  assert.equal(isEventAllowedOnPath('contact', '/admin'), false);
  assert.equal(isEventAllowedOnPath('unknown_event', '/'), false);
});

test('parâmetros fora da allowlist são descartados', () => {
  const clean = sanitizeEventParams('sign_up', {
    method: 'email',
    plan: 'trial_7d',
    email: 'cliente@example.com',
    nome_empresa: 'ACME',
    token: 'abc',
  });
  assert.deepEqual(clean, { method: 'email', plan: 'trial_7d' });
});

test('dados pessoais nunca passam nos parâmetros', () => {
  const cases = [
    { method: 'cliente@example.com' },
    { method: '+55 62 99999-8888' },
    { method: 'eyJhbGciOiJIUzI1NiJ9.abc.def' },
    { method: 'a3d7f1c94b2e6a805d1f7c3b9e4a6d82' },
    { method: '123.456.789-00' },
    { method: '12.345.678/0001-99' },
    { method: '3f2504e0-4f89-11d3-9a0c-0305e82c3301' },
  ];
  for (const params of cases) {
    assert.deepEqual(sanitizeEventParams('login', params), {}, JSON.stringify(params));
  }
  assert.equal(looksLikePersonalData('cliente@example.com'), true);
  assert.equal(looksLikePersonalData('trial_7d'), false);
});

test('valores numéricos de purchase são normalizados', () => {
  assert.deepEqual(
    sanitizeEventParams('purchase', {
      plan: 'essencial',
      value: '99.9',
      currency: 'BRL',
      method: 'pix',
      email: 'x@y.com',
    }),
    { plan: 'essencial', value: 99.9, currency: 'BRL', method: 'pix' }
  );
  assert.deepEqual(sanitizeEventParams('purchase', { value: 'abc' }), {});
  assert.deepEqual(sanitizeEventParams('purchase', { value: Number.POSITIVE_INFINITY }), {});
});

test('page_location usa o apex e descarta query string', () => {
  assert.equal(
    canonicalPageLocation('https://www.filtraai.com', '/blog/x?utm_source=newsletter'),
    'https://filtraai.com/blog/x'
  );
  assert.equal(
    canonicalPageLocation('https://filtraai.com', '/avaliacoes-google'),
    'https://filtraai.com/avaliacoes-google'
  );
  assert.equal(canonicalPageLocation('https://filtraai.com', '/'), 'https://filtraai.com/');
  assert.equal(normalizePath('//a//b?x=1#y'), '/a/b');
});

test('hosts fora do domínio canônico não medem', () => {
  assert.equal(isTrackableHost('filtraai.com'), true);
  assert.equal(isTrackableHost('www.filtraai.com'), true);
  assert.equal(isTrackableHost('filtra-ia-web.onrender.com'), false);
  assert.equal(isTrackableHost('localhost:3000'), false);
  assert.equal(isTrackableHost('localhost:3000', true), true);
});

test('dedupeKey é estável e sensível ao conteúdo', () => {
  assert.equal(
    dedupeKey('cta_click', { cta: 'trial_start', placement: 'hero' }, '/'),
    dedupeKey('cta_click', { placement: 'hero', cta: 'trial_start' }, '/')
  );
  assert.notEqual(
    dedupeKey('cta_click', { cta: 'trial_start' }, '/'),
    dedupeKey('cta_click', { cta: 'trial_start' }, '/planos')
  );
});

test('links de contato são classificados sem expor o endereço', () => {
  assert.equal(contactChannelFromHref('mailto:projetosaas1@gmail.com'), 'email');
  assert.equal(contactChannelFromHref('tel:+5562999998888'), 'phone');
  assert.equal(contactChannelFromHref('https://wa.me/5562999998888'), 'whatsapp');
  assert.equal(contactChannelFromHref('/planos'), null);
  assert.equal(contactChannelFromHref(null), null);
});

test('shim do dataLayer empurra `arguments`, nunca Array', () => {
  // Regressão: gtag.js ignora Array puro e a tag baixa sem enviar hit algum.
  const dataLayer = [];
  const gtag = createGtagShim(dataLayer);
  gtag('event', 'page_view', { page_path: '/' });
  gtag('config', DEFAULT_MEASUREMENT_ID);

  assert.equal(dataLayer.length, 2);
  assert.equal(Array.isArray(dataLayer[0]), false, 'entrada deve ser array-like');
  assert.equal(dataLayer[0][0], 'event');
  assert.equal(dataLayer[0][1], 'page_view');
  assert.deepEqual(dataLayer[0][2], { page_path: '/' });
  assert.equal(dataLayer[1][0], 'config');
});

test('catálogo de eventos é coerente', () => {
  const required = [
    'page_view',
    'sign_up',
    'login',
    'generate_lead',
    'form_submit',
    'purchase',
    'report_generated',
    'contact',
    'cta_click',
  ];
  for (const name of required) {
    assert.ok(name in GA4_EVENTS, `evento ${name} ausente do catálogo`);
  }
  assert.deepEqual(
    [...CONVERSION_EVENTS].sort(),
    ['contact', 'generate_lead', 'purchase', 'report_generated', 'sign_up'].sort()
  );
  // page_view e cta_click não são conversões.
  assert.equal(GA4_EVENTS.page_view.conversion, false);
  assert.equal(GA4_EVENTS.cta_click.conversion, false);
});
