#!/usr/bin/env bash
#
# Публикует красивый отчёт (playwright-report/artifact-report.html) на GitHub Pages
# в ветку gh-pages: runs/<slug>/<run_id>/index.html, и пересобирает корневой индекс.
#
# Ожидает в окружении:
#   REPORT_SLUG  — папка воркфлоу на Pages (critical, nightly, prod-smoke, visual)
#   REPORT_TITLE — человекочитаемое имя прогона для индекса
#   REPORT_STATUS— job.status
#   GITHUB_TOKEN / GITHUB_REPOSITORY / GITHUB_RUN_ID / GITHUB_SERVER_URL — от Actions
#
# Пишет ссылку на опубликованный отчёт в $GITHUB_ENV как REPORT_URL
# (пусто, если публиковать было нечего — вызывающий шаг это учитывает).
set -euo pipefail

SOURCE_REPORT="playwright-report/artifact-report.html"

if [ ! -f "$SOURCE_REPORT" ]; then
  echo "⚠ $SOURCE_REPORT не найден — публиковать нечего"
  echo "REPORT_URL=" >> "$GITHUB_ENV"
  exit 0
fi

OWNER="${GITHUB_REPOSITORY%%/*}"
REPO="${GITHUB_REPOSITORY##*/}"
PAGES_DIR="$RUNNER_TEMP/gh-pages"
TARGET="runs/$REPORT_SLUG/$GITHUB_RUN_ID"

rm -rf "$PAGES_DIR"
git clone --depth 1 --branch gh-pages \
  "https://x-access-token:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY.git" "$PAGES_DIR"

git -C "$PAGES_DIR" config user.name "github-actions[bot]"
git -C "$PAGES_DIR" config user.email "github-actions[bot]@users.noreply.github.com"

mkdir -p "$PAGES_DIR/$TARGET"
cp "$SOURCE_REPORT" "$PAGES_DIR/$TARGET/index.html"

# Метаданные для корневого индекса (сам индекс собирает buildPagesIndex.js).
jq -nc \
  --arg slug "$REPORT_SLUG" \
  --arg title "$REPORT_TITLE" \
  --arg status "$REPORT_STATUS" \
  --arg runId "$GITHUB_RUN_ID" \
  --arg runUrl "$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID" \
  --arg finishedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '$ARGS.named' > "$PAGES_DIR/$TARGET/meta.json"

node .github/scripts/buildPagesIndex.js "$PAGES_DIR"

REPORT_URL="https://$OWNER.github.io/$REPO/$TARGET/"

git -C "$PAGES_DIR" add -A
git -C "$PAGES_DIR" commit -q -m "report: $REPORT_SLUG run $GITHUB_RUN_ID ($REPORT_STATUS)"

# Пуш с ретраями: параллельные прогоны пишут в ту же ветку.
for attempt in 1 2 3; do
  if git -C "$PAGES_DIR" push origin gh-pages; then
    echo "✓ отчёт опубликован: $REPORT_URL"
    echo "REPORT_URL=$REPORT_URL" >> "$GITHUB_ENV"
    exit 0
  fi

  echo "push отклонён (попытка $attempt) — подтягиваю gh-pages и пробую снова"
  git -C "$PAGES_DIR" pull --rebase origin gh-pages

  # После rebase в ветке могли появиться чужие прогоны — пересобираем индекс
  # и вкладываем его в тот же коммит.
  node .github/scripts/buildPagesIndex.js "$PAGES_DIR"
  git -C "$PAGES_DIR" add -A
  git -C "$PAGES_DIR" diff --cached --quiet || git -C "$PAGES_DIR" commit -q --amend --no-edit
done

echo "⚠ не удалось запушить отчёт на gh-pages"
echo "REPORT_URL=" >> "$GITHUB_ENV"
