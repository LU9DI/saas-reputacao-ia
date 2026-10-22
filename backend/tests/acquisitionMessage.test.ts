import { acquisitionMessage } from '../routes/acquisitionRoutes.js';

test('acquisition email templates use actual line breaks', () => {
  for (const stage of ['consented', 'diagnosed', 'followup_1', 'followup_2']) {
    const message = acquisitionMessage(stage, 'Empresa de teste', 'https://filtraai.com');
    assert.ok(message.text.includes('\n'), `${stage} message should contain line breaks`);
    assert.ok(!message.text.includes('\\n'), `${stage} message should not contain literal backslash-n sequences`);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
