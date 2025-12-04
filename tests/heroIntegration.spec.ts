import { test, expect } from '@playwright/test';
import { HeaderPage } from '../src/pages/HeaderPage';
import { MainPage } from '../src/pages/MainPage';


test('check hero icons', async ({ page }) => { 
  const headerPage = new HeaderPage(page);
  const mainPage = new MainPage(page)

  await mainPage.visitMainPage();
  await headerPage.checkVisibilityHeroCoins();
});