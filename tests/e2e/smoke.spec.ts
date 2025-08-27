import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Smoke Tests', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check that the main heading is visible
    await expect(page.locator('h1')).toContainText('Website V2');
    
    // Check that the description is present
    await expect(page.getByText('A social media platform for capturing public sentiment')).toBeVisible();
    
    // Check that all three feature cards are present
    await expect(page.getByText('News Ingestion')).toBeVisible();
    await expect(page.getByText('Stance Capture')).toBeVisible();
    await expect(page.getByText('Community Pulse')).toBeVisible();
  });

  test('homepage meets accessibility standards', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});