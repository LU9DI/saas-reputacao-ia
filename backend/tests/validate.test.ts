import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { validateBody, schemaTrialAtivar, schemaReview, schemaLoginEmpresa, schemaCheckout } from '../middleware/validate.js';

function mockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.body = null;
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (data: unknown) => { res.body = data; return res; };
  return res as Response & { statusCode: number; body: any };
}

function run(schema: Parameters<typeof validateBody>[0], body: unknown) {
  const req = { body } as Request;
  const res = mockRes();
  let nextCalled = false;
  validateBody(schema)(req, res, () => { nextCalled = true; });
  return { req, res, nextCalled };
}

describe('validateBody + schemaTrialAtivar', () => {
  it('rejeita body vazio', () => {
    const { res, nextCalled } = run(schemaTrialAtivar, {});
    assert.equal(nextCalled, false); assert.equal(res.statusCode, 400); assert.ok(res.body.fields);
  });
  it('rejeita payload sem campos obrigatórios', () => {
    const { res, nextCalled } = run(schemaTrialAtivar, {});
    assert.equal(nextCalled, false); assert.equal(res.statusCode, 400); assert.ok(res.body.fields.nome_empresa);
  });
  it('aceita payload válido e normaliza e-mail', () => {
    const { res, nextCalled, req } = run(schemaTrialAtivar, { nome_empresa: 'Loja Teste', email: 'Dono@Email.COM', senha: 'Senha@12' });
    assert.equal(nextCalled, true); assert.equal(res.statusCode, 200); assert.equal(req.body.email, 'dono@email.com');
  });
});

describe('schemaReview', () => {
  it('exige comentário e WhatsApp em nota baixa', () => {
    const missing = run(schemaReview, { rating: 2, comment: '' });
    assert.equal(missing.nextCalled, false); assert.equal(missing.res.statusCode, 400);
    const valid = run(schemaReview, { rating: 2, comment: 'Demora', client_whatsapp: '11999998888' });
    assert.equal(valid.nextCalled, true);
  });
  it('aceita nota alta sem comentário', () => {
    const { nextCalled } = run(schemaReview, { rating: 5 }); assert.equal(nextCalled, true);
  });
});

describe('schemaLoginEmpresa', () => {
  it('exige e-mail válido e senha', () => {
    const invalid = run(schemaLoginEmpresa, { email: 'nao-e-email', senha: 'x' });
    assert.equal(invalid.nextCalled, false); assert.equal(invalid.res.statusCode, 400);
    const valid = run(schemaLoginEmpresa, { email: 'Dono@Email.COM', senha: 'x' });
    assert.equal(valid.nextCalled, true); assert.equal(valid.res.statusCode, 200); assert.equal(valid.req.body.email, 'dono@email.com');
  });
});

describe('schemaCheckout', () => {
  it('rejeita plano inválido', () => { const { nextCalled, res } = run(schemaCheckout, { plano: 'gold' }); assert.equal(nextCalled, false); assert.equal(res.statusCode, 400); });
  it('aceita pro-anual', () => { const { nextCalled, req } = run(schemaCheckout, { plano: 'Pro-Anual' }); assert.equal(nextCalled, true); assert.equal(req.body.plano, 'pro-anual'); });
});
