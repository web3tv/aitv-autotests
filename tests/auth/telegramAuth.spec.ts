import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { AuthApi } from '../../src/api/AuthApi';

test('Login via Telegram (mocked OAuth)', { annotation: { type: 'TC', description: 'AUTH-015' } }, async ({ page, request }) => {
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);

  const user = await authApi.createUserFast();

  await test.step('Login via Telegram with mocked OAuth flow', async () => {
    await authFlow.telegramLoginSuccess(user);
  });

  await test.step('Verify user is logged in', async () => {
    await authFlow.assertLoggedInAs(user.username);
  });
});
