#!/usr/bin/env node
/**
 * Пересобирает корневой index.html ветки gh-pages — список опубликованных
 * отчётов по каждому воркфлоу. Данные берёт из runs/<slug>/<run_id>/meta.json,
 * которые кладёт publish-report.sh.
 *
 * Заодно чистит старое, иначе сайт упрётся в лимит Pages (~1 ГБ):
 *   - краткие отчёты: KEEP_PER_SLUG последних на воркфлоу (они по ~25 КБ);
 *   - вложенные отчёты Playwright с трейсами: KEEP_FULL_PER_SLUG последних,
 *     у остальных папка playwright/ удаляется (сами прогоны остаются).
 *
 * Usage: node buildPagesIndex.js <путь к чекауту gh-pages>
 */
const fs = require('fs');
const path = require('path');

const KEEP_PER_SLUG = 100;
const KEEP_FULL_PER_SLUG = 3;

const SLUG_TITLES = {
  critical: 'Critical Tests',
  nightly: 'Nightly Regression',
  'prod-smoke': 'Prod Smoke',
  visual: 'AITV Visual Tests',
};

const pagesDir = process.argv[2];
if (!pagesDir) {
  console.error('Usage: node buildPagesIndex.js <pages-dir>');
  process.exit(1);
}

const runsDir = path.join(pagesDir, 'runs');

function readRuns(slug) {
  const slugDir = path.join(runsDir, slug);

  return fs
    .readdirSync(slugDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const metaPath = path.join(slugDir, entry.name, 'meta.json');
      const meta = fs.existsSync(metaPath)
        ? JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
        : {};

      return {
        slug,
        runId: entry.name,
        title: meta.title ?? SLUG_TITLES[slug] ?? slug,
        status: meta.status ?? 'unknown',
        runUrl: meta.runUrl,
        finishedAt: meta.finishedAt ?? '',
        hasFull: fs.existsSync(path.join(slugDir, entry.name, 'playwright', 'index.html')),
      };
    })
    // run_id монотонно растёт, так что это надёжнее даты из meta.json
    .sort((a, b) => Number(b.runId) - Number(a.runId));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  return iso.replace('T', ' ').replace('Z', ' UTC');
}

function statusColor(status) {
  if (status === 'success') return '#10b981';
  if (status === 'failure') return '#ef4444';
  if (status === 'cancelled') return '#6b7280';
  return '#f59e0b';
}

if (!fs.existsSync(runsDir)) {
  console.log('runs/ пуст — индекс не нужен');
  process.exit(0);
}

const slugs = fs
  .readdirSync(runsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

const sections = slugs.map(slug => {
  const runs = readRuns(slug);

  for (const stale of runs.slice(KEEP_PER_SLUG)) {
    fs.rmSync(path.join(runsDir, slug, stale.runId), { recursive: true, force: true });
    console.log(`⌫ удалён старый отчёт ${slug}/${stale.runId}`);
  }

  const kept = runs.slice(0, KEEP_PER_SLUG);

  // Трейсы/видео весят десятки мегабайт — держим их только у свежих прогонов.
  for (const stale of kept.slice(KEEP_FULL_PER_SLUG).filter(run => run.hasFull)) {
    fs.rmSync(path.join(runsDir, slug, stale.runId, 'playwright'), { recursive: true, force: true });
    stale.hasFull = false;
    console.log(`⌫ удалён отчёт Playwright ${slug}/${stale.runId} (краткий остался)`);
  }

  return { slug, title: SLUG_TITLES[slug] ?? slug, runs: kept };
});

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AITV Autotests — отчёты</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      line-height: 1.6;
    }
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .subtitle { color: #94a3b8; font-size: 0.9rem; margin-bottom: 2rem; }
    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 2rem 0 0.75rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #334155;
    }
    .run {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.6rem 0.75rem;
      border-left: 3px solid;
      border-radius: 4px;
      margin-bottom: 0.4rem;
      background: #1e293b;
      font-size: 0.9rem;
    }
    .run a { color: #e2e8f0; text-decoration: none; font-weight: 500; }
    .run a:hover { text-decoration: underline; }
    .run .meta { color: #94a3b8; font-size: 0.8rem; margin-left: auto; display: flex; gap: 1rem; }
    .run .meta a { color: #64748b; font-weight: 400; }
    .empty { color: #64748b; font-size: 0.9rem; }
    .footer { margin-top: 3rem; color: #64748b; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 AITV Autotests — отчёты</h1>
    <div class="subtitle">Последние ${KEEP_PER_SLUG} прогонов каждого воркфлоу</div>

    ${sections
      .map(
        section => `
    <div class="section-title">${escapeHtml(section.title)}</div>
    ${
      section.runs.length === 0
        ? '<div class="empty">нет отчётов</div>'
        : section.runs
            .map(
              run => `
    <div class="run" style="border-left-color: ${statusColor(run.status)}">
      <a href="runs/${escapeHtml(run.slug)}/${escapeHtml(run.runId)}/">Прогон #${escapeHtml(run.runId)}</a>
      <span class="meta">
        <span style="color: ${statusColor(run.status)}">${escapeHtml(run.status)}</span>
        <span>${escapeHtml(formatDate(run.finishedAt))}</span>
        ${
          run.hasFull
            ? `<a href="runs/${escapeHtml(run.slug)}/${escapeHtml(run.runId)}/playwright/">Playwright →</a>`
            : ''
        }
        ${run.runUrl ? `<a href="${escapeHtml(run.runUrl)}">CI →</a>` : ''}
      </span>
    </div>`
            )
            .join('')
    }`
      )
      .join('')}

    <div class="footer">Обновляется автоматически из GitHub Actions</div>
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(pagesDir, 'index.html'), html);
console.log(`✓ индекс собран: ${sections.reduce((sum, s) => sum + s.runs.length, 0)} отчётов`);
