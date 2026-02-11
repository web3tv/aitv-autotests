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
  readonly addedPlanRow: Locator;

  constructor(page: Page) {
    this.page = page;
    this.membershipTitle = page.getByRole('heading', { name: /membership/i });
    this.addMembershipButton = page.getByRole('button', { name: /add membership/i });
    this.noMembershipPlansMessage = page.locator('h3');
    this.createPlanButton = page.getByRole('button', { name: 'Create plan' });
    this.membershipNameInput = page.getByRole('textbox', { name: 'ex. Crypto Trading' });
    this.membershipDescriptionInput = page.getByRole('textbox', { name: 'What can users expect if they' });
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.priceInput = page.getByRole('textbox', { name: 'Enter or select price' });
    this.priceOption = page.getByRole('menuitem', { name: '$49.99' });
    this.durationDropdown = page.getByText('Select Duration');
    this.durationOption = page.getByRole('option', { name: 'week' });
    this.form = page.locator('form');
    this.successMessage = page.getByText('Congratulations!Your plan has');
    this.closeButton = page.getByRole('button', { name: 'Close' });


    // STUDIO PAGE
    this.addedPlanRow = page.locator("[data-id='data-row']"); 
  }

  async goto() {
    await this.page.goto('/studio/membership');
  }

  async addMembershipPlan(membershipName: string, membershipDescription: string) {
    await expect(this.noMembershipPlansMessage).toContainText('No Membership Plans Yet 😓');
    await this.createPlanButton.click();
    await this.membershipNameInput.click();
    await this.membershipNameInput.fill(membershipName);
    await this.membershipDescriptionInput.click();
    await this.membershipDescriptionInput.fill(membershipDescription);
    await this.nextButton.click();
    await this.priceInput.click();
    await this.priceOption.click();
    await this.durationDropdown.click();
    await this.durationOption.click();
    await expect(this.form).toContainText(`${membershipName}49.991 weekSubscribe Now!${membershipDescription}`);
    await this.nextButton.click();
    await this.page.getByRole('button', { name: 'Create' }).click();
    await expect(this.successMessage).toBeVisible();
    await this.closeButton.click();
  }

  async checkAddedPlan(membershipName: string, membershipDescription: string) {
    await expect(this.addedPlanRow).toContainText(membershipName);
    await expect(this.addedPlanRow).toContainText(membershipDescription);
  }

  // Add more methods as needed for your tests
}
