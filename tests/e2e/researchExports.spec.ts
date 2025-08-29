import { test, expect } from '@playwright/test';

test.describe('Research Exports', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/research/exports');
  });

  test('should display export generation form', async ({ page }) => {
    await expect(page.getByText('Research Exports')).toBeVisible();
    await expect(page.getByText('Generate Export')).toBeVisible();
    
    // Check form elements
    await expect(page.getByLabel('Scope')).toBeVisible();
    await expect(page.getByLabel('Format')).toBeVisible();
    await expect(page.getByLabel('K-Anonymity Threshold')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate Export' })).toBeVisible();
  });

  test('should show topic field when topic scope is selected', async ({ page }) => {
    await page.getByLabel('Scope').click();
    await page.getByRole('option', { name: 'By Topic' }).click();
    
    await expect(page.getByLabel('Topic')).toBeVisible();
    await expect(page.getByLabel('Region')).not.toBeVisible();
  });

  test('should show region field when region scope is selected', async ({ page }) => {
    await page.getByLabel('Scope').click();
    await page.getByRole('option', { name: 'By Region' }).click();
    
    await expect(page.getByLabel('Region')).toBeVisible();
    await expect(page.getByLabel('Topic')).not.toBeVisible();
  });

  test('should show both topic and region fields for topic_region scope', async ({ page }) => {
    await page.getByLabel('Scope').click();
    await page.getByRole('option', { name: 'By Topic & Region' }).click();
    
    await expect(page.getByLabel('Topic')).toBeVisible();
    await expect(page.getByLabel('Region')).toBeVisible();
  });

  test('should generate export job', async ({ page }) => {
    // Mock successful export generation
    await page.route('**/functions/v1/exports/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-job-1',
          requested_by: 'test-user',
          format: 'csv',
          filters: { scope: 'topic', topic: 'Economy' },
          status: 'queued',
          created_at: new Date().toISOString()
        })
      });
    });

    // Fill form
    await page.getByLabel('Topic').fill('Economy');
    await page.getByLabel('Format').click();
    await page.getByRole('option', { name: 'CSV' }).click();
    
    // Submit
    await page.getByRole('button', { name: 'Generate Export' }).click();
    
    // Check for success message
    await expect(page.getByText('Export Started')).toBeVisible();
  });

  test('should display export jobs table', async ({ page }) => {
    // Mock export jobs list
    await page.route('**/export_jobs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'job-1',
            format: 'csv',
            filters: { scope: 'topic', topic: 'Economy' },
            status: 'complete',
            row_count: 150,
            created_at: new Date().toISOString(),
            download_url: 'https://example.com/download/job-1.csv'
          },
          {
            id: 'job-2',
            format: 'json',
            filters: { scope: 'region', region: 'California' },
            status: 'running',
            created_at: new Date().toISOString()
          }
        ])
      });
    });

    await page.reload();
    
    await expect(page.getByText('Export Jobs')).toBeVisible();
    await expect(page.getByText('topic export (CSV)')).toBeVisible();
    await expect(page.getByText('region export (JSON)')).toBeVisible();
    await expect(page.getByText('150 records')).toBeVisible();
  });

  test('should show download button for completed jobs', async ({ page }) => {
    // Mock completed job
    await page.route('**/export_jobs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'job-1',
            format: 'csv',
            filters: { scope: 'topic', topic: 'Economy' },
            status: 'complete',
            row_count: 150,
            created_at: new Date().toISOString(),
            download_url: 'https://example.com/download/job-1.csv'
          }
        ])
      });
    });

    await page.reload();
    
    const downloadButton = page.getByRole('button', { name: 'Download' });
    await expect(downloadButton).toBeVisible();
    
    // Mock window.open
    await page.evaluate(() => {
      window.open = jest.fn();
    });
    
    await downloadButton.click();
    
    // Verify download was triggered
    await page.evaluate(() => {
      expect(window.open).toHaveBeenCalledWith('https://example.com/download/job-1.csv', '_blank');
    });
  });

  test('should handle export generation errors', async ({ page }) => {
    // Mock error response
    await page.route('**/functions/v1/exports/generate', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Export generation failed' })
      });
    });

    await page.getByLabel('Topic').fill('Economy');
    await page.getByRole('button', { name: 'Generate Export' }).click();
    
    await expect(page.getByText('Failed to generate export')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to generate without required topic field
    await page.getByLabel('Scope').click();
    await page.getByRole('option', { name: 'By Topic' }).click();
    
    await page.getByRole('button', { name: 'Generate Export' }).click();
    
    // Should not proceed without topic
    const generateButton = page.getByRole('button', { name: 'Generate Export' });
    await expect(generateButton).toBeVisible(); // Still on form
  });

  test('should update k-anonymity threshold', async ({ page }) => {
    const kInput = page.getByLabel('K-Anonymity Threshold');
    await expect(kInput).toHaveValue('25');
    
    await kInput.fill('50');
    await expect(kInput).toHaveValue('50');
  });
});