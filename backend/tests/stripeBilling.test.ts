import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePlano, listPlanosPublicos, PLANOS } from '../stripeBilling.js';

describe('resolvePlano', () => {
  it('resolve planos mensais e anuais', () => {
    for (const key of Object.keys(PLANOS)) {
      const p = resolvePlano(key);
      assert.ok(p, `plano ${key} deve existir`);
      assert.equal(p!.key, key);
    }
  });

  it('rejeita plano inválido', () => {
    assert.equal(resolvePlano('gold'), null);
    assert.equal(resolvePlano(''), null);
  });

  it('lista pública tem 10 planos', () => {
    assert.equal(listPlanosPublicos().length, 10);
  });

  it('corporativo e corporate aliases', () => {
    assert.ok(resolvePlano('corporativo'));
    assert.ok(resolvePlano('rei-anual'));
  });
});
