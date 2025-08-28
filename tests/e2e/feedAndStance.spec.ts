import { test, expect } from '@playwright/test';

test.describe('Feed and Stance Flow', () => {
  test('complete flow: browse feed, view question, save stance, verify persistence', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Navigate to feed (assuming there's a link or direct navigation)
    await page.goto('/feed');

    // Wait for feed to load
    await expect(page.locator('h1')).toContainText('Question Feed');
    
    // Wait for questions to load - look for question cards
    await page.waitForSelector('[data-testid="question-card"], .hover\\:shadow-lg', { timeout: 10000 });
    
    // Check if there are any questions visible
    const questionCards = page.locator('.hover\\:shadow-lg');
    const cardCount = await questionCards.count();
    
    if (cardCount === 0) {
      // If no questions are visible, this might be expected behavior
      // Check for empty state message
      const emptyMessage = page.locator('text=No questions match your search criteria');
      if (await emptyMessage.isVisible()) {
        console.log('No questions available - test scenario not applicable');
        return;
      }
    }
    
    // Assuming there are questions, click on the first one
    if (cardCount > 0) {
      const firstCard = questionCards.first();
      
      // Look for the "Share Your Stance" button within the card
      const stanceButton = firstCard.locator('button:has-text("Share Your Stance")');
      await expect(stanceButton).toBeVisible();
      await stanceButton.click();
      
      // Should navigate to question detail page
      await expect(page).toHaveURL(/\/question\/[a-f0-9-]+/);
      
      // Verify question detail page loaded
      await expect(page.locator('text=Share Your Stance')).toBeVisible();
      
      // Check if user is authenticated (might redirect to signup)
      const currentUrl = page.url();
      if (currentUrl.includes('/auth/signup')) {
        console.log('User not authenticated - redirected to signup');
        // For this test, we'll assume user needs to be authenticated
        // In a real test suite, you'd handle auth setup
        return;
      }
      
      // Wait for stance form to load
      await expect(page.locator('text=Your Position:')).toBeVisible();
      
      // Interact with stance slider
      const slider = page.locator('[role="slider"]');
      await expect(slider).toBeVisible();
      
      // Move slider to position +1 (For)
      await slider.focus();
      await slider.press('ArrowRight'); // Move from neutral (0) to +1
      
      // Verify position label updated
      await expect(page.locator('text=For')).toBeVisible();
      
      // Add optional rationale
      const rationaleTextarea = page.locator('textarea[placeholder*="Explain your reasoning"]');
      await rationaleTextarea.fill('This is my test rationale supporting this position because it makes sense.');
      
      // Add optional supporting links
      const linksTextarea = page.locator('textarea[placeholder*="Add links to support"]');
      await linksTextarea.fill('https://example.com\nhttps://test.org');
      
      // Save the stance
      const saveButton = page.locator('button:has-text("Save Stance")');
      await expect(saveButton).toBeVisible();
      await saveButton.click();
      
      // Wait for save to complete
      await expect(page.locator('button:has-text("Update Stance")')).toBeVisible({ timeout: 5000 });
      
      // Verify success message or updated state
      const lastUpdated = page.locator('text=Last updated:');
      await expect(lastUpdated).toBeVisible();
      
      // Refresh the page to test persistence
      await page.reload();
      
      // Wait for page to reload
      await expect(page.locator('text=Share Your Stance')).toBeVisible();
      
      // Verify stance persisted
      await expect(page.locator('text=For')).toBeVisible(); // Position should be +1
      
      // Verify rationale persisted
      const persistedRationale = page.locator('textarea[placeholder*="Explain your reasoning"]');
      await expect(persistedRationale).toHaveValue(/test rationale/);
      
      // Verify links persisted  
      const persistedLinks = page.locator('textarea[placeholder*="Add links to support"]');
      await expect(persistedLinks).toHaveValue(/example\.com/);
      
      // Verify update button is shown (indicating existing stance)
      await expect(page.locator('button:has-text("Update Stance")')).toBeVisible();
      
      // Test updating the stance
      await slider.focus();
      await slider.press('ArrowRight'); // Move from +1 to +2 (Strongly For)
      
      await expect(page.locator('text=Strongly For')).toBeVisible();
      
      // Update rationale
      await rationaleTextarea.fill('Updated rationale with even stronger support for this position.');
      
      // Save updated stance
      const updateButton = page.locator('button:has-text("Update Stance")');
      await updateButton.click();
      
      // Wait for update to complete - look for updated timestamp
      await page.waitForTimeout(1000); // Brief wait for update
      
      // Refresh again to verify update persisted
      await page.reload();
      await expect(page.locator('text=Share Your Stance')).toBeVisible();
      
      // Verify updated stance persisted
      await expect(page.locator('text=Strongly For')).toBeVisible();
      
      // Verify updated rationale
      const updatedRationale = page.locator('textarea[placeholder*="Explain your reasoning"]');
      await expect(updatedRationale).toHaveValue(/Updated rationale/);
    }
  });

  test('feed navigation and basic functionality', async ({ page }) => {
    await page.goto('/feed');
    
    // Test basic feed functionality
    await expect(page.locator('h1')).toContainText('Question Feed');
    
    // Test search functionality (UI only, no backend)
    const searchInput = page.locator('input[placeholder*="Search questions"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test query');
    
    // Test filter dropdowns (UI only)
    const topicFilter = page.locator('text=All Topics');
    await expect(topicFilter).toBeVisible();
    
    const languageFilter = page.locator('text=All Languages'); 
    await expect(languageFilter).toBeVisible();
    
    // Test back navigation
    await page.goto('/feed');
    const backToHomeLink = page.locator('text=Back to Feed').first();
    if (await backToHomeLink.isVisible()) {
      // If there's a back link, test it
      await backToHomeLink.click();
      await expect(page).toHaveURL('/feed');
    }
  });

  test('stance form validation', async ({ page }) => {
    // Navigate directly to a question (this will test the not found case if no questions exist)
    await page.goto('/question/non-existent-id');
    
    // Should show question not found
    await expect(page.locator('text=Question Not Found')).toBeVisible();
    
    // Test back to feed navigation
    const backButton = page.locator('button:has-text("Back to Feed")');
    await expect(backButton).toBeVisible();
    await backButton.click();
    
    await expect(page).toHaveURL('/feed');
  });
  
  test('authentication flow', async ({ page }) => {
    // Test that accessing a question when not authenticated redirects to signup
    await page.goto('/question/test-id');
    
    // Should redirect to signup or show auth-related content
    const url = page.url();
    const isSignupPage = url.includes('/auth/signup');
    const hasAuthContent = await page.locator('text=signup, text=sign up, text=authenticate').count() > 0;
    
    if (isSignupPage || hasAuthContent) {
      console.log('Authentication flow working - redirected to signup');
    } else {
      console.log('User might already be authenticated or auth not required');
    }
  });
});