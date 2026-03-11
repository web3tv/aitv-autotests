import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

if (!process.env.CI) {
  dotenv.config({ path: '.env.dev', quiet: true });
}


export default defineConfig({
  testDir: './tests',
  expect: {
    timeout: 10_000,
  },
  timeout: 90_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
  ? [
      ['list'],
      ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ]
  : [
      ['list'],
      ['html', { open: 'always', outputFolder: 'playwright-report' }],
    ],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'retain-on-failure',    
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',   
  },
  
  projects: [

    {
      name: 'metamask',
      testMatch: /walletRegistration\.spec\.ts$/,
      use: {
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'functional',
      testMatch: /^(?!.*visual).*\.spec\.ts$/,
      use: {
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 },
      },
    },


    // RUN THIS PROJECT ONLY IN DOCKER!
    // docker run --rm -v "$PWD:/app" pw-tests npx playwright test --project=visual-desktop-chromium
    {
      name: 'visual-desktop-chromium',
      testMatch: /visualSuite\/desktop\/visualSuites\.spec\.ts$/,
      fullyParallel: false,
      // workers: 1,
      use: {
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        colorScheme: 'light',
        locale: 'en-US',
      },
    },

    // RUN THIS PROJECT ONLY IN DOCKER!
    // docker run --rm -v "$PWD:/app" pw-tests npx playwright test --project=visual-mobile-chromium
    {
      name: 'visual-mobile-webkit',
      testMatch: /visualSuite\/mobile\/visualSuites\.spec\.ts$/,
      fullyParallel: false,
      // workers: 1,
      use: {
         ...devices['iPhone 15']
      },
    },

    
  // {
    //   name: 'functional',
    //   testMatch: /^(?!.*visual).*\.spec\.ts$/,
    //   use: { 
    //     ...devices['Desktop Chrome'],
    //     viewport: { width: 1920, height: 1080 }
    //   },
    // },

    
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
});
