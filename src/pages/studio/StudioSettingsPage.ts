import { Page, Locator, expect } from '@playwright/test';

export class StudioSettingsPage {
    readonly page: Page;

    // Settings page — Ownership tab
    readonly ownershipTab: Locator;

    // NFT ACCOUNT section (before minting)
    readonly nftAccountLabel: Locator;
    readonly nftTitle: Locator;
    readonly nftPrice: Locator;
    readonly nftDescription: Locator;
    readonly convertToNftBtn: Locator;
    readonly readMoreBtn: Locator;

    // Convert to NFT modal
    readonly convertModal: Locator;
    readonly convertModalTitle: Locator;
    readonly subtotalValue: Locator;
    readonly transferFeeValue: Locator;
    readonly totalValue: Locator;
    readonly modalCancelBtn: Locator;
    readonly modalPayWithBtn: Locator;

    // Add wallet popup (shown for email-only users)
    readonly addWalletPopup: Locator;
    readonly addWalletPopupText: Locator;
    readonly addWalletCancelBtn: Locator;
    readonly addWalletContinueBtn: Locator;

    // Minting status
    readonly mintingStatus: Locator;

    // NFT details (after minting)
    readonly nftStandard: Locator;
    readonly tokenContract: Locator;
    readonly explorerLink: Locator;

    constructor(page: Page) {
        this.page = page;

        // Ownership tab
        this.ownershipTab = page.locator('[data-id="ownership-tab"]');

        // NFT ACCOUNT section
        this.nftAccountLabel = page.getByText('NFT ACCOUNT');
        this.nftTitle = page.getByText('Turn your Web3TV channel into an NFT');
        this.nftPrice = page.getByText('$100.00');
        this.nftDescription = page.getByText('Convert your entire creator account into a tradable NFT');
        this.convertToNftBtn = page.getByRole('button', { name: 'Convert to NFT' });
        this.readMoreBtn = page.getByRole('button', { name: 'Read more' });

        // Convert to NFT modal
        this.convertModal = page.getByRole('dialog');
        this.convertModalTitle = this.convertModal.getByText('Convert to NFT');
        this.subtotalValue = this.convertModal.getByText('$ 100.00');
        this.transferFeeValue = this.convertModal.getByText('$ 1.50');
        this.totalValue = this.convertModal.getByText('$ 101.50');
        this.modalCancelBtn = this.convertModal.locator('.close-btn');
        this.modalPayWithBtn = this.convertModal.getByRole('button', { name: /Pay With/ });

        // Add wallet popup (shown for email-only users trying to convert)
        this.addWalletPopup = page.getByRole('dialog');
        this.addWalletPopupText = page.getByText('please add a crypto wallet in your Account Settings');
        this.addWalletCancelBtn = this.addWalletPopup.getByRole('button', { name: 'Cancel' });
        this.addWalletContinueBtn = this.addWalletPopup.getByRole('button', { name: 'Continue' });

        // Minting status
        this.mintingStatus = page.getByText('Minting Your NFT');

        // NFT details (after minting)
        this.nftStandard = page.getByText('ERC 721');
        this.tokenContract = page.getByText(/^0x[a-fA-F0-9]{40}$/);
        this.explorerLink = page.getByRole('link', { name: /sepolia\.etherscan\.io/ });
    }

    async assertNftSectionVisible() {
        await expect(this.nftAccountLabel, 'NFT ACCOUNT label is not visible').toBeVisible();
        await expect(this.nftTitle, 'NFT title is not visible').toBeVisible();
        await expect(this.nftPrice, 'NFT price is not visible').toBeVisible();
        await expect(this.convertToNftBtn, 'Convert to NFT button is not visible').toBeVisible();
    }

    async clickConvertToNft() {
        await expect(this.convertToNftBtn, 'Convert to NFT button is not visible').toBeVisible();
        await expect(this.convertToNftBtn, 'Convert to NFT button is not enabled').toBeEnabled();
        await this.convertToNftBtn.click();
    }

    async assertConvertModalVisible() {
        await expect(this.convertModal, 'Convert modal is not visible').toBeVisible();
        await expect(this.convertModalTitle, 'Convert modal title is not visible').toBeVisible();
        await expect(this.subtotalValue, 'Subtotal value is not visible').toBeVisible();
        await expect(this.transferFeeValue, 'Transfer fee value is not visible').toBeVisible();
        await expect(this.totalValue, 'Total value is not visible').toBeVisible();
        // await expect(this.modalCancelBtn, 'Cancel button is not visible').toBeVisible();
        await expect(this.modalPayWithBtn, 'Pay With button is not visible').toBeVisible();
    }

    async clickPayWith() {
        await expect(this.modalPayWithBtn, 'Pay With button is not visible').toBeVisible();
        await expect(this.modalPayWithBtn, 'Pay With button is not enabled').toBeEnabled();
        await this.modalPayWithBtn.click();
    }

    async assertAddWalletPopupVisible() {
        await expect(this.addWalletPopup, 'Add wallet popup is not visible').toBeVisible();
        await expect(this.addWalletPopupText, 'Add wallet popup text is not visible').toBeVisible();
        await expect(this.addWalletCancelBtn, 'Cancel button is not visible').toBeVisible();
        await expect(this.addWalletContinueBtn, 'Continue button is not visible').toBeVisible();
    }

    async assertMintingStatus() {
        await expect(this.mintingStatus, 'Minting Your NFT status is not visible').toBeVisible({ timeout: 30_000 });
    }

    async waitForNftMinted(timeoutMs = 180_000) {
        const pollInterval = 15_000;
        const deadline = Date.now() + timeoutMs;

        while (Date.now() < deadline) {
            const hasNftStandard = await this.nftStandard.isVisible().catch(() => false);
            if (hasNftStandard) return;

            await this.page.reload({ waitUntil: 'domcontentloaded' });
            await this.page.waitForTimeout(pollInterval);
        }

        await expect(this.nftStandard, 'NFT Standard (ERC 721) is not visible after waiting').toBeVisible();
    }

    async assertNftDetailsVisible() {
        await expect(this.nftStandard, 'NFT Standard is not visible').toBeVisible();
        await expect(this.tokenContract, 'Token Contract is not visible').toBeVisible();
        await expect(this.explorerLink, 'Explorer link is not visible').toBeVisible();
    }
}
