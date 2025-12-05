import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.oldstage' });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'always', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',    
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',   
  },
  
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
      

    },
  ]

});
