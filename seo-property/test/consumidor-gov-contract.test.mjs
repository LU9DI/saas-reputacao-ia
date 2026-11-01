import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const contractPath = resolve(import.meta.dirname, '../data/consumidor-gov-contract.json');

test('Consumidor.gov.br contract remains blocked until schema and metrics are verified', async () => {
  const contract = JSON.parse(await readFile(contractPath, 'utf8'));
  assert.equal(contract.dataset, 'consumidor-gov-br');
  assert.equal(contract.status, 'blocked_until_csv_schema_verified');
  assert.equal(contract.schema.verified, false);
  assert.equal(contract.schema.columns.length, 0);
  assert.equal(contract.publicationGate.enabled, false);
  assert.equal(contract.publicationGate.requiresVerifiedSourceSchema, true);
  assert.equal(contract.publicationGate.requiresMetricReconciliationAgainstOfficialIndicators, true);
  assert.equal(contract.publicationGate.requiresPrivacyReview, true);
  assert.equal(contract.publicationGate.prohibitConsumerIdentifiers, true);
  assert.equal(contract.publicationGate.prohibitRawComplaintNarratives, true);
  assert.equal(contract.publicationGate.prohibitMixingWithFiltraReviewBenchmarks, true);

  for (const metric of Object.values(contract.metrics)) {
    assert.equal(metric.status, 'blocked');
    assert.equal(metric.denominatorRequired, true);
  }
  for (const mapping of Object.values(contract.schema.fieldMappings)) {
    assert.equal(mapping, null, 'field mappings must not be guessed before inspecting the real CSV');
  }
});
