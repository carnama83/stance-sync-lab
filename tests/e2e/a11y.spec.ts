import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  // Mock auth state to bypass authentication
  await page.addInitScript(() => {
    window.localStorage.setItem('supabase.auth.token', JSON.stringify({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      user: { id: 'test-user' }
    }));
  });
});

test.describe('Accessibility Tests', () => {
  test('Home page should be accessible', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Feed page should be accessible', async ({ page }) => {
    // Mock questions data
    await page.route('**/rest/v1/questions*', async route => {
      await route.fulfill({
        json: [
          {
            id: 'test-question-1',
            title: 'Test Question 1',
            summary: 'Test summary 1',
            topic: 'Politics',
            created_at: new Date().toISOString()
          }
        ]
      });
    });

    await page.goto('/feed');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Question detail page should be accessible', async ({ page }) => {
    // Mock question data
    await page.route('**/rest/v1/questions*', async route => {
      await route.fulfill({
        json: {
          id: 'test-question-1',
          title: 'Test Question',
          summary: 'Test summary',
          topic: 'Politics',
          created_at: new Date().toISOString()
        }
      });
    });

    // Mock profile data
    await page.route('**/rest/v1/profiles*', async route => {
      await route.fulfill({
        json: {
          id: 'test-user-id',
          city: 'Test City',
          state: 'Test State',
          country_iso: 'US'
        }
      });
    });

    // Mock stances and comments
    await page.route('**/rest/v1/stances*', async route => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/rest/v1/comments*', async route => {
      await route.fulfill({ json: [] });
    });

    await page.goto('/question/test-question-1');
    
    // Wait for the page to load
    await page.waitForSelector('text=Test Question', { timeout: 10000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Settings page should be accessible', async ({ page }) => {
    // Mock deletion request and consent logs
    await page.route('**/rest/v1/deletion_requests*', async route => {
      await route.fulfill({ json: null });
    });

    await page.route('**/rest/v1/consent_logs*', async route => {
      await route.fulfill({ json: [] });
    });

    await page.goto('/settings/account');
    
    // Wait for the page to load
    await page.waitForSelector('text=Account Settings', { timeout: 10000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard navigation should work', async ({ page }) => {
    await page.goto('/');
    
    // Test skip to content link
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    const skipLink = page.locator('a[href="#main-content"]');
    
    if (await skipLink.count() > 0) {
      expect(await focusedElement.getAttribute('href')).toBe('#main-content');
    }
    
    // Test that all interactive elements are reachable by keyboard
    let tabCount = 0;
    const maxTabs = 20; // Prevent infinite loop
    
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      const focused = await page.locator(':focus');
      
      if (await focused.count() === 0) break;
      
      // Check that focused element is visible and interactive
      const tagName = await focused.evaluate(el => el.tagName.toLowerCase());
      const isInteractive = ['button', 'a', 'input', 'textarea', 'select'].includes(tagName) ||
                           await focused.evaluate(el => el.hasAttribute('tabindex'));
      
      if (isInteractive) {
        expect(await focused.isVisible()).toBe(true);
      }
      
      tabCount++;
    }
  });

  test('Focus indicators should be visible', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements and check focus visibility
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    if (await focusedElement.count() > 0) {
      // Check that focus indicator is visible (this would need custom CSS checks)
      const outlineStyle = await focusedElement.evaluate(el => 
        getComputedStyle(el).outline
      );
      
      // Should have some kind of focus indicator
      expect(outlineStyle).not.toBe('none');
    }
  });

  test('Color contrast should meet WCAG standards', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Images should have alt text', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['image-alt'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Form elements should have labels', async ({ page }) => {
    await page.goto('/auth/signup');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['label'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});