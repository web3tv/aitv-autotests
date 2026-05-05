import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

if (process.env.ENV_FILE || !process.env.CI) {
  const envFile = process.env.ENV_FILE || '.env.dev';
  dotenv.config({ path: path.resolve(__dirname, envFile), quiet: true });
}

// Normalize CWD to repo root so test-data/ runtime paths resolve correctly
process.chdir(path.resolve(__dirname, '..'));

export default defineConfig({
  testDir: './tests',
  outputDir: path.resolve(__dirname, 'test-results'),
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
      ['html', { open: 'never', outputFolder: path.resolve(__dirname, 'playwright-report') }],
    ]
  : [
      ['list'],
      ['html', { open: 'always', outputFolder: path.resolve(__dirname, 'playwright-report') }],
    ],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [

    {
      name: 'functional',
      testMatch: /^(?!.*visual)(?!.*production).*\.spec\.ts$/,
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
      testMatch: /visualSuite\/desktop\/visualSuites\.spec\.ts$/,
      fullyParallel: false,
      use: {
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        colorScheme: 'light',
        locale: 'en-US',
      },
    },

    // RUN THIS PROJECT ONLY IN DOCKER!
    // docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-studio-desktop-chromium
    {
      name: 'visual-studio-desktop-chromium',
      testMatch: /visualSuite\/desktop\/studioVisualSuites\.spec\.ts$/,
      fullyParallel: false,
      use: {
        browserName: 'chromium',
        baseURL: process.env.STUDIO_URL,
        viewport: { width: 2560, height: 2000 },
        deviceScaleFactor: 1,
        colorScheme: 'light',
        locale: 'en-US',
      },
    },

    // RUN THIS PROJECT ONLY IN DOCKER!
    // docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-mobile-webkit
    {
      name: 'visual-mobile-webkit',
      testMatch: /visualSuite\/mobile\/visualSuites\.spec\.ts$/,
      fullyParallel: false,
      use: {
         ...devices['iPhone 15 Pro Max']
      },
    },
  ]
});
