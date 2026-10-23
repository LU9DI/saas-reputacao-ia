import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Database } from 'sqlite';
import {
  CONTENT_SOURCES,
  buildDraftId,
  buildUtmUrl,
  campaignIdFor,
  fallbackDrafts,
  findClaimFlags,
  generateAcquisitionContent,
  normalizeDrafts,
  parseDraftJson,
  publishConfigured,
  selectSourcesForBatch,
  type ContentSource,
} from '../services/acquisitionContent.js';

const source: ContentSource = {
  path: '/blog/exemplo',
  title: 'Exemplo de página',
  description: 'Descrição real da página.',
  audience: 'gestores',
  angle: 'Um ângulo editorial.',
  priority: 1,
};

const now = new Date('2026-10-22T12:00:00.000Z');

describe('acquisition content: UTM e identificadores', () => {
  it('gera URLs com os parâmetros esperados e sem dados pessoais', () => {
    const url = new URL(buildUtmUrl(source, 'linkedin', 'organic-content-2026-10'));
    assert.equal(url.origin + url.pathname, 'https://filtraai.com/blog/exemplo');
    assert.equal(url.searchParams.get('utm_source'), 'linkedin');
    assert.equal(url.searchParams.get('utm_medium'), 'social');
    assert.equal(url.searchParams.get('utm_campaign'), 'organic-content-2026-10');
    assert.equal(url.searchParams.get('utm_content'), 'blog-exemplo-linkedin');
    assert.equal(url.searchParams.get('email'), null);
  });

  it('usa campanha mensal determinística', () => {
    assert.equal(campaignIdFor(now), 'organic-content-2026-10');
    assert.notEqual(buildDraftId('campaign-a', source.path, 'linkedin'), buildDraftId('campaign-b', source.path, 'linkedin'));
    assert.equal(buildDraftId('campaign-a', source.path, 'linkedin'), buildDraftId('campaign-a', source.path, 'linkedin'));
  });

  it('pode apontar uma página sem CTA de auditoria direto para a auditoria', () => {
    const url = new URL(
      buildUtmUrl({ ...source, path: '/clinicas', ctaPath: '/auditoria-gratuita' }, 'instagram', 'organic-content-2026-10'),
    );
    assert.equal(url.pathname, '/auditoria-gratuita');
    assert.equal(url.searchParams.get('utm_content'), 'clinicas-instagram');
  });
});

describe('acquisition content: segurança editorial', () => {
  it('sinaliza métricas, valores e promessas para revisão humana', () => {
    const flags = findClaimFlags('Aumentamos 35% em 30 dias. Garantimos R$ 99 de desconto.');
    assert.ok(flags.includes('percentual'));
    assert.ok(flags.includes('valor em reais'));
    assert.ok(flags.includes('promessa de garantia'));
  });

  it('não inventa métricas no fallback e mantém a URL de cada canal', () => {
    const drafts = fallbackDrafts(source, 'organic-content-2026-10');
    for (const channel of ['linkedin', 'instagram', 'x'] as const) {
      assert.ok(drafts[channel].length <= (channel === 'x' ? 280 : 1500));
      assert.ok(drafts[channel].includes(`utm_source=${channel}`));
      assert.equal(findClaimFlags(drafts[channel]).includes('percentual'), false);
      assert.equal(findClaimFlags(drafts[channel]).includes('valor em reais'), false);
    }
  });

  it('aceita JSON com cerca de markdown e descarta saída inválida', () => {
    assert.deepEqual(parseDraftJson('```json\n{"linkedin":"ok"}\n```'), { linkedin: 'ok' });
    assert.equal(parseDraftJson('não é json'), null);
    assert.equal(parseDraftJson('[]'), null);
  });

  it('normaliza saída da IA e garante CTA/limite por canal', () => {
    const longX = 'x'.repeat(400);
    const drafts = normalizeDrafts(
      {
        linkedin: 'Uma ideia útil para gestores que acompanham avaliações e feedback. '.repeat(2) + 'https://exemplo-invalido.test/post',
        instagram: 'Outra ideia útil para quem acompanha a experiência do cliente.',
        x: longX,
      },
      source,
      'organic-content-2026-10',
    );
    assert.ok(drafts.x.length <= 280);
    assert.equal(drafts.linkedin.includes('exemplo-invalido.test'), false);
    assert.ok(drafts.linkedin.includes('utm_source=linkedin'));
    assert.ok(drafts.instagram.includes('utm_source=instagram'));
  });
});

describe('acquisition content: rotação de fontes', () => {
  it('pula fontes promovidas nos últimos 30 dias e respeita o limite', () => {
    const sources: ContentSource[] = [
      { ...source, path: '/recente', priority: 1 },
      { ...source, path: '/antiga', priority: 2 },
      { ...source, path: '/nova', priority: 3 },
    ];
    const selected = selectSourcesForBatch(
      sources,
      [
        { source_url: '/recente', created_at: '2026-10-20T00:00:00.000Z' },
        { source_url: '/antiga', created_at: '2026-08-01T00:00:00.000Z' },
      ],
      1,
      now,
    );
    assert.deepEqual(selected.map((item) => item.path), ['/antiga']);
  });

  it('tem um catálogo de páginas reais sem duplicatas', () => {
    const paths = CONTENT_SOURCES.map((item) => item.path);
    assert.equal(new Set(paths).size, paths.length);
    assert.ok(paths.every((path) => path.startsWith('/')));
  });
});

describe('acquisition content: publicação', () => {
  it('só fica configurada com flag explícita e URL de webhook', () => {
    const previousEnabled = process.env.ACQUISITION_PUBLISH_ENABLED;
    const previousUrl = process.env.ACQUISITION_PUBLISH_WEBHOOK_URL;
    try {
      delete process.env.ACQUISITION_PUBLISH_ENABLED;
      delete process.env.ACQUISITION_PUBLISH_WEBHOOK_URL;
      assert.equal(publishConfigured(), false);
      process.env.ACQUISITION_PUBLISH_ENABLED = 'true';
      assert.equal(publishConfigured(), false);
      process.env.ACQUISITION_PUBLISH_WEBHOOK_URL = 'https://example.com/publish';
      assert.equal(publishConfigured(), true);
      process.env.ACQUISITION_PUBLISH_ENABLED = 'false';
      assert.equal(publishConfigured(), false);
    } finally {
      if (previousEnabled === undefined) delete process.env.ACQUISITION_PUBLISH_ENABLED;
      else process.env.ACQUISITION_PUBLISH_ENABLED = previousEnabled;
      if (previousUrl === undefined) delete process.env.ACQUISITION_PUBLISH_WEBHOOK_URL;
      else process.env.ACQUISITION_PUBLISH_WEBHOOK_URL = previousUrl;
    }
  });
});

describe('acquisition content: geração', () => {
  it('grava somente pending_review e nunca chama publicação', async () => {
    const inserts: Array<{ sql: string; params: unknown[] }> = [];
    const fakeDb = {
      exec: async () => undefined,
      all: async () => [],
      get: async () => undefined,
      run: async (sql: string, params: unknown[]) => {
        inserts.push({ sql, params });
        return { changes: 1 };
      },
    } as unknown as Database;

    const fakeAi = async () => ({
      text: JSON.stringify({
        linkedin: 'Rascunho de teste com contexto suficiente para revisão humana.',
        instagram: 'Rascunho de teste com contexto suficiente para revisão humana.',
        x: 'Rascunho de teste com contexto suficiente para revisão.',
      }),
      provider: 'groq',
      latency_ms: 1,
      tokens: 1,
    });

    const result = await generateAcquisitionContent({
      db: fakeDb,
      limit: 1,
      now,
      ai: fakeAi as any,
    });

    assert.equal(result.generated, 3);
    assert.equal(inserts.length, 3);
    for (const insert of inserts) {
      assert.match(insert.sql, /pending_review/);
      assert.match(insert.sql, /INSERT INTO acquisition_content/);
      assert.match(String(insert.params[4]), /Rascunho de teste com contexto suficiente/);
      assert.match(String(insert.params[5]), /^auditoria-gratuita-(linkedin|instagram|x)$/);
      assert.match(String(insert.params[6]), /utm_source=/);
    }
  });
});
