import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class CreateChannelPage {
    
    readonly page: Page;
    readonly handleInput: Locator;
    readonly nameInput: Locator;

    readonly startSetupBtn: Locator;
    readonly submitBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        // Main page
        this.startSetupBtn = page.getByRole('button', { name: 'Start Setup' })


        this.handleInput = page.getByRole('textbox', { name: 'yourhandle' })
        this.nameInput = page.getByRole('textbox', { name: 'Enter your channel name' })
        this.submitBtn = page.getByRole('button', { name: 'Continue' })
    }

    async clickStartSetup(){
        await expect(this.startSetupBtn, 'Start setup button is not enabled').toBeEnabled();
        await this.startSetupBtn.click();
    }

    async fillHandleName(name:any){
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

    async fillName(name:any){
        const finalUsername = name ?? `autotest_${Date.now()}`;

        await expect(this.nameInput, 'Name input is not editable').toBeEditable();
        await this.nameInput.fill(finalUsername);
        await expect(this.nameInput, 'Name input has wrong value').toHaveValue(finalUsername)
    }

    async clearHandleInput(){
        await expect(this.handleInput, 'Handle input is not editable').toBeEditable();
        await this.handleInput.clear();
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
        await expect(this.submitBtn, 'Submit button should be disabled').toBeDisabled();
    }

    async assertSaveBtnEnabled() {
        await expect(this.submitBtn, 'Submit button is not enabled').toBeEnabled();
    }

   


}