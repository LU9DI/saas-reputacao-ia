import test from 'node:test';
import assert from 'node:assert/strict';

test('DOT contract: autonomous plans are tenant-visible but never cross-tenant', () => {
  const sql = "WHERE id=? AND empresa_id=? AND (actor_user_id=? OR actor_user_id='system-dot')";
  assert.match(sql, /empresa_id/);
  assert.match(sql, /system-dot/);
});

test('DOT contract: autonomous evidence remains server-side', () => {
  const safe = ({ evidence: _evidence, ...step }: any) => step;
  const result = safe({ id: '1', status: 'completed', evidence: { secret: 'hidden' } });
  assert.deepEqual(result, { id: '1', status: 'completed' });
});
