const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://wisrovi.github.io/wticket';

test.describe('WTicket Application', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await expect(page.locator('.navbar-brand')).toContainText('WTicket');
    await expect(page.locator('.page-title')).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`);
    
    await expect(page.locator('.auth-title')).toContainText('WTicket');
    await expect(page.locator('#login-form')).toBeVisible();
  });

  test('dark mode toggle works', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const themeToggle = page.locator('#theme-toggle');
    await expect(themeToggle).toBeVisible();
    
    await themeToggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    
    await themeToggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('contact page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/contact.html`);
    
    await expect(page.locator('.page-title')).toContainText('Contacto');
    await expect(page.locator('a[href*="linkedin"]')).toBeVisible();
    await expect(page.locator('a[href*="github"]')).toBeVisible();
  });

  test('global stats banner is visible', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await expect(page.locator('.global-stats-banner')).toBeVisible();
    await expect(page.locator('#banner-open')).toBeVisible();
    await expect(page.locator('#banner-closed')).toBeVisible();
  });
});
