import { test, expect } from '@playwright/test';
import { HeaderPage } from '../src/pages/components/HeaderPage';
import { MainPage } from '../src/pages/components/MainPage';

test.describe('HERO', () => {
  test('check hero icons', async ({ page }) => { 
    const headerPage = new HeaderPage(page);
    const mainPage = new MainPage(page);

    await mainPage.visitMainPage();
    await headerPage.checkVisibilityHeroCoins();
  });
});