import test from 'node:test';
import assert from 'node:assert/strict';
import { pedeMarkdown } from '../../src/lib/negociacao.ts';

test('pede Markdown só quando text/markdown está presente e HTML não', () => {
  assert.equal(pedeMarkdown('text/markdown'), true);
  assert.equal(pedeMarkdown('text/markdown, text/plain;q=0.5'), true);
  assert.equal(pedeMarkdown('text/html,application/xhtml+xml,*/*;q=0.8'), false);
  assert.equal(pedeMarkdown('text/markdown, text/html'), false);
  assert.equal(pedeMarkdown('*/*'), false);
  assert.equal(pedeMarkdown(null), false);
});
