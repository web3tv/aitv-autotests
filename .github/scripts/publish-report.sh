#!/usr/bin/env bash
#
# Публикует отчёты прогона на GitHub Pages (ветка gh-pages):
#   runs/<slug>/<run_id>/            — краткий отчёт (artifact-report.html)
#   runs/<slug>/<run_id>/playwright/ — штатный HTML-отчёт Playwright с трейсами
# и пересобирает корневой индекс.
#
# Полный отчёт Playwright публикуется, только если он влезает в MAX_FULL_MB:
# у Pages лимит ~1 ГБ на сайт, а прогон с падениями тянет трейсы и видео на
# десятки-сотни мегабайт. Не влезло — остаётся краткий отчёт, полный берётся
# из артефакта прогона.
#
# Ожидает в окружении:
#   REPORT_SLUG  — папка воркфлоу на Pages (critical, nightly, prod-smoke, visual)
#   REPORT_TITLE — человекочитаемое имя прогона для индекса
#   REPORT_STATUS— job.status
#   GITHUB_TOKEN / GITHUB_REPOSITORY / GITHUB_RUN_ID / GITHUB_SERVER_URL — от Actions
#
# Пишет в $GITHUB_ENV ссылки REPORT_URL и REPORT_FULL_URL
# (пустые, если публиковать было нечего — вызывающий шаг это учитывает).
set -euo pipefail

SOURCE_DIR="playwright-report"
SOURCE_REPORT="$SOURCE_DIR/artifact-report.html"
MAX_FULL_MB="${MAX_FULL_MB:-50}"

publish_failed() {
  echo "REPORT_URL=" >> "$GITHUB_ENV"
  echo "REPORT_FULL_URL=" >> "$GITHUB_ENV"
}

if [ ! -f "$SOURCE_REPORT" ]; then
  echo "⚠ $SOURCE_REPORT не найден — публиковать нечего"
  publish_failed
  exit 0
fi

OWNER="${GITHUB_REPOSITORY%%/*}"
REPO="${GITHUB_REPOSITORY##*/}"
PAGES_DIR="$RUNNER_TEMP/gh-pages"
TARGET="runs/$REPORT_SLUG/$GITHUB_RUN_ID"
REPORT_URL="https://$OWNER.github.io/$REPO/$TARGET/"
REPORT_FULL_URL=""

# Полный отчёт Playwright — только если укладывается в бюджет.
FULL_MB=$(du -sm "$SOURCE_DIR" | cut -f1)
PUBLISH_FULL=false

if [ ! -f "$SOURCE_DIR/index.html" ]; then
  echo "⚠ $SOURCE_DIR/index.html нет — публикую только краткий отчёт"
elif [ "$FULL_MB" -gt "$MAX_FULL_MB" ]; then
  echo "⚠ полный отчёт ${FULL_MB}MB > ${MAX_FULL_MB}MB — публикую только краткий (полный есть в артефакте прогона)"
else
  PUBLISH_FULL=true
  REPORT_FULL_URL="$REPORT_URL""playwright/"
fi

# Одна попытка публикации: свежий клон → файлы → orphan-коммит → push.
# История НЕ копится: каждый пуш заменяет ветку одним коммитом, иначе удалённые
# трейсы навсегда остались бы в объектах репозитория.
# set -e не действует внутри функции, вызванной в условии if, поэтому каждый
# критичный шаг завершает попытку сам через `|| return 1`.
publish_attempt() {
  rm -rf "$PAGES_DIR"
  git clone --quiet --depth 1 --branch gh-pages \
    "https://x-access-token:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY.git" "$PAGES_DIR" || return 1

  local base_sha
  base_sha=$(git -C "$PAGES_DIR" rev-parse HEAD) || return 1

  git -C "$PAGES_DIR" config user.name "github-actions[bot]"
  git -C "$PAGES_DIR" config user.email "github-actions[bot]@users.noreply.github.com"

  rm -rf "${PAGES_DIR:?}/$TARGET"
  mkdir -p "$PAGES_DIR/$TARGET"
  cp "$SOURCE_REPORT" "$PAGES_DIR/$TARGET/index.html" || return 1

  if [ "$PUBLISH_FULL" = true ]; then
    mkdir -p "$PAGES_DIR/$TARGET/playwright"
    # artifact-report.html уже лежит уровнем выше — второй копии не нужно
    (cd "$SOURCE_DIR" && tar --exclude=artifact-report.html -cf - .) \
      | (cd "$PAGES_DIR/$TARGET/playwright" && tar -xf -) || return 1
  fi

  # Метаданные для корневого индекса (сам индекс собирает buildPagesIndex.js).
  jq -nc \
    --arg slug "$REPORT_SLUG" \
    --arg title "$REPORT_TITLE" \
    --arg status "$REPORT_STATUS" \
    --arg runId "$GITHUB_RUN_ID" \
    --arg runUrl "$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID" \
    --arg finishedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '$ARGS.named' > "$PAGES_DIR/$TARGET/meta.json" || return 1

  node .github/scripts/buildPagesIndex.js "$PAGES_DIR" || return 1

  git -C "$PAGES_DIR" checkout --quiet --orphan publish || return 1
  git -C "$PAGES_DIR" add -A || return 1
  git -C "$PAGES_DIR" commit -q -m "report: $REPORT_SLUG run $GITHUB_RUN_ID ($REPORT_STATUS)" || return 1

  # --force-with-lease: если параллельный прогон успел запушить свой отчёт,
  # пуш отклоняется и попытка повторяется на свежем клоне (его отчёт не теряем).
  git -C "$PAGES_DIR" push --quiet \
    --force-with-lease="refs/heads/gh-pages:$base_sha" origin publish:gh-pages
}

for attempt in 1 2 3; do
  if publish_attempt; then
    echo "✓ краткий отчёт: $REPORT_URL"
    echo "REPORT_URL=$REPORT_URL" >> "$GITHUB_ENV"

    if [ -n "$REPORT_FULL_URL" ]; then
      echo "✓ отчёт Playwright (${FULL_MB}MB): $REPORT_FULL_URL"
    fi
    echo "REPORT_FULL_URL=$REPORT_FULL_URL" >> "$GITHUB_ENV"
    exit 0
  fi

  echo "публикация не удалась (попытка $attempt) — пробую снова на свежем клоне"
  sleep $((attempt * 5))
done

echo "⚠ не удалось опубликовать отчёт на gh-pages"
publish_failed
