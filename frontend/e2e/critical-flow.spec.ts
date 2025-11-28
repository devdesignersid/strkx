import { test, expect } from '@playwright/test';

test('critical user journey: view problem', async ({ page, request }) => {
  // 0. Login using bypass
  const loginResponse = await request.post('http://localhost:3000/auth/test-login', {
    data: { email: 'test@example.com' }
  });
  expect(loginResponse.ok()).toBeTruthy();

  // Get cookies from response and add to context
  const headers = loginResponse.headers();
  const setCookie = headers['set-cookie'];
  if (setCookie) {
      const cookies = setCookie.split('\n').map(c => {
          const [nameValue, ...rest] = c.split(';');
          const [name, value] = nameValue.split('=');
          return {
              name,
              value,
              domain: 'localhost',
              path: '/',
              httpOnly: true,
              secure: false, // We are on localhost
              sameSite: 'Lax' as const,
          };
      });
      await page.context().addCookies(cookies);
  }

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
