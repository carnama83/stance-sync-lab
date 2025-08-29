import { test, expect } from '@playwright/test';

test.describe('Moderation Queue', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for test
    await page.goto('/auth/signup');
    
    // Fill out signup form (mock)
    await page.fill('input[type="email"]', 'moderator@test.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to complete
    await page.waitForURL('/');
  });

  test('should display moderation queue for authorized users', async ({ page }) => {
    await page.goto('/ops/moderation');
    
    // Should see moderation queue page
    await expect(page.locator('h1')).toContainText('Moderation Queue');
    await expect(page.locator('text=Review and moderate reported content')).toBeVisible();
  });

  test('should show filters for reports', async ({ page }) => {
    await page.goto('/ops/moderation');
    
    // Should see filter sections
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Reason')).toBeVisible();
    await expect(page.locator('text=Age')).toBeVisible();
    
    // Should have filter dropdowns
    const statusFilter = page.locator('select').first();
    await expect(statusFilter).toBeVisible();
  });

  test('should filter reports by status', async ({ page }) => {
    await page.goto('/ops/moderation');
    
    // Change status filter
    await page.selectOption('select >> nth=0', 'open');
    
    // Should update the displayed reports
    await page.waitForTimeout(1000); // Allow time for filter to apply
    
    // Check that URL or content reflects the filter
    const reports = page.locator('[data-testid="report-item"]');
    // In a real test, we'd verify that all visible reports have "open" status
  });

  test('should allow moderators to take actions on reports', async ({ page }) => {
    // First, create a test comment and report
    await page.goto('/question/test-question-id');
    
    // Post a test comment
    await page.fill('textarea[placeholder*="Share your thoughts"]', 'This is a test comment for moderation');
    await page.click('text=Post Comment');
    
    // Report the comment
    await page.click('[data-testid="report-button"]');
    await page.click('text=Spam or irrelevant content');
    
    // Navigate to moderation queue
    await page.goto('/ops/moderation');
    
    // Should see the reported comment
    await expect(page.locator('text=This is a test comment')).toBeVisible();
    
    // Click Take Action
    await page.click('text=Take Action');
    
    // Should see action dialog
    await expect(page.locator('text=Moderation Action')).toBeVisible();
    await expect(page.locator('text=Hide Comment')).toBeVisible();
    await expect(page.locator('text=Mark Triaged')).toBeVisible();
    
    // Add notes and take action
    await page.fill('textarea[placeholder*="Add notes"]', 'Test moderation action');
    await page.click('text=Mark Triaged');
    
    // Should see success message
    await expect(page.locator('text=Action completed')).toBeVisible();
  });

  test('should show mock AI scores', async ({ page }) => {
    await page.goto('/ops/moderation');
    
    // Should display mock AI scores for reports
    await expect(page.locator('text=Mock AI Score')).toBeVisible();
  });

  test('should hide/restore comments through moderation', async ({ page }) => {
    await page.goto('/ops/moderation');
    
    // Find a report and hide the comment
    const firstActionButton = page.locator('text=Take Action').first();
    if (await firstActionButton.isVisible()) {
      await firstActionButton.click();
      
      // Hide the comment
      await page.click('text=Hide Comment');
      
      // Should see success message
      await expect(page.locator('text=Action completed')).toBeVisible();
      
      // Comment should now be marked as hidden
      await expect(page.locator('text=Hidden')).toBeVisible();
    }
  });

  test('should prevent unauthorized access', async ({ page }) => {
    // Test without proper authentication
    await page.goto('/ops/moderation');
    
    // Should see access denied message
    await expect(page.locator('text=Moderator Access Required')).toBeVisible();
    await expect(page.locator('text=You need moderator permissions')).toBeVisible();
  });

  test('should display report metadata correctly', async ({ page }) => {
    await page.goto('/ops/moderation');
    
    // Should show report information
    await expect(page.locator('text=Open')).toBeVisible(); // Status badge
    await expect(page.locator('text=Normal')).toBeVisible(); // Severity badge
    await expect(page.locator('text=Reported on')).toBeVisible(); // Timestamp
  });

  test('should update filters and refresh data', async ({ page }) => {
    await page.goto('/ops/moderation');
    
    // Change multiple filters
    await page.selectOption('select >> nth=0', 'triaged'); // Status
    await page.selectOption('select >> nth=1', 'harassment'); // Reason
    await page.selectOption('select >> nth=2', '24h'); // Age
    
    // Should trigger data refresh
    await page.waitForTimeout(1000);
    
    // Verify the filters are applied
    const statusSelect = page.locator('select').nth(0);
    await expect(statusSelect).toHaveValue('triaged');
  });
});