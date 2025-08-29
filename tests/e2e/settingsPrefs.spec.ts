import { test, expect } from '@playwright/test';

test.describe('Settings and Preferences', () => {
  test.describe('Privacy Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/settings/privacy');
    });

    test('should display privacy settings page', async ({ page }) => {
      await expect(page.getByText('Privacy Settings')).toBeVisible();
      await expect(page.getByText('Profile Visibility')).toBeVisible();
      
      // Check toggle switches
      await expect(page.getByLabel('Public Profile')).toBeVisible();
      await expect(page.getByLabel('Show Location')).toBeVisible();
      await expect(page.getByLabel('Show Age')).toBeVisible();
    });

    test('should load current privacy settings', async ({ page }) => {
      // Mock settings response
      await page.route('**/privacy_settings*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user_id: 'test-user',
            is_public_profile: false,
            show_location: true,
            show_age: false,
            updated_at: new Date().toISOString()
          })
        });
      });

      await page.reload();
      
      // Verify toggle states
      const publicProfileToggle = page.getByLabel('Public Profile');
      const showLocationToggle = page.getByLabel('Show Location');
      const showAgeToggle = page.getByLabel('Show Age');
      
      await expect(publicProfileToggle).not.toBeChecked();
      await expect(showLocationToggle).toBeChecked();
      await expect(showAgeToggle).not.toBeChecked();
    });

    test('should save privacy settings changes', async ({ page }) => {
      // Mock settings load
      await page.route('**/privacy_settings*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user_id: 'test-user',
              is_public_profile: false,
              show_location: true,
              show_age: false,
              updated_at: new Date().toISOString()
            })
          });
        } else {
          // Mock update
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user_id: 'test-user',
              is_public_profile: true,
              show_location: true,
              show_age: true,
              updated_at: new Date().toISOString()
            })
          });
        }
      });

      await page.reload();
      
      // Toggle settings
      await page.getByLabel('Public Profile').click();
      await page.getByLabel('Show Age').click();
      
      // Save changes
      await page.getByRole('button', { name: 'Save Changes' }).click();
      
      // Check for success message
      await expect(page.getByText('Settings Saved')).toBeVisible();
    });

    test('should display important notes', async ({ page }) => {
      await expect(page.getByText('Important Notes')).toBeVisible();
      await expect(page.getByText('Your posts and comments always display your display handle')).toBeVisible();
      await expect(page.getByText('Location information is always coarse')).toBeVisible();
    });
  });

  test.describe('Notification Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/settings/notifications');
    });

    test('should display notification settings page', async ({ page }) => {
      await expect(page.getByText('Notification Settings')).toBeVisible();
      await expect(page.getByText('General Notifications')).toBeVisible();
      await expect(page.getByText('Notification Channels')).toBeVisible();
      await expect(page.getByText('Custom Subscriptions')).toBeVisible();
    });

    test('should load notification settings', async ({ page }) => {
      // Mock notification settings
      await page.route('**/notification_settings*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user_id: 'test-user',
            alerts_enabled: true,
            weekly_digest: true,
            channel_inapp: true,
            channel_email: false,
            threshold_shift: 0.2,
            updated_at: new Date().toISOString()
          })
        });
      });

      // Mock subscriptions
      await page.route('**/notification_subscriptions*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              user_id: 'test-user',
              s_type: 'topic',
              s_key: 'Economy',
              enabled: true,
              created_at: new Date().toISOString()
            }
          ])
        });
      });

      await page.reload();
      
      // Verify settings loaded
      await expect(page.getByLabel('Alerts Enabled')).toBeChecked();
      await expect(page.getByLabel('Weekly Digest')).toBeChecked();
      await expect(page.getByLabel('In-App Notifications')).toBeChecked();
      await expect(page.getByLabel('Email Notifications')).not.toBeChecked();
    });

    test('should adjust threshold slider', async ({ page }) => {
      // Mock settings load
      await page.route('**/notification_settings*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user_id: 'test-user',
            alerts_enabled: true,
            weekly_digest: true,
            channel_inapp: true,
            channel_email: false,
            threshold_shift: 0.2,
            updated_at: new Date().toISOString()
          })
        });
      });

      await page.route('**/notification_subscriptions*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await page.reload();
      
      // Check initial threshold display
      await expect(page.getByText('20%')).toBeVisible();
      
      // Slider interaction would require more complex setup
      // This is a placeholder for slider testing
    });

    test('should add custom subscription', async ({ page }) => {
      // Mock initial load
      await page.route('**/notification_settings*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user_id: 'test-user',
            alerts_enabled: true,
            weekly_digest: true,
            channel_inapp: true,
            channel_email: false,
            threshold_shift: 0.2,
            updated_at: new Date().toISOString()
          })
        });
      });

      await page.route('**/notification_subscriptions*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
          });
        } else {
          // Mock subscription creation
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user_id: 'test-user',
              s_type: 'topic',
              s_key: 'Healthcare',
              enabled: true,
              created_at: new Date().toISOString()
            })
          });
        }
      });

      await page.reload();
      
      // Add subscription
      const typeSelect = page.getByRole('combobox').first();
      await typeSelect.click();
      await page.getByRole('option', { name: 'Topic' }).click();
      
      await page.getByPlaceholder('Enter topic...').fill('Healthcare');
      await page.getByRole('button', { name: 'Add' }).click();
      
      // Check for success message
      await expect(page.getByText('Subscription Added')).toBeVisible();
    });

    test('should display existing subscriptions', async ({ page }) => {
      // Mock settings and subscriptions
      await page.route('**/notification_settings*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user_id: 'test-user',
            alerts_enabled: true,
            weekly_digest: true,
            channel_inapp: true,
            channel_email: false,
            threshold_shift: 0.2,
            updated_at: new Date().toISOString()
          })
        });
      });

      await page.route('**/notification_subscriptions*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              user_id: 'test-user',
              s_type: 'topic',
              s_key: 'Economy',
              enabled: true,
              created_at: new Date().toISOString()
            },
            {
              user_id: 'test-user',
              s_type: 'region',
              s_key: 'California',
              enabled: false,
              created_at: new Date().toISOString()
            }
          ])
        });
      });

      await page.reload();
      
      // Verify subscriptions are displayed
      await expect(page.getByText('Economy')).toBeVisible();
      await expect(page.getByText('California')).toBeVisible();
      await expect(page.getByText('topic')).toBeVisible();
      await expect(page.getByText('region')).toBeVisible();
    });

    test('should save notification settings', async ({ page }) => {
      // Mock settings load and update
      await page.route('**/notification_settings*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user_id: 'test-user',
              alerts_enabled: true,
              weekly_digest: true,
              channel_inapp: true,
              channel_email: false,
              threshold_shift: 0.2,
              updated_at: new Date().toISOString()
            })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user_id: 'test-user',
              alerts_enabled: false,
              weekly_digest: true,
              channel_inapp: true,
              channel_email: true,
              threshold_shift: 0.2,
              updated_at: new Date().toISOString()
            })
          });
        }
      });

      await page.route('**/notification_subscriptions*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await page.reload();
      
      // Toggle settings
      await page.getByLabel('Alerts Enabled').click();
      await page.getByLabel('Email Notifications').click();
      
      // Save changes
      await page.getByRole('button', { name: 'Save Changes' }).click();
      
      // Check for success message
      await expect(page.getByText('Settings Saved')).toBeVisible();
    });
  });
});