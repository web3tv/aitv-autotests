import { Page, Locator, expect } from '@playwright/test';

export class StudioMembershipPage {
  readonly page: Page;
  readonly membershipTitle: Locator;
  readonly addMembershipButton: Locator;
  readonly noMembershipPlansMessage: Locator;
  readonly createPlanButton: Locator;
  readonly membershipNameInput: Locator;
  readonly membershipDescriptionInput: Locator;
  readonly nextButton: Locator;
  readonly priceInput: Locator;
  readonly priceOption: Locator;
  readonly durationDropdown: Locator;
  readonly durationOption: Locator;
  readonly form: Locator;
  readonly successMessage: Locator;
  readonly closeButton: Locator;
  readonly createConfirmButton: Locator;
  readonly addedPlanRow: Locator;

  constructor(page: Page) {
    this.page = page;
    this.membershipTitle = page.getByRole('heading', { name: /membership/i });
    this.addMembershipButton = page.getByRole('button', { name: /add membership/i });
    this.noMembershipPlansMessage = page.getByRole('heading', { name: 'No Membership Plans Yet' });
    this.createPlanButton = page.getByRole('button', { name: 'Create plan' });
    this.membershipNameInput = page.getByRole('textbox', { name: 'ex. Crypto Trading' });
    this.membershipDescriptionInput = page.getByRole('textbox', { name: 'What can users expect if they' });
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.priceInput = page.getByRole('textbox', { name: 'Enter or select price' });
    this.priceOption = page.getByRole('menuitem', { name: '$0.99' });
    this.durationDropdown = page.getByText('Select Duration');
    this.durationOption = page.getByRole('option', { name: 'week' });
    this.form = page.locator('form');
    this.successMessage = page.getByText('Congratulations!Your plan has');
    this.closeButton = page.getByRole('button', { name: 'Close' });
    this.createConfirmButton = page.getByRole('button', { name: 'Create' });

    // STUDIO PAGE
    this.addedPlanRow = page.locator("[data-id='data-row']"); 
  }

  async goto() {
    const studioUrl = process.env.STUDIO_URL || 'https://studio.web3tv.dev';
    await this.page.goto(`${studioUrl}/membership`, { waitUntil: 'domcontentloaded' });
  }

  async addMembershipPlan(membershipName: string, membershipDescription: string) {
    await expect(this.noMembershipPlansMessage, 'No membership plans message does not contain expected text').toContainText('No Membership Plans Yet 😓');

    await expect(this.createPlanButton, 'Create plan button is not visible').toBeVisible();
    await expect(this.createPlanButton, 'Create plan button is not enabled').toBeEnabled();
    await this.createPlanButton.click();

    await expect(this.membershipNameInput, 'Membership name input is not visible').toBeVisible();
    await expect(this.membershipNameInput, 'Membership name input is not enabled').toBeEnabled();
    await this.membershipNameInput.click();
    await this.membershipNameInput.fill(membershipName);

    await expect(this.membershipDescriptionInput, 'Membership description input is not visible').toBeVisible();
    await expect(this.membershipDescriptionInput, 'Membership description input is not enabled').toBeEnabled();
    await this.membershipDescriptionInput.click();
    await this.membershipDescriptionInput.fill(membershipDescription);

    await expect(this.nextButton, 'Next button is not visible').toBeVisible();
    await expect(this.nextButton, 'Next button is not enabled').toBeEnabled();
    await this.nextButton.click();

    await expect(this.priceInput, 'Price input is not visible').toBeVisible();
    await expect(this.priceInput, 'Price input is not enabled').toBeEnabled();
    await this.priceInput.click();

    await expect(this.priceOption, 'Price option is not visible').toBeVisible();
    await this.priceOption.click();

    await expect(this.durationDropdown, 'Duration dropdown is not visible').toBeVisible();
    await this.durationDropdown.click();

    await expect(this.durationOption, 'Duration option is not visible').toBeVisible();
    await this.durationOption.click();

    await expect(this.form, 'Form does not contain expected text').toContainText(`${membershipName}0.991 weekSubscribe Now!${membershipDescription}`);

    await expect(this.nextButton, 'Next button is not visible').toBeVisible();
    await expect(this.nextButton, 'Next button is not enabled').toBeEnabled();
    await this.nextButton.click();

    await expect(this.createConfirmButton, 'Create confirm button is not visible').toBeVisible();
    await expect(this.createConfirmButton, 'Create confirm button is not enabled').toBeEnabled();
    await this.createConfirmButton.click();

    await expect(this.successMessage, 'Success message is not visible').toBeVisible({ timeout: 30_000 });

    await expect(this.closeButton, 'Close button is not visible').toBeVisible();
    await expect(this.closeButton, 'Close button is not enabled').toBeEnabled();
    await this.closeButton.click();
  }

  async checkAddedPlan(membershipName: string, membershipDescription: string) {
    await expect(this.addedPlanRow, 'Added plan row does not contain expected text').toContainText(membershipName);
    await expect(this.addedPlanRow, 'Added plan row does not contain expected text').toContainText(membershipDescription);
  }

  // Add more methods as needed for your tests
}
