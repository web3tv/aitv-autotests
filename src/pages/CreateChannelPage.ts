import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class CreateChannelPage {
    
    readonly page: Page;
    readonly handleInput: Locator;
    readonly nameInput: Locator;

    readonly submitBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.handleInput = page.getByRole('textbox', { name: 'handle' })
        this.nameInput = page.getByRole('textbox', { name: 'name' })
        this.submitBtn = page.getByRole('button', { name: 'Submit' })
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