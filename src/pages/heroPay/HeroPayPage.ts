import { Page, Locator, expect } from '@playwright/test';
import { sendUsdtOnNile } from '../../utils/tronNilePayment';

export class HeroPayPage {

    readonly page: Page;

    // Currency selection
    readonly tetherLink: Locator;

    // Contact Information form (for wallet users without email)
    readonly emailInput: Locator;
    readonly consentCheckbox: Locator;
    readonly submitBtn: Locator;

    // Payment flow
    readonly iUnderstandBtn: Locator;
    readonly mockPaymentLink: Locator;
    readonly confirmationLink: Locator;
    readonly returnToMerchantLink: Locator;

    constructor(page: Page) {
        this.page = page;

        this.tetherLink = page.getByRole('link', { name: /Tether.*USDT.*TRON/ });
        this.emailInput = page.locator('#email');
        this.consentCheckbox = page.locator('#consent');
        this.submitBtn = page.getByRole('button', { name: 'Submit' });
        this.iUnderstandBtn = page.getByRole('button', { name: 'I understand' });
        this.mockPaymentLink = page.getByRole('link', { name: 'Mock Payment' });
        this.confirmationLink = page.getByRole('link', { name: '+1 Confirmation' });
        this.returnToMerchantLink = page.getByRole('link', { name: 'Return to Merchant' });
    }

    async mockPaymentWithEmail(email: string){
        await expect(this.tetherLink, 'Tether USDT link is not visible').toBeVisible();
        await this.tetherLink.click();

        // Contact Information form — required for wallet users without email
        await expect(this.emailInput, 'Email input is not visible').toBeVisible();
        await this.emailInput.fill(email);
        await expect(this.consentCheckbox, 'Consent checkbox is not visible').toBeVisible();
        await this.consentCheckbox.check();
        await expect(this.submitBtn, 'Submit button is not visible').toBeVisible();
        await expect(this.submitBtn, 'Submit button is not enabled').toBeEnabled();
        await this.submitBtn.click();

        await expect(this.iUnderstandBtn, 'I understand button is not visible').toBeVisible();
        await this.iUnderstandBtn.click();

        await expect(this.mockPaymentLink, 'Mock Payment link is not visible').toBeVisible();
        await this.mockPaymentLink.evaluate(el => el.removeAttribute('target'));
        await this.mockPaymentLink.click();

        await expect(this.submitBtn, 'Submit button is not visible').toBeVisible();
        await expect(this.submitBtn, 'Submit button is not enabled').toBeEnabled();
        await this.submitBtn.click();

        await expect(this.confirmationLink, '+1 Confirmation link is not visible').toBeVisible();
        await this.confirmationLink.click();

        await this.page.evaluate(() => window.history.go(-3));

        await expect(this.iUnderstandBtn, 'I understand button is not visible').toBeVisible();
        await this.iUnderstandBtn.click();

        await expect(this.returnToMerchantLink, 'Return to Merchant link is not visible').toBeVisible();
        await this.returnToMerchantLink.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    async mockPayment(){
        await expect(this.tetherLink, 'Tether USDT link is not visible').toBeVisible();
        await this.tetherLink.click();

        await expect(this.iUnderstandBtn, 'I understand button is not visible').toBeVisible();
        await this.iUnderstandBtn.click();

        await expect(this.mockPaymentLink, 'Mock Payment link is not visible').toBeVisible();
        await this.mockPaymentLink.evaluate(el => el.removeAttribute('target'));
        await this.mockPaymentLink.click();

        await expect(this.submitBtn, 'Submit button is not visible').toBeVisible();
        await expect(this.submitBtn, 'Submit button is not enabled').toBeEnabled();
        await this.submitBtn.click();

        await expect(this.confirmationLink, '+1 Confirmation link is not visible').toBeVisible();
        await this.confirmationLink.click();

        await this.page.evaluate(() => window.history.go(-3));

        await expect(this.iUnderstandBtn, 'I understand button is not visible').toBeVisible();
        await this.iUnderstandBtn.click();

        await expect(this.returnToMerchantLink, 'Return to Merchant link is not visible').toBeVisible();
        await this.returnToMerchantLink.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    async initiateMockPaymentWithoutConfirmation() {
        await expect(this.tetherLink, 'Tether USDT link is not visible').toBeVisible();
        await this.tetherLink.click();

        await expect(this.iUnderstandBtn, 'I understand button is not visible').toBeVisible();
        await this.iUnderstandBtn.click();

        await expect(this.mockPaymentLink, 'Mock Payment link is not visible').toBeVisible();
        await this.mockPaymentLink.evaluate(el => el.removeAttribute('target'));
        await this.mockPaymentLink.click();

        await expect(this.submitBtn, 'Submit button is not visible').toBeVisible();
        await expect(this.submitBtn, 'Submit button is not enabled').toBeEnabled();
        await this.submitBtn.click();

        // Do NOT click "+1 Confirmation" — leave payment in Pending state
        await this.page.evaluate(() => window.history.go(-2));
        await this.page.waitForTimeout(1000);
    }

    async testnetPaymentWithEmail(email: string) {
        await expect(this.tetherLink, 'Tether USDT link is not visible').toBeVisible();
        await this.tetherLink.click();

        // Contact Information form — required for wallet users without email
        await expect(this.emailInput, 'Email input is not visible').toBeVisible();
        await this.emailInput.fill(email);
        await expect(this.consentCheckbox, 'Consent checkbox is not visible').toBeVisible();
        await this.consentCheckbox.check();
        await expect(this.submitBtn, 'Submit button is not visible').toBeVisible();
        await expect(this.submitBtn, 'Submit button is not enabled').toBeEnabled();
        await this.submitBtn.click();

        // Parse recipient address and amount from QR code title attribute
        // Format: "tron:{address}?amount={amount}"
        const qrImg = this.page.locator('img[title^="tron:"]');
        await qrImg.waitFor({ state: 'visible', timeout: 15_000 });
        const titleAttr = await qrImg.getAttribute('title');
        if (!titleAttr) throw new Error('Could not find QR code with tron: title on Hero Pay page');

        const match = titleAttr.match(/tron:([^?]+)\?amount=([0-9.]+)/);
        if (!match) throw new Error(`Could not parse tron address/amount from: ${titleAttr}`);

        const toAddress = match[1];
        const amount = parseFloat(match[2]);

        if (!/^T[A-Za-z0-9]{33}$/.test(toAddress)) {
            throw new Error(`Invalid Tron address parsed from QR: "${toAddress}" (full title: "${titleAttr}")`);
        }

        await sendUsdtOnNile(toAddress, amount);

        // Wait for Hero Pay to detect the payment and show "Return to Merchant"
        await expect(this.returnToMerchantLink, 'Return to Merchant link is not visible').toBeVisible({ timeout: 120_000 });
        await this.returnToMerchantLink.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    async testnetPayment() {
        await expect(this.tetherLink, 'Tether USDT link is not visible').toBeVisible();
        await this.tetherLink.click();

        // Parse recipient address and amount from QR code title attribute
        // Format: "tron:{address}?amount={amount}"
        const qrImg = this.page.locator('img[title^="tron:"]');
        await qrImg.waitFor({ state: 'visible', timeout: 15_000 });
        const titleAttr = await qrImg.getAttribute('title');
        if (!titleAttr) throw new Error('Could not find QR code with tron: title on Hero Pay page');

        const match = titleAttr.match(/tron:([^?]+)\?amount=([0-9.]+)/);
        if (!match) throw new Error(`Could not parse tron address/amount from: ${titleAttr}`);

        const toAddress = match[1];
        const amount = parseFloat(match[2]);

        if (!/^T[A-Za-z0-9]{33}$/.test(toAddress)) {
            throw new Error(`Invalid Tron address parsed from QR: "${toAddress}" (full title: "${titleAttr}")`);
        }

        await sendUsdtOnNile(toAddress, amount);

        // Wait for Hero Pay to detect the payment and show "Return to Merchant"
        await expect(this.returnToMerchantLink, 'Return to Merchant link is not visible').toBeVisible({ timeout: 120_000 });
        await this.returnToMerchantLink.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

}
