import assert from 'node:assert/strict';
import test from 'node:test';
import { protectDotObject, protectDotText } from '../services/dotDataProtection.js';

test('protectDotText removes email, phone, document and URL data', () => {
  const input = 'Contato teste@example.com, telefone +55 (62) 99999-8888, CPF 123.456.789-09, https://example.com/path';
  const output = protectDotText(input);

  assert.equal(output.includes('teste@example.com'), false);
  assert.equal(output.includes('99999-8888'), false);
  assert.equal(output.includes('123.456.789-09'), false);
  assert.equal(output.includes('https://example.com'), false);
  assert.match(output, /\[e-mail protegido\]/);
  assert.match(output, /\[telefone protegido\]/);
  assert.match(output, /\[documento protegido\]/);
  assert.match(output, /\[link protegido\]/);
});

test('protectDotObject masks sensitive fields recursively while preserving safe fields', () => {
  const output = protectDotObject({
    id: '123',
    name: 'Empresa Demo',
    email: 'owner@example.com',
    nested: {
      phone: '+55 62 99999-8888',
      domain: 'example.com',
      note: 'Fale com owner@example.com',
    },
  }) as Record<string, any>;

  assert.equal(output.id, '123');
  assert.equal(output.name, 'Empresa Demo');
  assert.equal(output.email, '[protegido]');
  assert.equal(output.nested.phone, '[protegido]');
  assert.equal(output.nested.note.includes('owner@example.com'), false);
  assert.equal(output.nested.domain.includes('example.com'), false);
});
