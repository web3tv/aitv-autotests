import { test, expect } from '@playwright/test';
import { user1 } from '../test-data/users';
import { LoginPage } from '../src/pages/LoginPage';
import { AuthFlow } from '../src/flows/AuthFlow';
import { MainPage } from '../src/pages/MainPage';
import { HeaderPage } from '../src/pages/HeaderPage';



test.describe('Login tests', () => {

  test('Login as user', async ({ page }) => { 
    const loginPage = new LoginPage(page)
    const authFlow = new AuthFlow(loginPage);

    await authFlow.loginSuccess(user1.login, user1.password);
  });

  test('Check incorrect password', async ({ page }) => { 
    const loginPage = new LoginPage(page)
    const authFlow = new AuthFlow(loginPage);
    await authFlow.passwordError(user1.login, "Admin1@");
  });

  test('Check incorrect username', async ({ page }) => { 
    const loginPage = new LoginPage(page)
    const authFlow = new AuthFlow(loginPage);

    await authFlow.usernameError("user1", "Admin1@@");
  });

});



test.describe('Registration tests', () => {

  test('Register user via Email', async({ page })=>{
    const email = 'dwqdqdwd@pwa.com'
    const mainPage = new MainPage(page)
    const headerPage = new HeaderPage(page)
    const loginPage = new LoginPage(page)

    await mainPage.visitMainPage();
    await headerPage.clickJoinBtn();

    await loginPage.fillUsernameInput();
    await loginPage.clickCheckbox();
    await loginPage.clickContinueWithEmail();
    await loginPage.fillEmailRegistrationInput(email);
    await loginPage.fillFirstPassword('Admin1@@')
    await loginPage.fillSecondPassword('Admin1@@')
    
    await loginPage.clickCreateAccountBtn(email);
    
    
    
   
    
    
    
    
   


  })

});

