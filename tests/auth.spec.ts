import { test, expect } from '@playwright/test';
import { user1 } from '../test-data/users';
import { LoginPage } from '../src/pages/LoginPage';
import { AuthFlow } from '../src/flows/AuthFlow';


test('Login as user', async ({ page }) => { 
  const loginPage = new LoginPage(page)
  const authFlow = new AuthFlow(loginPage);

  await authFlow.loginSuccess(user1.login, user1.password);
});


test('Check incorrect password', async ({ page }) => { 
  const loginPage = new LoginPage(page)
  const authFlow = new AuthFlow(loginPage);
  await authFlow.passwordError(user1.login, "Admin1@");
});

test('Check incorrect username', async ({ page }) => { 
  const loginPage = new LoginPage(page)
  const authFlow = new AuthFlow(loginPage);

  await authFlow.usernameError("user1", "Admin1@@");
});

