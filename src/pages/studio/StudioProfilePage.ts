import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class StudioProfilePage {
    readonly page: Page;

    readonly handleInput: Locator;



    readonly saveBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.handleInput = page.locator('[name="handle"]');


        this.saveBtn = page.getByRole('button', { name: 'Save' });

    }

    async clearHandleInput(){
        await expect(this.handleInput).toBeEditable();
        await this.handleInput.clear();
    }

    async fillHandleName(name: any){
        const finalUsername = name ?? `autotest_${Date.now()}`;

        await expect(this.handleInput).toBeEditable();
        await this.handleInput.fill(finalUsername);
        await expect(this.handleInput).toHaveValue(finalUsername)
    }

    async fillHandleWithoutAssertToHaveValue(name: string){
        const finalUsername = name ?? `autotest_${Date.now()}`;

        await expect(this.handleInput).toBeEditable();
        await this.handleInput.fill(finalUsername);
        await expect(this.handleInput).not.toHaveValue(finalUsername)
    }

    async asertLowerCase(expected: string){
        await expect(this.handleInput).toHaveValue(expected)
    }

    async blur() {
        await this.page.click('body');
    }

    async assertError(text: string) {
        await expect(this.page.getByText(text)).toBeVisible();
    }

    async assertSaveBtnDisabled() {
        await expect(this.saveBtn).toBeDisabled();
    }

    async assertSaveBtnEnabled() {
        await expect(this.saveBtn).toBeEnabled();
    }



    async changePrivacyToPublic(){
        await this.page.getByRole('checkbox', { name: 'Private' }).uncheck();
        await this.page.getByRole('button', { name: 'Save' }).click();
      }
    

}