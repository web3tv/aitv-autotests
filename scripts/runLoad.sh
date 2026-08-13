#!/usr/bin/env bash
# Запуск k6-сценария с конфигом стенда из .env-файла (как у Playwright-тестов).
#   bash scripts/runLoad.sh [путь/к/сценарию.js] [доп. аргументы k6]
#   ENV_FILE=.env.web3tv PROFILE=load bash scripts/runLoad.sh
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-.env.web3tv2}"
SCENARIO="${1:-load/scenarios/browse.js}"
shift || true

if ! command -v k6 >/dev/null 2>&1; then
    echo "k6 не установлен: brew install k6" >&2
    exit 1
fi

# .env-файлы содержат строки не в shell-формате — берём только KEY=VALUE (как в CI).
BASE_URL="$(grep -E '^BASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
API_URL="$(grep -E '^API_URL=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
if [ -z "$BASE_URL" ] || [ -z "$API_URL" ]; then
    echo "BASE_URL/API_URL не найдены в $ENV_FILE" >&2
    exit 1
fi

exec k6 run "$SCENARIO" \
    --env BASE_URL="$BASE_URL" \
    --env API_URL="$API_URL" \
    --env PROFILE="${PROFILE:-smoke}" \
    "$@"
