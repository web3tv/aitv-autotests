import { test } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';

test('Success login as user', {annotation: { type: 'TC', description: 'PROD-001' } }, async ({ page }) => {
  const authFlow = new AuthFlow(page);
  const email = process.env.PROD_TEST_EMAIL;
  const password = process.env.PROD_TEST_PASSWORD;
  const username = process.env.PROD_TEST_USERNAME;
  if (!email || !password || !username) throw new Error('PROD_TEST_* env vars not set. Run setup.spec.ts first.');

  await test.step('Login and verify', async () => {
    await authFlow.loginSuccess(email, password, username);
  });
});
