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
        await expect(this.startSetupBtn).toBeEnabled();
        await this.startSetupBtn.click();
    }

    async fillHandleName(name:any){
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

    async fillName(name:any){
        const finalUsername = name ?? `autotest_${Date.now()}`;

        await expect(this.nameInput).toBeEditable();
        await this.nameInput.fill(finalUsername);
        await expect(this.nameInput).toHaveValue(finalUsername)
    }

    async clearHandleInput(){
        await expect(this.handleInput).toBeEditable();
        await this.handleInput.clear();
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
        await expect(this.submitBtn).toBeDisabled();
    }

    async assertSaveBtnEnabled() {
        await expect(this.submitBtn).toBeEnabled();
    }

   


}