import test from 'node:test';
import assert from 'node:assert/strict';
import {
  companyExistedInPeriod,
  nextMonthUtc,
  resolveCatchUpPeriod,
  subscriptionReportDue,
  subscriptionReportOverdue,
} from '../routes/monthlyReportJobsRoutes.js';

test('avança o período mesmo na virada do ano', () => {
  assert.equal(nextMonthUtc('2026-09'), '2026-10');
  assert.equal(nextMonthUtc('2026-12'), '2027-01');
});

test('recupera o mês mais antigo em falta antes de voltar à cadência', () => {
  assert.equal(resolveCatchUpPeriod('2026-08', '2026-10'), '2026-09');
  assert.equal(resolveCatchUpPeriod('2026-09', '2026-10'), '2026-10');
  assert.equal(resolveCatchUpPeriod('2026-10', '2026-10'), '2026-10');
  assert.equal(resolveCatchUpPeriod(null, '2026-10'), '2026-10');
  assert.equal(resolveCatchUpPeriod('2026-12', '2027-02'), '2027-01');
});

test('aniversário vencido no mês permite recuperação no dia seguinte', () => {
  const dueDay = new Date('2026-10-18T12:00:00.000Z');
  const nextDay = new Date('2026-10-19T12:00:00.000Z');

  assert.equal(subscriptionReportDue(18, dueDay), true);
  assert.equal(subscriptionReportOverdue(18, dueDay), false);
  assert.equal(subscriptionReportDue(18, nextDay), false);
  assert.equal(subscriptionReportOverdue(18, nextDay), true);
});

test('dias 29-31 não ficam vencidos no último dia do mês curto', () => {
  const lastDayFebruary = new Date('2026-02-28T12:00:00.000Z');
  assert.equal(subscriptionReportDue(31, lastDayFebruary), true);
  assert.equal(subscriptionReportOverdue(31, lastDayFebruary), false);

  const lastDayNovember = new Date('2026-11-30T12:00:00.000Z');
  assert.equal(subscriptionReportDue(31, lastDayNovember), true);
  assert.equal(subscriptionReportOverdue(31, lastDayNovember), false);
});

test('não recupera período anterior à criação da empresa', () => {
  assert.equal(companyExistedInPeriod('2026-10-25T12:00:00.000Z', '2026-09'), false);
  assert.equal(companyExistedInPeriod('2026-09-30T12:00:00.000Z', '2026-09'), true);
  assert.equal(companyExistedInPeriod('2026-10-01T00:00:00.000Z', '2026-10'), true);
  assert.equal(companyExistedInPeriod(null, '2026-09'), true);
});
