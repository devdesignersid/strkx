import { test, expect } from '@playwright/test';

test('critical user journey: view problem', async ({ page }) => {
  // 1. Navigate to home (should redirect to dashboard or problems)
  await page.goto('/');

  // 2. Navigate to Problems page
  // Assuming there is a link or we can go directly.
  // Let's try going directly to /problems first to be safe, or click a nav link.
  await page.goto('/problems');

  // Verify we are on problems page
  await expect(page.getByRole('heading', { name: 'Problems' })).toBeVisible();

  // 3. Click on a problem (e.g., Two Sum if it exists, or just the first one)
  // Wait for loading to finish (skeletons to disappear)
  // Check if error toast appears
  const errorToast = page.getByText('Failed to load problems');
  if (await errorToast.isVisible()) {
    console.error('Failed to load problems toast visible');
  }

  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30000 });

  // Click the first problem title
  // We assume there is at least one problem. If not, this will fail, which is good (we need data).
  await page.locator('tbody tr td').nth(1).click();

  // 4. Verify Problem Page loads
  await expect(page).toHaveURL(/\/problems\/.+/);

  // Expect to see the title and description panel
  // Use a more specific selector if needed, or just wait longer
  await expect(page.getByRole('button', { name: 'Description', exact: true })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Run' })).toBeVisible();
});
