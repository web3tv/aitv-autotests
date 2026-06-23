import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

if (process.env.ENV_FILE || !process.env.CI) {
  const envFile = process.env.ENV_FILE || '.env.web3tv2';
  dotenv.config({ path: path.resolve(__dirname, envFile), quiet: true });
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
      name: 'aitv',
      testMatch: /ai\.tv\/.*\.spec\.ts$/,
      use: {
        browserName: 'chromium',
      },
    },

    {
      name: 'functional',
      testMatch: /^(?!.*visual)(?!.*production)(?!.*ai\.tv).*\.spec\.ts$/,
      use: {
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'prodSmoke',
      testMatch: /production\/(?!setup).*\.spec\.ts$/,
      use: {
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 },
      },
    },

    // RUN THIS PROJECT ONLY IN DOCKER!
    // docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-desktop-chromium
    {
      name: 'visual-desktop-chromium',
      testMatch: /visualSuite\/desktop\/.*\.spec\.ts$/,
      fullyParallel: false,
      expect: {
        toHaveScreenshot: {
          maxDiffPixelRatio: 0.01,  
          threshold: 0.1,           
        },
      },
      use: {
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        colorScheme: 'light',
        locale: 'en-US',
        trace: 'off',
      },
    },

    // RUN THIS PROJECT ONLY IN DOCKER!
    // docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-desktop-large-chromium
    {
      name: 'visual-desktop-large-chromium',
      testMatch: /visualSuite\/desktop\/.*\.spec\.ts$/,
      fullyParallel: false,
      expect: {
        toHaveScreenshot: {
          maxDiffPixelRatio: 0.02,  
          threshold: 0.1,         
        },
      },
      use: {
        browserName: 'chromium',
        viewport: { width: 2560, height: 1080 },
        deviceScaleFactor: 1,
        colorScheme: 'light',
        locale: 'en-US',
        trace: 'off',
      },
    },

    // RUN THIS PROJECT ONLY IN DOCKER!
    // docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-mobile-webkit
    {
      name: 'visual-mobile-webkit',
      testMatch: /visualSuite\/mobile\/.*\.spec\.ts$/,
      fullyParallel: false,
      expect: {
        toHaveScreenshot: {
          maxDiffPixelRatio: 0.03,  // строго: 1% (десктоп, контроль)
          threshold: 0.2,           // цвета почти как есть
        },
      },
      use: {
        ...devices['iPhone 15 Pro Max'],
        trace: 'off',
      },
    },
  ]
});
