import test from 'node:test';
import assert from 'node:assert/strict';
import { isPostgresUrl } from '../lib/db.pg.js';

test('database adapter detects supported Postgres URLs', () => {
  assert.equal(isPostgresUrl('postgres://user:pass@host/db'), true);
  assert.equal(isPostgresUrl('postgresql://user:pass@host/db'), true);
  assert.equal(isPostgresUrl('sqlite:///tmp/test.sqlite'), false);
  assert.equal(isPostgresUrl(undefined), false);
});
