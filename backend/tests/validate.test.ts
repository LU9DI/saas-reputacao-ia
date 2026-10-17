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
  it('rejeita e-mail inválido', () => {
    const { res, nextCalled } = run(schemaTrialAtivar, { nome_empresa: 'Loja Teste', email: 'nao-e-email', senha: 'Senha@12' });
    assert.equal(nextCalled, false); assert.equal(res.statusCode, 400); assert.ok(res.body.fields.email);
  });
  it('aceita payload válido e normaliza o e-mail (contrato atual: cadastro por e-mail)', () => {
    const { res, nextCalled, req } = run(schemaTrialAtivar, { nome_empresa: 'Loja Teste', email: 'Dono@Email.COM', senha: 'Senha@12' });
    assert.equal(nextCalled, true); assert.equal(res.statusCode, 200); assert.equal(req.body.email, 'dono@email.com'); assert.equal(req.body.nome_empresa, 'Loja Teste');
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
  it('exige e-mail válido, normaliza o e-mail e mantém a senha obrigatória', () => {
    const ok = run(schemaLoginEmpresa, { email: 'Dono@Empresa.COM', senha: 'x' });
    assert.equal(ok.nextCalled, true); assert.equal(ok.res.statusCode, 200); assert.equal(ok.req.body.email, 'dono@empresa.com');

    const missing = run(schemaLoginEmpresa, { senha: 'x' });
    assert.equal(missing.nextCalled, false); assert.equal(missing.res.statusCode, 400); assert.ok(missing.res.body.fields.email);

    const invalid = run(schemaLoginEmpresa, { email: 'sem-arroba', senha: 'x' });
    assert.equal(invalid.nextCalled, false); assert.equal(invalid.res.statusCode, 400);
  });
});

describe('schemaCheckout', () => {
  it('rejeita plano inválido', () => { const { nextCalled, res } = run(schemaCheckout, { plano: 'gold' }); assert.equal(nextCalled, false); assert.equal(res.statusCode, 400); });
  it('aceita pro-anual', () => { const { nextCalled, req } = run(schemaCheckout, { plano: 'Pro-Anual' }); assert.equal(nextCalled, true); assert.equal(req.body.plano, 'pro-anual'); });
});
