import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class StudioProfilePage {
    readonly page: Page;

    readonly handleInput: Locator;



    readonly saveBtn: Locator;
    readonly privateCheckbox: Locator;

    constructor(page: Page) {
        this.page = page;

        this.handleInput = page.locator('[name="handle"]');


        this.saveBtn = page.getByRole('button', { name: 'Save' });
        this.privateCheckbox = page.getByRole('checkbox', { name: 'Private' });

    }

    async clearHandleInput(){
        await expect(this.handleInput, 'Handle input is not editable').toBeEditable();
        await this.handleInput.clear();
    }

    async fillHandleName(name: any){
        const finalUsername = name ?? `autotest_${Date.now()}`;

        await expect(this.handleInput, 'Handle input is not editable').toBeEditable();
        await this.handleInput.fill(finalUsername);
        await expect(this.handleInput, 'Handle input has wrong value').toHaveValue(finalUsername)
    }

    async fillHandleWithoutAssertToHaveValue(name: string){
        const finalUsername = name ?? `autotest_${Date.now()}`;

        await expect(this.handleInput, 'Handle input is not editable').toBeEditable();
        await this.handleInput.fill(finalUsername);
        await expect(this.handleInput, 'Handle input should not have this value').not.toHaveValue(finalUsername)
    }

    async asertLowerCase(expected: string){
        await expect(this.handleInput, 'Handle input has wrong value').toHaveValue(expected)
    }

    async blur() {
        await this.page.click('body');
    }

    async assertError(text: string) {
        await expect(this.page.getByText(text), `Expected text "${text}" is not visible`).toBeVisible();
    }

    async assertSaveBtnDisabled() {
        await expect(this.saveBtn, 'Save button should be disabled').toBeDisabled();
    }

    async assertSaveBtnEnabled() {
        await expect(this.saveBtn, 'Save button is not enabled').toBeEnabled();
    }



    async changePrivacyToPublic(){
        await expect(this.privateCheckbox, 'Private checkbox is not visible').toBeVisible();
        await this.privateCheckbox.uncheck();
        await expect(this.saveBtn, 'Save button is not enabled').toBeEnabled();
        await this.saveBtn.click();
      }
    

}