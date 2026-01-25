import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/chat';

test.describe('Internal Linking Card', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto();
    await chatPage.login(); // Assuming login is required to access dashboard
    await page.goto('/dashboard');

    // Ensure the Internal Linking Card is visible
    await expect(page.getByText('Internal Linking')).toBeVisible();
  });

  test('should display default state initially', async ({ page }) => {
    await expect(page.getByText('No internal linking data available')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Analyze Linking' })).toBeVisible();
  });

  test('should trigger analysis and update UI', async ({ page }) => {
    await page.getByRole('button', { name: 'Analyze Linking' }).click();
    await expect(page.getByRole('button', { name: 'Analyzing...' })).toBeVisible();

    // Wait for the analysis to complete and UI to update
    await expect(page.getByText('Internal linking analysis complete!')).toBeVisible();
    await expect(page.getByText('Opportunities')).toBeVisible();
    await expect(page.getByText('Linking Density')).toBeVisible();
    await expect(page.getByText('Authority Impact')).toBeVisible();
    await expect(page.getByText('Conversion Impact')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Re-analyze' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Apply Recommendations' })).toBeVisible();
  });

  test('should open and save configuration', async ({ page }) => {
    await page.getByRole('button', { name: 'Internal Linking' }).getByLabel('Settings').click();
    await expect(page.getByText('Internal Linking Configuration')).toBeVisible();

    // Change a setting, e.g., Conversion Focus
    const slider = page.getByLabel('Conversion Focus').locator('input');
    await slider.fill('80');
    await expect(page.getByText('Conversion Focus: 80%')).toBeVisible();

    await page.getByRole('button', { name: 'Save Configuration' }).click();
    await expect(page.getByText('Internal linking strategy generated!')).toBeVisible();
    
    // Verify modal is closed
    await expect(page.getByText('Internal Linking Configuration')).not.toBeVisible();
  });

  test('should apply recommendations', async ({ page }) => {
    // First, complete an analysis to enable apply button
    await page.getByRole('button', { name: 'Analyze Linking' }).click();
    await expect(page.getByText('Internal linking analysis complete!')).toBeVisible();

    await page.getByRole('button', { name: 'Apply Recommendations' }).click();
    await expect(page.getByText('Internal links applied successfully!')).toBeVisible();
  });
});