import { test, expect } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { SideBarPage } from '../../src/pages/components/SideBarPage';
import { StudioSettingsPage } from '../../src/pages/studio/StudioSettingsPage';
import { HeroPayPage } from '../../src/pages/heroPay/HeroPayPage';

test.fixme('Convert channel to NFT via mock payment',
    { annotation: { type: 'TC', description: 'NFT-001' } },
    async ({ page, request }) => {
        test.setTimeout(300_000);

        const studioUrl = process.env.STUDIO_URL || 'https://studio.web3tv.dev';
        const authFlow = new AuthFlow(page);
        const sideBar = new SideBarPage(page);
        const settingsPage = new StudioSettingsPage(page);
        const heroPayPage = new HeroPayPage(page);

        await test.step('Create wallet user and login', async () => {
            await authFlow.walletRegisterSuccess();
        });

        await test.step('Navigate to Studio Settings and verify NFT section', async () => {
            await sideBar.clickStudioSettings();
            await settingsPage.assertNftSectionVisible();
        });

        await test.step('Open Convert to NFT modal and verify content', async () => {
            await settingsPage.clickConvertToNft();
            await settingsPage.assertConvertModalVisible();
        });

        await test.step('Click Pay With and complete mock payment via HeroPay', async () => {
            await settingsPage.clickPayWith();
            await page.waitForURL(/pay\.hero\.io/, { timeout: 30_000 });
            await heroPayPage.testnetPaymentWithEmail(`nft_test_${Date.now()}@test.com`);
        });

        await test.step('Verify Minting Your NFT status', async () => {
            await page.goto(`${studioUrl}/settings`, { waitUntil: 'domcontentloaded' });
            await settingsPage.assertMintingStatus();
        });

        await test.step('Wait for NFT minted and verify NFT details', async () => {
            await settingsPage.waitForNftMinted();
            await settingsPage.assertNftDetailsVisible();
        });

        await test.step('Verify NFT metadata JSON contains all required fields', async () => {
            const tokenId = await settingsPage.getTokenIdFromExplorerLink();
            const metadataUrl = `http://nft.web3tv.dev/m/${tokenId}`;

            const response = await request.get(metadataUrl);
            expect(response.ok(), `NFT metadata request failed: ${response.status()}`).toBeTruthy();

            const metadata = await response.json();

            expect(metadata.name, 'NFT metadata: name is missing').toBeTruthy();
            expect(metadata.description, 'NFT metadata: description is missing').toBeTruthy();
            expect(metadata.image, 'NFT metadata: image is missing').toBeTruthy();
            expect(metadata.external_url, 'NFT metadata: external_url is missing').toBeTruthy();
            expect(metadata.collection_name, 'NFT metadata: collection_name is missing').toBeTruthy();
            expect(metadata.collection_description, 'NFT metadata: collection_description is missing').toBeTruthy();
            expect(metadata.attributes, 'NFT metadata: attributes is missing').toBeTruthy();
            expect(Array.isArray(metadata.attributes), 'NFT metadata: attributes is not an array').toBeTruthy();
            expect(metadata.attributes.length, 'NFT metadata: attributes is empty').toBeGreaterThan(0);
            expect(metadata.attributes[0].trait_type, 'NFT metadata: trait_type is missing').toBe('Platform');
            expect(metadata.attributes[0].value, 'NFT metadata: trait value is missing').toBe('Web3.tv');
        });
    }
);

test.fixme('Email user without wallet sees add wallet popup on Convert to NFT',
    { annotation: { type: 'TC', description: 'NFT-002' } },
    async ({ page, request }) => {
        test.setTimeout(60_000);

        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const sideBar = new SideBarPage(page);
        const settingsPage = new StudioSettingsPage(page);
        const password = process.env.USER_PASSWORD!;

        await test.step('Create email user and login', async () => {
            const user = await authApi.createUserFast();
            await authFlow.loginSuccess(user.email, password, user.username);
        });

        await test.step('Navigate to Studio Settings and verify NFT section', async () => {
            await sideBar.clickStudioSettings();
            await settingsPage.assertNftSectionVisible();
        });

        await test.step('Click Convert to NFT, click Pay With and verify add wallet popup', async () => {
            await settingsPage.clickConvertToNft();
            await settingsPage.assertConvertModalVisible();
            await settingsPage.clickPayWith();

            // Should NOT redirect to HeroPay — should stay on settings
            await expect(page, 'Should stay on settings page, not redirect to HeroPay').toHaveURL(/studio.*\/settings/);

            // Should show add wallet popup
            await settingsPage.assertAddWalletPopupVisible();
        });
    }
);
