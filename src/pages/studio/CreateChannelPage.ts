import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

// /create-channel on the AI.TV skin opens the CreateChannelModal immediately
// (the old "Start Setup" wizard step is gone).
export class CreateChannelPage {

    readonly page: Page;
    readonly modalForm: Locator;
    readonly handleInput: Locator;
    readonly nameInput: Locator;

    readonly submitBtn: Locator;
    readonly cancelBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.modalForm = page.getByTestId('create-channel-form');
        this.handleInput = page.locator('[data-id="handle"] input');
        this.nameInput = page.locator('[data-id="name"] input');
        this.submitBtn = page.getByTestId('create-channel-submit');
        this.cancelBtn = page.getByTestId('create-channel-cancel');
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

    // A body click would land on the modal backdrop and close the modal, so
    // blur the focused input via Tab instead.
    async blur() {
        await this.page.keyboard.press('Tab');
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
