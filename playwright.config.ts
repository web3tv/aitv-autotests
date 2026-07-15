import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

if (process.env.ENV_FILE || !process.env.CI) {
  const envFile = process.env.ENV_FILE || '.env.web3tv2';
  dotenv.config({ path: path.resolve(__dirname, envFile), quiet: true });
}


// Build identifier shown in the HTML report header.
// Now: falls back to the GitHub Actions run number / commit of this test run.
// Later: Argo can pass the deployed prod build via `BUILD_NUMBER` (workflow_dispatch input).
const buildNumber =
  process.env.BUILD_NUMBER ||
  process.env.GITHUB_RUN_NUMBER ||
  'local';
const buildCommit = process.env.BUILD_COMMIT || process.env.GITHUB_SHA || '';

export default defineConfig({
  metadata: {
    build: buildNumber,
    ...(buildCommit ? { commit: buildCommit } : {}),
  },
  testDir: './tests',
  // `tests/skip/**` is parked (disabled) code kept for reference — never collected/run.
  testIgnore: '**/skip/**',
  expect: {
    timeout: 10_000,
    // Defaults for every visual assertion. `animations`/`caret`/`scale` are the
    // Playwright defaults spelled out explicitly; `stylePath` injects a shared
    // stylesheet (only during capture) that freezes transitions and hides the
    // caret + scrollbars so their timing/width can't leak into a diff.
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      stylePath: path.resolve(__dirname, 'tests/visual/screenshot.css'),
    },
  },
  timeout: 90_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
  ? [
      ['list'],
      // JSON riding inside playwright-report/ so it ships in the existing
      // `nightly-regression-report` / `prod-smoke-report` artifacts (no workflow
      // change needed). Consumed by the /morning-report skill for reliable
      // pass/fail/error parsing.
      ['json', { outputFile: 'playwright-report/results.json' }],
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

    // Preflight for the shared read-only fixture (`@qavischan`). A stale/missing fixture
    // aborts dependent projects with a clear "re-seed" message. Matches only the
    // `*.setup.ts` file (never a `.spec.ts`), so it's collected only here. `retries: 2`
    // absorbs a transient dev-env blip so the whole suite isn't aborted by one flake.
    {
      name: 'fixture-check',
      testMatch: /fixtureCheck\.setup\.ts$/,
      retries: 2,
      use: { browserName: 'chromium' },
    },

    {
      name: 'functional',
      testMatch: /^(?!.*visual)(?!.*production).*\.spec\.ts$/,
      dependencies: ['fixture-check'],
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
      testMatch: /visual\/desktop\/.*\.spec\.ts$/,
      dependencies: ['fixture-check'],
      fullyParallel: false,
      // Retry to absorb transient shared-env hiccups (slow nav / 5xx) so a single
      // network blip doesn't red a run. A stable screenshot diff still fails on retry.
      retries: 2,
      use: {
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        colorScheme: 'light',
        locale: 'en-US',
        trace: 'off',
        // The shared dev env is occasionally slow to first-byte; give navigation
        // more headroom than the 30s default that timed out on /movies.
        navigationTimeout: 60_000,
      },
    },

    // RUN THIS PROJECT ONLY IN DOCKER!
    // docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-mobile-webkit
    {
      name: 'visual-mobile-webkit',
      testMatch: /visual\/mobile\/.*\.spec\.ts$/,
      dependencies: ['fixture-check'],
      fullyParallel: false,
      retries: 2,
      use: {
        ...devices['iPhone 15 Pro Max'],
        trace: 'off',
        navigationTimeout: 60_000,
      },
    },
  ]
});
