import { Page, Locator } from '@playwright/test';


export class MainPage {
    readonly page: Page;


    constructor(page: Page) {
        this.page = page;

    }


    async visitMainPage(){
       await this.page.goto('');
    }


}