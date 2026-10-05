import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dotPermissionMatchesScope } from '../services/dotAccessControl.js';

const scope = { empresaId: 'empresa-a', userId: 'user-a', resource: 'crm', action: 'read' };

test('permission is scoped to the same company and resource/action', () => {
  assert.equal(dotPermissionMatchesScope({
    empresa_id: 'empresa-a', user_id: 'user-a', resource: 'crm', action: 'read', granted: 1,
  }, scope), true);

  assert.equal(dotPermissionMatchesScope({
    empresa_id: 'empresa-b', user_id: 'user-a', resource: 'crm', action: 'read', granted: 1,
  }, scope), false);

  assert.equal(dotPermissionMatchesScope({
    empresa_id: 'empresa-a', user_id: 'user-a', resource: 'email', action: 'read', granted: 1,
  }, scope), false);
});

test('user-specific permission does not leak to another user', () => {
  assert.equal(dotPermissionMatchesScope({
    empresa_id: 'empresa-a', user_id: 'user-a', resource: 'crm', action: 'read', granted: 1,
  }, scope), true);

  assert.equal(dotPermissionMatchesScope({
    empresa_id: 'empresa-a', user_id: 'user-b', resource: 'crm', action: 'read', granted: 1,
  }, scope), false);
});

test('revoked and denied permissions never match', () => {
  assert.equal(dotPermissionMatchesScope({
    empresa_id: 'empresa-a', user_id: 'user-a', resource: 'crm', action: 'read', granted: 0,
  }, scope), false);

  assert.equal(dotPermissionMatchesScope({
    empresa_id: 'empresa-a', user_id: 'user-a', resource: 'crm', action: 'read', granted: 1, revoked_at: '2026-10-05T00:00:00Z',
  }, scope), false);
});

test('company-wide permission applies only within its company', () => {
  assert.equal(dotPermissionMatchesScope({
    empresa_id: 'empresa-a', user_id: null, resource: 'crm', action: 'read', granted: 1,
  }, scope), true);

  assert.equal(dotPermissionMatchesScope({
    empresa_id: 'empresa-b', user_id: null, resource: 'crm', action: 'read', granted: 1,
  }, scope), false);
});
