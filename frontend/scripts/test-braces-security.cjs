'use strict';

const assert = require('node:assert/strict');
const braces = require('braces');

// Under the package's 10,000-character limit, but beyond the patched depth cap.
const nested = '{'.repeat(150) + 'a' + '}'.repeat(150);

for (const operation of [
  () => braces.parse(nested),
  () => braces(nested),
  () => braces.expand(nested),
]) {
  assert.throws(operation, /maximum nesting depth/i);
}

assert.deepEqual(braces.expand('{a,b}'), ['a', 'b']);
console.log('braces security and compatibility checks: PASS');
