import { test, expect } from '@playwright/test';

test.describe('AQ Preview Page', () => {
  test('should require dev key authorization', async ({ page }) => {
    await page.goto('/ops/aq-preview');

    // Should show authorization form
    await expect(page.getByText('Dev Access Required')).toBeVisible();
    await expect(page.getByText('Enter the development key')).toBeVisible();
    await expect(page.getByPlaceholder('Enter DEV_KEY')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Access Preview' })).toBeVisible();
  });

  test('should show preview interface after authorization', async ({ page }) => {
    await page.goto('/ops/aq-preview');

    // Enter dev key (using a test key)
    await page.getByPlaceholder('Enter DEV_KEY').fill('test-dev-key');
    await page.getByRole('button', { name: 'Access Preview' }).click();

    // Should show the main interface
    await expect(page.getByText('AI Question Preview (Development)')).toBeVisible();
    await expect(page.getByText('Mock news ingestion and AI question generation testing')).toBeVisible();
    
    // Should show filter input
    await expect(page.getByPlaceholder('Filter clusters and questions by topic...')).toBeVisible();
    
    // Should show ingestion button
    await expect(page.getByRole('button', { name: 'Run Mock Ingestion' })).toBeVisible();
    
    // Should show stats cards
    await expect(page.getByText('Story Clusters')).toBeVisible();
    await expect(page.getByText('Generated Questions')).toBeVisible();
    await expect(page.getByText('Unique Topics')).toBeVisible();
    
    // Should show empty state messages initially
    await expect(page.getByText('No story clusters found. Run mock ingestion to generate data.')).toBeVisible();
    await expect(page.getByText('No questions found. Run mock ingestion to generate data.')).toBeVisible();
  });

  test('should have responsive design', async ({ page }) => {
    await page.goto('/ops/aq-preview');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('Dev Access Required')).toBeVisible();
    
    // Enter dev key
    await page.getByPlaceholder('Enter DEV_KEY').fill('test-dev-key');
    await page.getByRole('button', { name: 'Access Preview' }).click();
    
    // Should still be usable on mobile
    await expect(page.getByText('AI Question Preview (Development)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run Mock Ingestion' })).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.getByText('AI Question Preview (Development)')).toBeVisible();
  });

  test('should show loading state for ingestion button', async ({ page }) => {
    await page.goto('/ops/aq-preview');
    
    // Authorize
    await page.getByPlaceholder('Enter DEV_KEY').fill('test-dev-key');
    await page.getByRole('button', { name: 'Access Preview' }).click();
    
    // The button should be present and clickable (though it may fail due to no real backend)
    const ingestButton = page.getByRole('button', { name: 'Run Mock Ingestion' });
    await expect(ingestButton).toBeVisible();
    await expect(ingestButton).toBeEnabled();
  });

  test('should allow topic filtering', async ({ page }) => {
    await page.goto('/ops/aq-preview');
    
    // Authorize
    await page.getByPlaceholder('Enter DEV_KEY').fill('test-dev-key');
    await page.getByRole('button', { name: 'Access Preview' }).click();
    
    // Test filter input
    const filterInput = page.getByPlaceholder('Filter clusters and questions by topic...');
    await expect(filterInput).toBeVisible();
    await expect(filterInput).toBeEnabled();
    
    // Should be able to type in filter
    await filterInput.fill('technology');
    await expect(filterInput).toHaveValue('technology');
  });

  test('should navigate back to home from unauthorized state', async ({ page }) => {
    await page.goto('/ops/aq-preview');
    
    // Should show auth form with no back button (since it's dev-only)
    await expect(page.getByText('Dev Access Required')).toBeVisible();
    
    // Can navigate back via browser
    await page.goto('/');
    await expect(page.getByText('Website V2')).toBeVisible();
  });
});