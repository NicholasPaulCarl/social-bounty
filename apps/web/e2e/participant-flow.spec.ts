import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Participant flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'participant');
  });

  test('bounty marketplace loads and shows page heading', async ({ page }) => {
    await page.goto('/bounties');

    await expect(page.getByRole('heading', { name: /browse bounties/i })).toBeVisible();

    // Category filter chips (All, etc.) should be rendered
    await expect(page.getByRole('button', { name: /^all$/i })).toBeVisible();
  });

  test('bounty marketplace shows layout toggle buttons', async ({ page }) => {
    await page.goto('/bounties');

    await expect(page.getByRole('button', { name: /grid view/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /list view/i })).toBeVisible();
  });

  test('bounty marketplace shows either bounties or empty state', async ({ page }) => {
    await page.goto('/bounties');

    // Wait for loading to finish — either bounty cards or empty state appear
    await page.waitForFunction(() => {
      const loading = document.querySelector('[aria-label="Loading"]');
      return !loading;
    }, { timeout: 15_000 });

    const hasBountyCards = await page.locator('.glass-card').count() > 0;
    const hasEmptyState = await page.getByText(/no bounties match your filters/i).isVisible().catch(() => false);

    expect(hasBountyCards || hasEmptyState).toBeTruthy();
  });

  test('bounty detail page loads when navigating to a bounty', async ({ page }) => {
    await page.goto('/bounties');

    // If bounty cards are present, click the first one
    const firstCard = page.locator('.glass-card a, .glass-card button').first();
    const cardCount = await page.locator('.glass-card').count();

    if (cardCount > 0) {
      // Navigate directly via URL pattern to avoid relying on a specific bounty
      const bountyLink = page.locator('a[href*="/bounties/"]').first();
      const hasLink = await bountyLink.count() > 0;

      if (hasLink) {
        await bountyLink.click();
        await expect(page).toHaveURL(/\/bounties\/.+/);

        // Detail page should have some heading
        const heading = page.getByRole('heading').first();
        await expect(heading).toBeVisible();
      }
    }
  });

  test('my-submissions page loads', async ({ page }) => {
    await page.goto('/my-submissions');

    await expect(page.getByRole('heading', { name: /my submissions/i })).toBeVisible();

    // Earnings summary cards should be present (Total Submissions card)
    await expect(page.getByText(/total submissions/i)).toBeVisible();
  });

  test('my-submissions page shows filter controls', async ({ page }) => {
    await page.goto('/my-submissions');

    // Filter dropdowns should be visible
    await expect(page.getByRole('combobox').first()).toBeVisible();
  });

  test('profile page loads and shows user info', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible();
    await expect(page.getByText(/account details/i)).toBeVisible();

    // Should show the logged-in user's email
    await expect(page.getByText('participant@demo.com')).toBeVisible();
  });

  test('profile page shows edit profile button', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.getByRole('button', { name: /edit profile/i })).toBeVisible();
  });

  test('profile page shows change password section', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: /change password/i })).toBeVisible();
  });
});
