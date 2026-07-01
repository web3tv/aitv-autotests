# AITV Autotests

E2E-тесты платформы AITV на [Playwright](https://playwright.dev/) + TypeScript.

## О проекте

- **Playwright** — раннер и автоматизация браузера
- **TypeScript** — язык тестов
- **mail.tm** — одноразовые ящики для флоу с письмами (регистрация, сброс пароля)
- **mysql2** — прямой доступ к БД для тестов с тегом `@db`

### Установка

```bash
npm install
npx playwright install
```

### Окружение

Есть три окружения, каждому соответствует свой `.env`-файл (не коммитятся, все в `.gitignore`):

| Окружение | Файл | Хост |
|-----------|------|------|
| dev1 | `.env.web3tv` | web3tv.dev |
| dev2 (по умолчанию) | `.env.web3tv2` | web3tv2.dev |
| prod | `.env.prod` | ai.tv |

По умолчанию используется `.env.web3tv2`. Переключение из терминала — через `ENV_FILE`:

```bash
ENV_FILE=.env.prod npx playwright test --project=functional
```

Для запуска из IDE (VS Code Playwright extension) задай env в `.vscode/settings.json`:

```json
{
  "playwright.env": { "ENV_FILE": ".env.prod" }
}
```

После изменения обнови список тестов кнопкой ↺ в Test Explorer.

### Структура

```
tests/        — спеки по доменам (auth, user, subscription, studio, validation, visualSuite)
src/
  flows/      — оркестраторы пользовательских сценариев
  pages/      — Page Object Model
  api/        — API-хелперы (быстрый сетап в обход UI)
  utils/      — утилиты (mail.tm, видео-плеер, генерация данных)
test-data/    — фикстуры (видео, фото)
```

Карта покрытия тест-кейсами — [TEST_COVERAGE.md](TEST_COVERAGE.md).

## Правила написания тестов

- **Проверяй доступность элемента перед действием.** Перед каждым `click`/`fill` — `expect(...).toBeVisible()` и `toBeEnabled()` с описательным сообщением об ошибке (например `'Submit button is not enabled'`).
- **TC ID — в `annotation`, не в имени теста.** Один TC ID = один `test()`.
  ```ts
  test('Search filters videos by title', {
      annotation: { type: 'TC', description: 'STUDIO-017' },
  }, async () => { ... });
  ```
- **Логические фазы — в `test.step()`** (setup, action, assertion).
- **Независимый пользователь на каждый тест** — через `AuthApi.createAndVerifyUser()`. Не шарь юзеров/состояние между тестами.
- **`page.waitForResponse` регистрируй ДО триггер-действия**, иначе гонка.
- **Никогда не используй `waitUntil: 'networkidle'` на видео-страницах** — плеер шлёт запросы постоянно. Используй `domcontentloaded`.
- **Локаторы Page Object — только в конструкторе.** Не создавай локаторы инлайн в методах.
- **Flows — для сложных переиспользуемых многошаговых сценариев** (логин, регистрация, аплоад). Для остального тесты обращаются к Page Objects напрямую, а к API-хелперам (`AuthApi`, `VideoApi`) — для быстрого сетапа в обход UI.

## Проекты и запуск

| Проект | Браузер | Вьюпорт | Назначение |
|--------|---------|---------|------------|
| `functional` | Chromium | 1920×1080 | Все функциональные тесты |
| `prodSmoke` | Chromium | 1920×1080 | Прод-смоук (`ENV_FILE=.env.prod`) |
| `visual-desktop-chromium` | Chromium | 1920×1080 | Визуал, только Docker |
| `visual-desktop-large-chromium` | Chromium | 2560×1080 | Визуал, только Docker |
| `visual-mobile-webkit` | WebKit | iPhone 15 Pro Max | Визуал, только Docker |

**Функциональные тесты:**

```bash
npx playwright test --project=functional                          # все
npx playwright test tests/auth/auth.spec.ts --project=functional  # один файл
npx playwright test --grep "Success login as user" --project=functional  # по имени
```

**Критический смоук / полная регрессия:**

```bash
npm run test:critical    # тесты с тегом @critical, гейт перед деплоем
npm run test:regression  # вся регрессия
```

**Тесты с БД (`@db`)** — сначала port-forward к базе:

```bash
kubectl port-forward -n web3tv svc/mariadb 3307:3306    # держи поднятым, пока гоняешь @db
npx playwright test --project=functional --grep @db
```

Требуются DB-переменные в `.env` (`DB_HOST=127.0.0.1`, `DB_PORT=3307`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`). `DB_PORT=3307` соответствует локальному порту из port-forward выше.

#### Порядок запуска и роль фикстур подготовки данных

Некоторые `@db`-тесты используют **фикстуру подготовки данных** (например `seededAnalytics` в [tests/fixtures.ts](tests/fixtures.ts) для ANALY-001). Важно понимать порядок:

1. **Один раз** подними port-forward (команда выше) — он должен работать всё время, пока гоняешь `@db`-тесты.
2. **Дальше просто запускаешь тесты.** Фикстуру **отдельно запускать не нужно** — это не отдельная команда. Playwright сам вызывает её как setup перед телом теста.

> Фикстура `seededAnalytics` — **test-scoped**: она отрабатывает **на каждый прогон теста заново** и создаёт **свои изолированные данные** (новый пользователь + видео + сид просмотров/лайков/комментов/подписчиков). Поэтому НЕ нужно «засидить один раз и гонять тесты, пока не очистят БД» — каждый прогон самодостаточен и не зависит от предыдущих данных. Минус — сетап (~1 мин) повторяется на каждый прогон.
>
> Если понадобится «засидить один раз и переиспользовать в нескольких тестах» — это другой паттерн (worker-scoped фикстура или отдельный seed-скрипт); текущая фикстура так не работает.

Запуск теста с фикстурой (port-forward уже поднят):

```bash
npx playwright test tests/studio/analytics.spec.ts --grep @db --project=functional
```

**Визуальные тесты** — только внутри Docker (для пиксель-стабильности):

```bash
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-desktop-chromium
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-desktop-large-chromium
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-mobile-webkit
```

**Отчёт:**

```bash
npx playwright show-report
```

## Теги

Тег задаётся в опциях `test()` или `test.describe()`: `{ tag: '@emails' }`. Запуск по тегу — `--grep`.

| Тег | Назначение | Команда |
|-----|------------|---------|
| `@critical` | Смоук-сьют, гейт перед деплоем | `npm run test:critical` |
| `@db` | Требует port-forward к БД | `--grep @db` |
| `@emails` | Проверки контента email-шаблонов | `--grep @emails` |
| _(без тега)_ | Полная регрессия | `npm run test:regression` |
