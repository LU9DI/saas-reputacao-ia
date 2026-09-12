import { test, expect } from '@playwright/test';

const reviewUrl = process.env.E2E_REVIEW_URL;

test.describe('Filtra.AI browser smoke', () => {
  test('landing page renders core CTA and pricing content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(/Filtra\.AI|reputa/i);
    await expect(page.getByRole('link').or(page.getByRole('button')).first()).toBeVisible();
  });

  test('login page renders the authentication form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input').first()).toBeVisible();
    await expect(page.locator('input').nth(1)).toBeVisible();
  });

  test('public evaluation flow sends a client-to-company WhatsApp message only', async ({ page }) => {
    test.skip(!reviewUrl, 'E2E_REVIEW_URL not configured for a real public review link');

    await page.goto(reviewUrl!);
    await expect(page.locator('#nome')).toBeVisible();

    await page.locator('#nome').fill('Cliente E2E');
    await page.getByRole('button', { name: '1' }).click();
    await expect(page.locator('#comentario')).toBeVisible();
    await page.locator('#comentario').fill('Problema real detectado no atendimento.');
    await page.locator('#client-wpp').fill('5511999999999');

    const reviewResponse = page.waitForResponse((response) => response.url().includes('/api/reviews') && response.request().method() === 'POST');
    await page.getByRole('button', { name: /whatsapp|enviar|falar/i }).click();
    const response = await reviewResponse;
    expect(response.ok()).toBeTruthy();

    await expect.poll(async () => page.url()).toContain('wa.me');
    const url = new URL(page.url());
    const message = url.searchParams.get('text') || '';
    expect(message).toContain('Cliente E2E');
    expect(message).toContain('Problema real detectado no atendimento.');
    expect(message).not.toMatch(/resposta da ia|resposta da empresa|análise da empresa/i);
  });
});
