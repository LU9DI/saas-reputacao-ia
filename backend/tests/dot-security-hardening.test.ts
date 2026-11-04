import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), 'utf8');
}

test('DOT demo mode is opt-in and never available in production', () => {
  const routes = read('routes/dotRoutes.ts');
  const access = read('routes/dotAccessRoutes.ts');
  assert.match(routes, /DOT_DEMO_MODE\s*===\s*['"]1['"]/);
  assert.match(access, /DOT_DEMO_MODE\s*===\s*['"]1['"]/);
  assert.match(routes, /NODE_ENV\s*!==\s*['"]production['"]/);
  assert.match(access, /NODE_ENV\s*!==\s*['"]production['"]/);
});

test('DOT execution binds permission to authenticated actor', () => {
  const routes = read('routes/dotRoutes.ts');
  const gateway = read('services/dotExecutionGateway.ts');
  assert.match(routes, /executeDotAction\(access\.empresaId, actionId, access\.userId/);
  assert.match(gateway, /actorUserId\?\s*:\s*string \| null/);
  assert.match(gateway, /requireDotAccess\(empresaId, permissionResource, 'execute', actorUserId/);
});

test('approval cannot execute the action inline', () => {
  const routes = read('routes/dotRoutes.ts');
  assert.match(routes, /Aprovar não executa/);
  assert.match(routes, /execution:\s*null/);
});

test('external side effects remain blocked by the execution gateway', () => {
  const gateway = read('services/dotExecutionGateway.ts');
  assert.match(gateway, /definition\.externalSideEffect/);
  assert.match(gateway, /executor homologado pelo gateway/);
});

test('permission changes require an authenticated granting actor and are audited', () => {
  const access = read('routes/dotAccessRoutes.ts');
  const service = read('services/dotAccessControl.ts');
  assert.match(access, /canManagePermissions/);
  assert.match(access, /a\.userId/);
  assert.match(service, /Responsável autenticado é obrigatório/);
  assert.match(service, /permission_granted|permission_revoked/);
});

test('tenant scoping is present on the action execution path', () => {
  const gateway = read('services/dotExecutionGateway.ts');
  assert.match(gateway, /a\.empresa_id/);
  assert.match(gateway, /d\.empresa_id = a\.empresa_id/);
});

test('DOT session scope includes tenant and authenticated user identity', () => {
  const routes = read('routes/dotRoutes.ts');
  assert.match(routes, /empresaId.*userScope|userScope.*empresaId/);
  assert.match(routes, /scopedSessionId/);
});

test('DOT execution cannot proceed without an authenticated actor permission', () => {
  const gateway = read('services/dotExecutionGateway.ts');
  assert.match(gateway, /requireDotAccess\(empresaId, permissionResource, 'execute', actorUserId/);
  assert.match(gateway, /Ação externa exige executor homologado pelo gateway/);
  assert.match(gateway, /status = 'approved'/);
});

test('DOT execution audit preserves the authenticated actor', () => {
  const gateway = read('services/dotExecutionGateway.ts');
  const audit = read('services/dotActionAudit.ts');
  assert.match(gateway, /actorType: 'user'/);
  assert.match(gateway, /actorId: actorUserId \|\| null/);
  assert.match(audit, /actor_id TEXT/);
  assert.match(audit, /input\.actorId \|\| null/);
});

test('DOT plan gate runs before permissions and tools', () => {
  const access = read('routes/dotAccessRoutes.ts');
  const gateIndex = access.indexOf('const decision = resolveDotPlan(empresa.plan)');
  const permissionsIndex = access.indexOf('const canManagePermissions');
  assert.ok(gateIndex > 0, 'resolveDotPlan must be used');
  assert.ok(permissionsIndex > 0, 'permission handling must exist');
  assert.ok(gateIndex < permissionsIndex, 'plan gate must precede permission handling');
  assert.doesNotMatch(access, /\|\|\s*['"]rei['"]/);
});

test('DOT routes never resolve a missing plan as Rei', () => {
  const routes = read('routes/dotRoutes.ts');
  assert.doesNotMatch(routes, /String\(empresa\.plan\s*\|\|\s*['"]rei['"]/);
  assert.doesNotMatch(routes, /plan:\s*access\.plan\s*\|\|/);
  assert.match(routes, /planIdentified/);
});
