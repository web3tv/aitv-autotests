import { test } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import type { EvmWalletType } from '../../../src/utils/walletMock';

const wallets: { type: EvmWalletType; label: string; tc: string; envPrefix: string }[] = [
  { type: 'metamask', label: 'MetaMask', tc: 'PROD-004', envPrefix: 'PROD_WALLET_METAMASK' },
  { type: 'hero-wallet', label: 'Hero Wallet', tc: 'PROD-005', envPrefix: 'PROD_WALLET_HERO' },
  { type: 'binance-wallet', label: 'Binance Wallet', tc: 'PROD-006', envPrefix: 'PROD_WALLET_BINANCE' },
];

test('Register user via Hero Wallet', { annotation: { type: 'TC', description: 'PROD-007' } }, async ({ page }) => {
  const authFlow = new AuthFlow(page);
  let siweMessage = '';

  page.on('console', msg => {
    const text = msg.text();
    if (text.startsWith('[SIWE:')) {
      siweMessage = text.replace(/^\[SIWE:[^\]]+\]\s*/, '');
    }
  });

  await test.step('Register with a new Hero Wallet', async () => {
    await authFlow.walletRegisterSuccess({ walletType: 'hero-wallet' });
  });

  await test.step('Print SIWE request', async () => {
    console.log('\n=== SIWE Message (Hero Wallet) ===');
    console.log(siweMessage);
    console.log('==================================\n');
  });
});

for (const w of wallets) {
  test.skip(`Login via ${w.label}`, { annotation: { type: 'TC', description: w.tc } }, async ({ page }) => {
    const authFlow = new AuthFlow(page);
    const address = process.env[`${w.envPrefix}_ADDRESS`];
    const privateKey = process.env[`${w.envPrefix}_PRIVATE_KEY`];
    const username = process.env[`${w.envPrefix}_USERNAME`];
    if (!address || !privateKey || !username) throw new Error(`${w.envPrefix}_* env vars not set. Run setup.spec.ts first.`);

    await test.step(`Login with ${w.label} wallet`, async () => {
      await authFlow.walletLoginSuccess({
        wallet: { address, privateKey },
        walletType: w.type,
        skipModalCheck: true,
      });
    });

    await test.step('Verify logged in as expected user', async () => {
      await authFlow.assertLoggedInAs(username);
    });
  });
}
