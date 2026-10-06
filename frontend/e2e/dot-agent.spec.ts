import { test, expect } from '@playwright/test';

test.describe('DOT global agent surface', () => {
  test('shows the DOT launcher on login and opens the agent panel', async ({ page }) => {
    await page.goto('/login');
    const launcher = page.getByTestId('dot-agent-launcher');
    await expect(launcher).toBeVisible();
    await launcher.click();
    await expect(page.getByTestId('dot-agent-panel')).toBeVisible();
    await expect(page.getByText('O que você quer que eu cuide?')).toBeVisible();
  });

  test('keeps the DOT launcher global without a standalone DOT page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('dot-agent-launcher')).toBeVisible();
    await page.goto('/preview');
    await expect(page.getByTestId('dot-agent-launcher')).toBeVisible();
    await page.getByTestId('dot-agent-launcher').click();
    await expect(page.getByTestId('dot-agent-panel')).toBeVisible();
  });

  test('does not expose a standalone DOT product route', async ({ page }) => {
    const response = await page.goto('/dot');
    expect(response?.status()).toBe(404);
  });
});
