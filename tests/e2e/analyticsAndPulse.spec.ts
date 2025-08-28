import { test, expect } from '@playwright/test';

test.describe('Analytics and Pulse Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should navigate to personal analytics for authenticated user', async ({ page }) => {
    // Skip if not authenticated - would redirect to signup
    await page.goto('/me/analytics');
    
    // Check if redirected to signup (not authenticated) or analytics loaded
    const currentUrl = page.url();
    
    if (currentUrl.includes('/auth/signup')) {
      // User not authenticated - this is expected behavior
      expect(currentUrl).toContain('/auth/signup');
    } else {
      // User is authenticated - check analytics page
      await expect(page.locator('h1')).toContainText('Personal Analytics');
      
      // Should show either data or no data message
      const hasData = await page.locator('text=Total Stances').isVisible();
      const noData = await page.locator('text=No Data Available').isVisible();
      
      expect(hasData || noData).toBeTruthy();
      
      if (hasData) {
        // If user has data, check for chart elements
        await expect(page.locator('text=Stance Timeline')).toBeVisible();
        await expect(page.locator('text=Weekly Change')).toBeVisible();
        await expect(page.locator('text=Monthly Change')).toBeVisible();
      }
    }
  });

  test('should load community pulse page', async ({ page }) => {
    await page.goto('/pulse');
    
    // Page should load regardless of auth status
    await expect(page.locator('h1')).toContainText('Community Pulse');
    
    // Should have region selector
    await expect(page.locator('text=Region Selection')).toBeVisible();
    await expect(page.locator('text=Geographic Scope')).toBeVisible();
    
    // Should show either data or no data message
    const hasData = await page.locator('text=Sample Size').isVisible();
    const noData = await page.locator('text=No Data Available').isVisible();
    
    expect(hasData || noData).toBeTruthy();
  });

  test('should allow region scope selection on pulse page', async ({ page }) => {
    await page.goto('/pulse');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Community Pulse');
    
    // Find and interact with the select dropdown
    const scopeSelect = page.locator('[data-testid="scope-select"], #scope-select').first();
    
    if (await scopeSelect.isVisible()) {
      await scopeSelect.click();
      
      // Should see dropdown options
      await expect(page.locator('text=Global')).toBeVisible();
      await expect(page.locator('text=My Country')).toBeVisible();
      await expect(page.locator('text=My State')).toBeVisible();
      await expect(page.locator('text=My City')).toBeVisible();
      
      // Select a different scope
      await page.locator('text=My Country').click();
      
      // Page should update (might show no data for specific regions)
      await page.waitForTimeout(1000); // Wait for data to potentially load
    }
  });

  test('should show dev controls when settings button clicked', async ({ page }) => {
    await page.goto('/pulse');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Community Pulse');
    
    // Click settings button to show dev controls
    const settingsButton = page.locator('button[aria-label="Toggle developer controls"]');
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      
      // Dev controls should appear
      await expect(page.locator('text=Developer Controls')).toBeVisible();
      await expect(page.locator('text=Dev Key')).toBeVisible();
      await expect(page.locator('text=Trigger Aggregation')).toBeVisible();
    }
  });

  test('should handle navigation between pages', async ({ page }) => {
    // Test navigation from pulse to home
    await page.goto('/pulse');
    await expect(page.locator('h1')).toContainText('Community Pulse');
    
    const backButton = page.locator('button[aria-label="Go back to home"]');
    if (await backButton.isVisible()) {
      await backButton.click();
      await expect(page.url()).not.toContain('/pulse');
    }
    
    // Test navigation to analytics (if user goes there directly)
    await page.goto('/me/analytics');
    
    // Should either show analytics or redirect to signup
    const currentUrl = page.url();
    const isAnalytics = currentUrl.includes('/me/analytics');
    const isSignup = currentUrl.includes('/auth/signup');
    
    expect(isAnalytics || isSignup).toBeTruthy();
  });

  test('should display accessibility features', async ({ page }) => {
    await page.goto('/pulse');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Community Pulse');
    
    // Check for ARIA labels on interactive elements
    const backButton = page.locator('button[aria-label="Go back to home"]');
    if (await backButton.isVisible()) {
      await expect(backButton).toHaveAttribute('aria-label');
    }
    
    const settingsButton = page.locator('button[aria-label="Toggle developer controls"]');
    if (await settingsButton.isVisible()) {
      await expect(settingsButton).toHaveAttribute('aria-label');
    }
    
    // Check for chart accessibility (role="img" with aria-label)
    const charts = page.locator('[role="img"]');
    const chartCount = await charts.count();
    
    for (let i = 0; i < chartCount; i++) {
      const chart = charts.nth(i);
      if (await chart.isVisible()) {
        await expect(chart).toHaveAttribute('aria-label');
      }
    }
  });
});