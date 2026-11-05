import { test, expect, type Page } from '@playwright/test';

/**
 * GA4: consentimento, carregamento único da tag e page_view sem duplicação.
 *
 * O build já traz o Measurement ID real da propriedade como padrão, então o
 * teste roda sempre. `gtag.js` é stubado: a verificação é do nosso comportamento
 * (consentimento, carregamento único, page_view por rota) e nada é enviado ao
 * Google.
 */

test.describe('GA4 instrumentation', () => {
  test.beforeEach(async ({ page }) => {
    // Host de teste não é o domínio canônico: liga o modo debug explicitamente.
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem('filtra_ga_debug', '1');
      } catch {
        /* storage bloqueado */
      }
    });
    await page.route('**/googletagmanager.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* stub */' })
    );
    await page.route('**/google-analytics.com/**', (route) => route.fulfill({ status: 204, body: '' }));
  });

  test('nenhuma requisição ao Google antes do consentimento', async ({ page }) => {
    const googleRequests = trackGoogleRequests(page);

    await page.goto('/');
    await expect(page.getByRole('dialog', { name: /Cookies de medição/i })).toBeVisible();
    await page.waitForTimeout(1200);

    expect(googleRequests()).toEqual([]);
    expect(await page.evaluate(() => typeof (window as { gtag?: unknown }).gtag)).toBe('undefined');
  });

  test('consentimento carrega gtag.js uma única vez e uma page_view por rota', async ({ page }) => {
    const googleRequests = trackGoogleRequests(page);

    await page.goto('/');
    await page.getByRole('button', { name: /^Aceitar$/ }).click();
    await expect.poll(() => googleRequests().length).toBeGreaterThan(0);

    await expect
      .poll(async () => pageViews(page))
      .toBe(1);

    const firstRoute = await page.evaluate(() => window.location.pathname);
    await page.getByRole('link', { name: /^Blog$/ }).first().click();
    await page.waitForURL(/\/blog$/);
    expect(await page.evaluate(() => window.location.pathname)).not.toBe(firstRoute);

    await expect.poll(async () => pageViews(page)).toBe(2);

    // A tag não é recarregada em navegação SPA.
    const gtagScripts = googleRequests().filter((url) => url.includes('/gtag/js'));
    expect(new Set(gtagScripts).size).toBe(1);
    expect(gtagScripts.length).toBe(1);
    // O page_view automático está desligado: só o nosso page_view manual.
    const config = await page.evaluate(() =>
      (window as unknown as { dataLayer?: unknown[][] }).dataLayer?.find(
        (entry) => entry[0] === 'config'
      )
    );
    expect(JSON.stringify(config)).toContain('send_page_view');
    expect(JSON.stringify(config)).toContain('false');
  });

  test('recusar mantém a medição desligada', async ({ page }) => {
    const googleRequests = trackGoogleRequests(page);

    await page.goto('/');
    await page.getByRole('button', { name: /^Recusar$/ }).click();
    await page.waitForTimeout(1200);

    expect(googleRequests()).toEqual([]);
    expect(await page.evaluate(() => window.localStorage.getItem('filtra_consent_v1'))).toBe(
      'denied'
    );
  });

  test('cta_click e contact saem sem dados pessoais', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /^Aceitar$/ }).click();
    await expect.poll(async () => (await eventEntries(page)).length).toBeGreaterThan(0);

    // CTA da seção Filtra Dot (âncora interna: não troca de rota).
    await page.locator('[data-ga-cta="view_plans"]').first().click();
    await expect
      .poll(async () => (await eventEntries(page)).filter((e) => e[1] === 'cta_click').length)
      .toBeGreaterThan(0);

    const cta = (await eventEntries(page)).find((e) => e[1] === 'cta_click');
    expect(cta?.[2]).toEqual({ cta: 'view_plans', placement: 'dot_section' });

    // Link de e-mail na página de suporte.
    await page.goto('/suporte');
    await page.locator('a[href^="mailto:"]').first().click({ noWaitAfter: true });
    await expect
      .poll(async () => (await eventEntries(page)).filter((e) => e[1] === 'contact').length)
      .toBeGreaterThan(0);

    const contact = (await eventEntries(page)).find((e) => e[1] === 'contact');
    expect(contact?.[2]).toEqual({ channel: 'email' });

    const dump = JSON.stringify(await eventEntries(page));
    expect(dump).not.toMatch(/[^\s@]+@[^\s@]+\.[a-z]{2,}/i);
    expect(dump).not.toMatch(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/);
  });
});

async function eventEntries(page: Page): Promise<unknown[][]> {
  return page.evaluate(() => {
    const layer = (window as unknown as { dataLayer?: unknown[][] }).dataLayer || [];
    return layer.filter((entry) => entry[0] === 'event');
  });
}

function trackGoogleRequests(page: Page) {
  const urls: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('googletagmanager.com') || url.includes('google-analytics.com')) {
      urls.push(url);
    }
  });
  return () => urls;
}

async function pageViews(page: Page): Promise<number> {
  return page.evaluate(() => {
    const layer = (window as unknown as { dataLayer?: unknown[][] }).dataLayer || [];
    return layer.filter((entry) => entry[0] === 'event' && entry[1] === 'page_view').length;
  });
}
