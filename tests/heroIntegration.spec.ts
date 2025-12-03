import { test, expect } from '@playwright/test';
import { user1 } from '../test-data/users';
import { LoginPage } from '../src/pages/LoginPage';
import { AuthFlow } from '../src/flows/AuthFlow';


test('Login as user', async ({ page }) => { 
  const loginPage = new LoginPage(page);
  const authFlow = new AuthFlow(loginPage)
  await authFlow.loginSuccess(user1.login, user1.password);
});