import fs from 'fs';
import path from 'path';

type TestStatus = 'passed' | 'failed' | 'skipped' | 'timedOut' | 'flaky';

interface TestResult {
  title: string;
  status: TestStatus;
  duration: number;
  error?: { message: string; stack?: string };
  annotations?: Array<{ type: string; description: string }>;
}

interface SuiteResult {
  title: string;
  tests: TestResult[];
}

interface PlaywrightResults {
  suites: SuiteResult[];
  stats: {
    expected: number;
    unexpected: number;
    flaky: number;
    skipped: number;
    duration: number;
  };
}

// The JSON reporter writes here (see playwright.config.ts); the legacy path is
// kept as a fallback so older artifacts still render.
const RESULTS_CANDIDATES = [
  path.join('test-results', 'results.json'),
  path.join('playwright-report', 'results.json'),
];

const REPORT_DIR = path.join(process.cwd(), 'playwright-report');

function findResultsFile(): string | null {
  for (const candidate of RESULTS_CANDIDATES) {
    const full = path.join(process.cwd(), candidate);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function stripAnsi(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/\[[0-9;]*m/g, '');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * The Playwright JSON reporter nests suites: suites[] → (suites[] …) → specs[] →
 * tests[] → results[]. Flatten it to one entry per file+describe with a plain
 * test list, taking the LAST result of each test so retries collapse into a
 * single row (passed-after-retry becomes `flaky`).
 */
function flattenSuites(rawSuites: any[], parentTitle = ''): SuiteResult[] {
  const flattened: SuiteResult[] = [];

  for (const suite of rawSuites ?? []) {
    const title = parentTitle ? `${parentTitle} › ${suite.title}` : suite.title;

    const tests: TestResult[] = (suite.specs ?? []).flatMap((spec: any) =>
      (spec.tests ?? []).map((test: any) => {
        const results = test.results ?? [];
        const last = results[results.length - 1] ?? {};
        const duration = results.reduce((sum: number, r: any) => sum + (r.duration ?? 0), 0);

        const rawStatus: string = last.status ?? 'skipped';
        let status: TestStatus = rawStatus === 'interrupted' ? 'failed' : (rawStatus as TestStatus);
        if (status === 'passed' && results.length > 1) status = 'flaky';

        return {
          title: spec.title || 'Unknown test',
          status,
          duration,
          error: last.error,
          annotations: test.annotations ?? spec.annotations,
        };
      })
    );

    if (tests.length > 0) flattened.push({ title, tests });
    flattened.push(...flattenSuites(suite.suites, title));
  }

  return flattened;
}

function loadResults(resultsPath: string): PlaywrightResults {
  const rawData = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

  return {
    suites: flattenSuites(rawData.suites),
    stats: {
      expected: rawData.stats?.expected ?? 0,
      unexpected: rawData.stats?.unexpected ?? 0,
      flaky: rawData.stats?.flaky ?? 0,
      skipped: rawData.stats?.skipped ?? 0,
      duration: rawData.stats?.duration ?? 0,
    },
  };
}

/**
 * Ship results.json inside the uploaded `playwright-report` artifact — the
 * /morning-report skill reads it from there. Safe to run after the HTML
 * reporter, which has already finished wiping and rendering the folder.
 */
function copyResultsIntoReport(resultsPath: string): void {
  if (!fs.existsSync(REPORT_DIR)) return;

  const target = path.join(REPORT_DIR, 'results.json');
  if (path.resolve(resultsPath) === target) return;

  fs.copyFileSync(resultsPath, target);
  console.log(`✓ results.json copied to ${target}`);
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function getStatusIcon(status: string): string {
  const icons = {
    passed: '✓',
    failed: '✗',
    skipped: '⊘',
    timedOut: '⏱',
    flaky: '⚠',
  };
  return icons[status] || '?';
}

function isFailure(status: string): boolean {
  return status === 'failed' || status === 'timedOut';
}

function generateHTML(results: PlaywrightResults): string {
  const totalTests = results.stats.expected + results.stats.unexpected + results.stats.flaky;
  const passRate = totalTests > 0 ? ((results.stats.expected / totalTests) * 100).toFixed(1) : '0';

  const failedTests = results.suites
    .flatMap(s => s.tests)
    .filter(t => isFailure(t.status));

  const suitesByStatus = results.suites.map(suite => {
    const passed = suite.tests.filter(t => t.status === 'passed').length;
    const failed = suite.tests.filter(t => isFailure(t.status)).length;
    const flaky = suite.tests.filter(t => t.status === 'flaky').length;
    const skipped = suite.tests.filter(t => t.status === 'skipped').length;
    return { ...suite, passed, failed, flaky, skipped };
  });

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Playwright Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      line-height: 1.6;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }

    .header {
      border-bottom: 2px solid #334155;
      padding-bottom: 2rem;
      margin-bottom: 2rem;
    }
    .header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .header p { color: #94a3b8; font-size: 0.9rem; }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .stat-label { color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; }

    .stat-value.passed { color: #10b981; }
    .stat-value.failed { color: #ef4444; }
    .stat-value.flaky { color: #f59e0b; }
    .stat-value.skipped { color: #6b7280; }
    .stat-value.duration { color: #3b82f6; }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #334155;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 1rem;
    }
    .progress-fill {
      height: 100%;
      background: #10b981;
      transition: width 0.3s;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 2rem 0 1rem 0;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #334155;
    }

    .suite-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      margin-bottom: 1rem;
      overflow: hidden;
    }
    .suite-header {
      padding: 1rem;
      background: #0f172a;
      border-bottom: 1px solid #334155;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .suite-title { font-weight: 600; font-size: 1rem; }
    .suite-stats { display: flex; gap: 1.5rem; font-size: 0.85rem; }
    .suite-stats span { color: #94a3b8; }
    .suite-stats .passed { color: #10b981; }
    .suite-stats .failed { color: #ef4444; }
    .suite-stats .flaky { color: #f59e0b; }
    .suite-stats .skipped { color: #6b7280; }

    .suite-content { padding: 1rem; }
    .test-item {
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 0.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-left: 3px solid;
      font-size: 0.9rem;
    }
    .test-item.passed { border-left-color: #10b981; background: rgba(16, 185, 129, 0.05); }
    .test-item.failed { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
    .test-item.timedOut { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
    .test-item.flaky { border-left-color: #f59e0b; background: rgba(245, 158, 11, 0.05); }
    .test-item.skipped { border-left-color: #6b7280; background: rgba(107, 114, 128, 0.05); }

    .test-name { flex: 1; }
    .test-meta { display: flex; gap: 1rem; align-items: center; color: #94a3b8; }
    .test-icon { font-weight: bold; margin-right: 0.5rem; }

    .failed-details {
      background: #1e293b;
      border-left: 3px solid #ef4444;
      border-radius: 4px;
      padding: 1rem;
      margin: 1rem 0;
      font-size: 0.85rem;
    }
    .failed-title { color: #ef4444; font-weight: 600; margin-bottom: 0.5rem; }
    .error-message {
      background: #0f172a;
      padding: 0.75rem;
      border-radius: 4px;
      color: #fca5a5;
      font-family: 'Monaco', 'Menlo', monospace;
      overflow-x: auto;
    }

    .footer {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #334155;
      color: #64748b;
      font-size: 0.85rem;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Playwright Test Report</h1>
      <p>Generated at ${new Date().toLocaleString('ru-RU')}</p>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value passed">${results.stats.expected}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value failed">${results.stats.unexpected}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value flaky">${results.stats.flaky}</div>
        <div class="stat-label">Flaky</div>
      </div>
      <div class="stat-card">
        <div class="stat-value skipped">${results.stats.skipped}</div>
        <div class="stat-label">Skipped</div>
      </div>
      <div class="stat-card">
        <div class="stat-value duration">${formatDuration(results.stats.duration)}</div>
        <div class="stat-label">Total Time</div>
      </div>
    </div>

    <div class="stat-card" style="margin-bottom: 2rem;">
      <div style="text-align: left;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>Pass Rate</span>
          <span style="color: #10b981; font-weight: 600;">${passRate}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${passRate}%"></div>
        </div>
      </div>
    </div>

    ${failedTests.length > 0 ? `
      <div class="section-title">❌ Failed Tests (${failedTests.length})</div>
      ${failedTests.map(test => `
        <div class="failed-details">
          <div class="failed-title">${escapeHtml(test.title)}</div>
          ${test.annotations?.find(a => a.type === 'TC') ? `
            <div style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 0.5rem;">
              TC: ${escapeHtml(test.annotations.find(a => a.type === 'TC')?.description ?? '')}
            </div>
          ` : ''}
          <div class="error-message">${escapeHtml(stripAnsi(test.error?.message ?? 'Unknown error'))}</div>
        </div>
      `).join('')}
    ` : ''}

    <div class="section-title">📋 Test Suites (${results.suites.length})</div>
    ${suitesByStatus.map(suite => `
      <div class="suite-card">
        <div class="suite-header">
          <div class="suite-title">${escapeHtml(suite.title)}</div>
          <div class="suite-stats">
            <span class="passed">✓ ${suite.passed}</span>
            <span class="failed">✗ ${suite.failed}</span>
            <span class="flaky">⚠ ${suite.flaky}</span>
            <span class="skipped">⊘ ${suite.skipped}</span>
          </div>
        </div>
        <div class="suite-content">
          ${suite.tests.map(test => `
            <div class="test-item ${test.status}">
              <div class="test-name">
                <span class="test-icon">${getStatusIcon(test.status)}</span>
                ${escapeHtml(test.title)}
              </div>
              <div class="test-meta">
                <span>${formatDuration(test.duration)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}

    <div class="footer">
      <p>Generated by Playwright • Total ${totalTests} tests in ${formatDuration(results.stats.duration)}</p>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  try {
    console.log('📊 Loading Playwright results...');
    const resultsPath = findResultsFile();

    if (!resultsPath) {
      // The run may have died before the JSON reporter wrote anything (VPN drop,
      // job timeout). Don't fail the step — the test step already reports that.
      console.warn(`⚠ No results.json found (looked in: ${RESULTS_CANDIDATES.join(', ')}) — skipping report`);
      return;
    }

    const results = loadResults(resultsPath);

    fs.mkdirSync(REPORT_DIR, { recursive: true });
    copyResultsIntoReport(resultsPath);

    const totalTests = results.stats.expected + results.stats.unexpected + results.stats.flaky;
    console.log(`✓ Found ${results.suites.length} suites with ${totalTests} tests`);

    const html = generateHTML(results);
    const reportPath = path.join(REPORT_DIR, 'artifact-report.html');

    fs.writeFileSync(reportPath, html);
    console.log(`✓ Report saved to ${reportPath}`);

    // Output for use with Artifact tool
    console.log('\n📍 Ready to publish:');
    console.log(reportPath);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
