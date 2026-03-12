import { Page, Locator } from '@playwright/test';
import { sendUsdtOnNile } from '../../utils/tronNilePayment';

export class HeroPayPage {

    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async mockPayment(){
        await this.page.getByRole('link', { name: 'Tether USDT - TRON >' }).click();
        await this.page.getByRole('button', { name: 'I understand' }).click();
        const link = this.page.getByRole('link', { name: 'Mock Payment' });
        await link.evaluate(el => el.removeAttribute('target'));
        await link.click();
        await this.page.waitForTimeout(1000);
        await this.page.getByRole('button', { name: 'Submit' }).click();
        await this.page.waitForTimeout(1000);
        await this.page.getByRole('link', { name: '+1 Confirmation' }).click();
        await this.page.waitForTimeout(1000);
        await this.page.evaluate(() => window.history.go(-3));
        await this.page.waitForTimeout(1000);
        await Promise.all([
            this.page.waitForLoadState('networkidle'),
            this.page.getByRole('button', { name: 'I understand' }).click(),
            this.page.getByRole('link', { name: 'Return to Merchant' }).click()

        ]);
        await this.page.waitForTimeout(1000);
    }

    async testnetPayment() {
        await this.page.getByRole('link', { name: 'Tether USDT - TRON >' }).click();

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
        const returnLink = this.page.getByRole('link', { name: 'Return to Merchant' });
        await returnLink.waitFor({ state: 'visible', timeout: 120_000 });

        await Promise.all([
            this.page.waitForLoadState('networkidle'),
            returnLink.click(),
        ]);
        await this.page.waitForTimeout(1000);
    }

}