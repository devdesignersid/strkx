import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, request }) => {
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
});

test.describe('Edge Cases & Hardening', () => {
  test('Long text handling in Problem creation', async ({ page }) => {
    // Navigate to create problem page (assuming auth is handled or bypassed)
    await page.goto('/problems/create');

    // Fill with long title
    const longTitle = 'A'.repeat(101); // 101 chars, limit is 100
    await page.getByPlaceholder('Problem Title').fill(longTitle);

    // Check for validation error (assuming client-side validation or backend error toast)
    // Since we added backend validation, we expect a toast or error on submit
    // But we also want to test truncation in UI.

    // Let's test truncation first with a valid but long title (100 chars)
    const validLongTitle = 'A'.repeat(100);
    await page.getByPlaceholder('Problem Title').fill(validLongTitle);
    await page.getByPlaceholder('Problem Slug').fill('long-title-test');
    await page.getByPlaceholder('Description').fill('Test description');

    // Submit
    await page.getByRole('button', { name: 'Create Problem' }).click();

    // Wait for navigation or success
    // Then verify truncation in the list or dashboard
    // For now, let's verify the TruncatedText component behavior directly if possible,
    // or just check if the element has the truncation class.
  });

  test('Input validation for List creation', async ({ page }) => {
    await page.goto('/lists');

    // Open create list modal
    await page.getByRole('button', { name: 'Create New List' }).click();

    // Try to create list with long name
    const longName = 'A'.repeat(51); // Limit 50
    await page.getByPlaceholder('List Name').fill(longName);
    await page.getByRole('button', { name: 'Create' }).click(); // Assuming button name

    // Expect error toast
    await expect(page.getByText('must be shorter than or equal to 50 characters')).toBeVisible();
  });
});
