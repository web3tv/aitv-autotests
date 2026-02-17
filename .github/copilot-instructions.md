🤖 Copilot Instructions — web3tv-autotests

This project is a Playwright-based E2E automation suite.

Copilot MUST strictly follow the architectural contract below when generating or modifying tests.

====================================================================
🚨 STRICT ARCHITECTURAL RULES (MANDATORY — NO EXCEPTIONS)

Tests MUST NOT use page directly.

Tests MUST NOT define selectors.

Tests MUST NOT call:

page.locator()

page.getByRole()

page.getByText()

page.click()

page.fill()

page.waitForURL()

page.waitForResponse()

Tests MUST NOT instantiate Page classes directly.

Tests MUST use Flow classes ONLY.

All selectors MUST exist inside src/pages/.

All multi-step business logic MUST exist inside src/flows/.

If required functionality does not exist:

Extend the appropriate Page class

Then extend the appropriate Flow class

Then use the Flow inside the test

Tests are orchestration-only and contain assertions only.

Violating these rules is a CRITICAL architecture error.

====================================================================
🏗 ARCHITECTURE LAYERS

Tests → Flows → Pages → Components → Selectors

Tests (tests/)

Contain business scenario definitions

Call Flow methods only

Contain assertions only

Must NOT contain UI logic

Must NOT contain navigation logic

Must NOT contain waits

Flows (src/flows/)

Combine multiple Pages

Represent business actions (loginSuccess, createChannel, logoutUser)

Handle navigation

Handle page.waitForURL

Handle page.waitForResponse

Handle synchronization

May instantiate Page classes internally

Pages (src/pages/)

Contain selectors

Contain atomic UI interactions

No business logic

No cross-page orchestration

Components (src/pages/components/)

Reusable UI fragments (Header, Dropdown, VideoPlayer, etc.)

Used inside Pages only

====================================================================
✅ VALID TEST EXAMPLE

Example of a correct test:

test('User can login successfully', async ({ authFlow }) => {
await authFlow.loginSuccess(email, password);
});

====================================================================
❌ INVALID TEST EXAMPLE (FORBIDDEN)

Example of forbidden pattern:

test('Login', async ({ page }) => {
await page.getByRole('textbox', { name: 'Email' }).fill(email);
await page.getByRole('button', { name: 'Login' }).click();
});

Direct page interaction in tests is NOT allowed.

====================================================================
🧩 FLOW EXAMPLE

export class AuthFlow {
constructor(private readonly page: Page) {}

async loginSuccess(email: string, password: string) {
const loginPage = new LoginPage(this.page);

await loginPage.navigate();
await loginPage.fillEmail(email);
await loginPage.fillPassword(password);
await loginPage.submit();

await this.page.waitForURL('/');
await this.page.waitForResponse('/api/users/whoami');


}
}

====================================================================
🧱 PAGE EXAMPLE

export class LoginPage {
constructor(private readonly page: Page) {}

async navigate() {
await this.page.goto('/login');
}

async fillEmail(email: string) {
await this.page
.getByRole('textbox', { name: 'Enter email or username' })
.fill(email);
}

async fillPassword(password: string) {
await this.page
.getByRole('textbox', { name: 'Password' })
.fill(password);
}

async submit() {
await this.page
.getByRole('button', { name: 'Login' })
.click();
}
}

====================================================================
🎯 SELECTOR STRATEGY

Use accessibility-first selectors:

getByRole

getByText (regex allowed)

semantic selectors only

Avoid:

brittle CSS chains

nth-child

hardcoded DOM hierarchy selectors

====================================================================
⏳ WAIT STRATEGY

Flows are responsible for:

page.waitForURL()

page.waitForResponse()

navigation handling

synchronization logic

Tests MUST NOT contain waits.

====================================================================
🔐 API USAGE

For test setup:

Prefer AuthApi over UI interactions

Use APIRequestContext

Avoid UI setup when API can perform the action

====================================================================
🐳 VISUAL TESTS

Located in tests/visualSuite

Must run in Docker only

Must not mix with functional tests

====================================================================
⚠️ WHEN GENERATING A NEW TEST

Check if existing Flow already covers the scenario.

If not:

Extend Page

Extend Flow

Then write Test.

Never shortcut architecture.

Never bypass Flow layer.

Never place selectors inside tests.

Architecture consistency is more important than brevity.

====================================================================
🧰 TEST BODY STRUCTURE

Inside each test, always declare every required constant, Flow instance, and input value first, and only then call Flow methods. Never mix declarations with actions.

Example:

const authFlow = new AuthFlow(page);
const login = process.env.USER_LOGIN_PUBLIC!;
const password = process.env.USER_PASSWORD!;

await authFlow.loginSuccess(login, password);

====================================================================
📐 CODE STYLE

Keep indentation consistent with the surrounding file (2 spaces in tests and pages). Do not mix tabs and spaces or change the existing indentation style when editing.