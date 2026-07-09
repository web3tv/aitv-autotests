# AITV Autotests

E2E-тесты платформы AITV на [Playwright](https://playwright.dev/) + TypeScript.

## О проекте

- **Playwright** — раннер и автоматизация браузера
- **TypeScript** — язык тестов
- **Gmail (IMAP)** — чтение писем во флоу с почтой (регистрация, сброс пароля, 2FA); один ящик + plus-addressing, доступ по App Password
- **mysql2** — прямой доступ к БД для тестов с тегом `@db`

### Установка

```bash
npm install
npx playwright install
```

### Окружение

Есть три окружения, каждому соответствует свой `.env`-файл. Файлы **закоммичены в репозиторий намеренно** (секретных данных в них нет); при необходимости заполни локально только `EMAIL_ACCOUNT`/`EMAIL_PASSWORD` для писем/2FA:

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

**Почтовый ящик для тестов.** Флоу с письмами читают один реальный Gmail-ящик по IMAP. В каждом `.env` нужны:

- `EMAIL_ACCOUNT` — адрес ящика (например `aitvtests@gmail.com`); письма изолируются между тестами через plus-addressing (`aitvtests+qa_<rnd>@gmail.com`).
- `EMAIL_PASSWORD` — Gmail **App Password** (16 символов). Требует включённой 2FA на аккаунте (обычный пароль Google для IMAP не работает). Генерится в Google Account → Security → App passwords.

### Структура

Спеки разложены **по доменам продукта** (папки), а сквозные срезы — это **теги, а не папки** (например, всю валидацию ввода гоняешь через `--grep @validation`). Отдельная папка по типу выделяется, только когда это отдельный Playwright-проект/рантайм: `visual/` (Docker), `production/` (прод-среда), `api/` (контракт без браузера).

```
tests/
  auth/                    — логин / регистрация / сброс / email-шаблоны + валидация страницы регистрации
  account/                 — настройки аккаунта, профиль, уведомления (profile/notifications — test.fixme WIP)
  content/                 — креатор: создание и управление контентом
    upload/                —   загрузка Movie/Series/Shorts/Taxonomy + валидация загрузки
    manage/                —   видимость, описание, аналитика, NFT-конвертация, поиск по студии
    channel/               —   создание/редактирование канала + валидация страницы редактирования
  player/                  — зритель: видео-плеер, embed-плеер, воспроизведение серий
  api/                     — контракт-тесты по эндпоинтам напрямую (без браузера)
  production/              — прод-сетап и смоук (проект prodSmoke)
  visual/                  — визуалка desktop/ + mobile/ (только Docker); shared/ — переиспользуемые тела визуалок
  fixtures/                — ОБЩИЕ ФИКСТУРЫ (см. раздел «Фикстуры» ниже)
    sharedFixture.ts       —   общий read-only канал @qavischan: resolveSharedFixture() + фикс-креды
    videoSeed.ts           —   константы засеянного контента (титулы/категория/жанры) — общий источник правды
    fixtureCheck.setup.ts  —   preflight-проект fixture-check: проверяет живость общей фикстуры перед прогоном
  skip/                    — запаркованные спеки (исключены через testIgnore `**/skip/**`); инвентарь отложенного покрытия — строки [BLOCKED] в TEST_COVERAGE.md
src/
  flows/                   — оркестраторы пользовательских сценариев
  pages/                   — Page Object Model
  api/                     — API-хелперы (быстрый сетап в обход UI)
  utils/                   — утилиты (почта Gmail по IMAP, генерация данных, плеер-хелперы, wallet-мок, сид-хелперы — полный список см. в папке)
scripts/                   — one-off утилиты: seedFixture.ts (сид общей фикстуры), deleteUser.ts
test-data/
  fixtures/                — СТАТИЧЕСКИЕ ассеты (видеофайлы, фото) — НЕ путать с tests/fixtures/
docs/                      — TESTING_STRATEGY.md (стратегия), FIXTURES_AUDIT.md (аудит фикстур)
```

### Фикстуры

Не путай два «фикстурных» понятия:

- **`tests/fixtures/sharedFixture.ts`** — единый **read-only** канал `@qavischan` для visual + функциональных view-only тестов. `resolveSharedFixture()` логинится фиксированным владельцем и **резолвит URL контента по титулам** с текущего стенда (env-agnostic, ничего не коммитится). Отдаёт `channelUrl`, `videoUrl`, `shortUrl`, `privateVideoUrl`, `unlistedVideoUrl`, `descriptionVideoUrl`, `seriesId`/`seriesSlug`/`episodeUrls`, креды владельца и не-владельца. Правило: **только чтение, не мутировать** (см. CLAUDE.md).
- **`tests/fixtures/videoSeed.ts`** — константы засеянного контента (`FIXTURE_VIDEO_TITLE`, `FIXTURE_SERIES_TITLE`, категория, жанры, рейтинг и т.д.). Общий **источник правды**: по ним `scripts/seedFixture.ts` создаёт контент, а `resolveSharedFixture()` и ассерты его находят.
- **`tests/fixtures/fixtureCheck.setup.ts`** — setup-проект `fixture-check` (зависимость `functional`/visual). Один раз зовёт `resolveSharedFixture()`; если контента нет — валит прогон с «пересей: `npm run seed:fixture`».
- **`test-data/fixtures/`** — это НЕ Playwright-фикстуры, а **статические ассеты** (видеофайлы, фото), которые грузятся в тестах.

Отдельно: **`tests/visual/shared/listingVisualScenarios.ts`** — не данные, а переиспользуемые **тела** визуальных тестов листингов (desktop и mobile зовут один регистратор).

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
| `visual-mobile-webkit` | WebKit | iPhone 15 Pro Max | Визуал, только Docker |

**Функциональные тесты:**

```bash
npx playwright test --project=functional                          # все
npx playwright test tests/auth/emailAuth.spec.ts --project=functional  # один файл
npx playwright test --grep "Success login as user" --project=functional  # по имени
```

**Критический смоук / полная регрессия:**

```bash
npm run test:critical    # тесты с тегом @critical, гейт перед деплоем
npm run test:regression  # вся регрессия
npm run test:nodb        # всё, кроме @db (без port-forward к БД)
```

**Тесты с БД (`@db`)** — сначала port-forward к базе:

```bash
kubectl port-forward -n web3tv svc/mariadb 3307:3306    # держи поднятым, пока гоняешь @db
npx playwright test --project=functional --grep @db
```

Требуются DB-переменные в `.env` (`DB_HOST=127.0.0.1`, `DB_PORT=3307`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`). `DB_PORT=3307` соответствует локальному порту из port-forward выше.

#### Порядок запуска и роль фикстур подготовки данных

Некоторые `@db`-тесты **сами готовят изолированные данные в начале теста** (например ANALY-001 зовёт `setupSeededAnalytics(request)` из [src/utils/analyticsSeed.ts](src/utils/analyticsSeed.ts)). Важно понимать порядок:

1. **Один раз** подними port-forward (команда выше) — он должен работать всё время, пока гоняешь `@db`-тесты.
2. **Дальше просто запускаешь тесты** — сид зовётся прямо в теле теста (`beforeAll`/шаг), отдельной команды нет.

> `setupSeededAnalytics` отрабатывает **на каждый прогон теста заново** и создаёт **свои изолированные данные** (новый пользователь + видео + сид просмотров/лайков/комментов/подписчиков). Поэтому НЕ нужно «засидить один раз и гонять тесты, пока не очистят БД» — каждый прогон самодостаточен. Минус — сетап (~1 мин) повторяется на каждый прогон.
>
> Если понадобится «засидить один раз и переиспользовать в нескольких тестах» — это другой паттерн (общий пред-засеянный ресурс, как `@qavischan` ниже).

Запуск теста с фикстурой (port-forward уже поднят):

```bash
npx playwright test tests/content/manage/analytics.spec.ts --grep @db --project=functional
```

### Общая фикстура `@qavischan` (visual + read-only функциональные)

Сид гоняется **локально один раз на стенд** (нужен порт-форвард к БД) — get-or-create
создаёт ФИКСИРОВАННЫЙ канал `@qavischan` и обновляет его контент: public-видео, short,
private+unlisted+description видео, **сериал** с эпизодами и счётчик подписчиков. **Коммитить
нечего**: тесты вызывают `resolveSharedFixture()`, который логинится владельцем и
**резолвит URL контента по титулам с текущего стенда в рантайме**. Поэтому фикстура
**env-agnostic** (один и тот же код работает на dev1 и dev2 — аккаунт детерминирован,
разнятся только слаги), а **CI к БД не притрагивается** — резолвит по сети (VPN).
Фикс-аккаунты создаются один раз и переиспользуются (auth-сервис навсегда резервирует
хендл) → пере-сеивать нужно только после дропа БД / смены контента.
См. `tests/fixtures/sharedFixture.ts`.

```bash
kubectl port-forward -n web3tv svc/mariadb 3307:3306   # БД нужна ТОЛЬКО для локального сида
npm run seed:fixture                                    # ENV_FILE=.env.web3tv npm run seed:fixture — для dev1
```

**Кто читает фикстуру.** `resolveSharedFixture()` отдаёт `channelUrl`, `videoUrl`,
`shortUrl`, `privateVideoUrl`, `unlistedVideoUrl`, `descriptionVideoUrl`, `seriesId`/`seriesSlug`/`episodeUrls`,
креды владельца и не-владельца (`viewerEmail`). Её используют визуальные спеки и
**read-only функциональные** (плеер, авто-переход серии, видимость видео). Правило —
**только чтение, не мутировать `@qavischan`** (см. CLAUDE.md); мутирующие тесты сеют
своё через `createAndVerifyUser`/`setupVideoViaApi`.

**Preflight.** Setup-проект `fixture-check` (зависимость `functional` и визуальных
проектов) один раз резолвит фикстуру по сети (без БД) и валит прогон с понятным
«пересей: `npm run seed:fixture`», если контент отсутствует (напр. после дропа БД).

Визуальные тесты — только в Docker:

```bash
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-desktop-chromium
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-mobile-webkit
```

**Отчёт:**

```bash
npx playwright show-report
```

## Теги

Тег задаётся в опциях `test()` или `test.describe()`: `{ tag: '@emails' }`. Запуск по тегу — `--grep`. Теги несут **сквозные срезы**, которые иначе фрагментировали бы доменные папки (например, валидация лежит рядом со своей фичей, а гоняется целиком через `@validation`).

| Тег | Назначение | Команда |
|-----|------------|---------|
| `@critical` | Смоук-сьют, гейт перед деплоем | `npm run test:critical` |
| `@db` | Требует port-forward к БД | `--grep @db` |
| `@emails` | Проверки контента email-шаблонов | `--grep @emails` |
| `@validation` | Валидация ввода (auth + content) | `--grep @validation` |
| _(без тега)_ | Полная регрессия | `npm run test:regression` |

## CI (GitHub Actions)

Workflows лежат в [.github/workflows/](.github/workflows/). Dev-стенды за VPN — воркфлоу поднимает WireGuard (секрет `WG_CLIENT_CONFIG`), env берётся из закоммиченных `.env.web3tv2`/`.env.web3tv`, результаты шлются в Slack (`SLACK_WEBHOOK_URL`).

**Прод-конфигурация:** единственный источник — закоммиченный `.env.prod`; любые изменения прод-конфига делаются правкой этого файла (секрет `PROD_ENV_FILE` больше не используется и удалён).

| Workflow | Триггер | Что гоняет |
|----------|---------|------------|
| `nightly-regression.yml` | Каждую ночь 02:00 UTC + вручную | `npm run test:nodb` (регрессия без `@db`) на dev2 |
| `critical-manual.yml` | Вручную | `@critical`-смоук на dev1/dev2, с привязкой к Jira-задаче |
| `prod-smoke.yml` | Каждую ночь 00:00 UTC | Прод-смоук (`prodSmoke`), env из закоммиченного `.env.prod` |
| `aitv-visual-manual.yml` | Вручную | Визуальная регрессия |

**Ночная регрессия** (`nightly-regression.yml`): по умолчанию dev2, отчёт `playwright-report` сохраняется в артефактах, статус уходит в Slack. Cron активируется **только после мёржа в дефолтную ветку** — до этого запускай вручную через **Actions → Nightly Regression → Run workflow**.

## Быстрый старт: что нужно для запуска тестов

### 1. Клонировать и установить

```bash
git clone <repo-url> && cd aitv-autotests
npm install
npx playwright install        # браузеры Playwright
```

Env-файлы (`.env.web3tv2` — dev2 по умолчанию, `.env.web3tv` — dev1) уже в репозитории. Для писем/2FA заполни `EMAIL_ACCOUNT`/`EMAIL_PASSWORD` (см. «Окружение»).

### 2. Фикстура — одна, `@qavischan`

Проект `functional` и визуальные проекты **зависят от preflight-проекта `fixture-check`**, который проверяет, что общий read-only канал `@qavischan` жив на стенде. Канал **персистентный** — обычно он уже засеян, и тогда этот шаг пропускается.

Засевать вручную нужно, **только если `fixture-check` падает** (канала нет / после дропа БД):

```bash
kubectl port-forward -n web3tv svc/mariadb 3307:3306   # БД нужна ТОЛЬКО для сида
npm run seed:fixture                                    # ~5–8 мин (загрузка + транскод)
```

Это **единственная фикстура, которую сеют командой**. `@db`-тесты (например ANALY-001) готовят свои изолированные данные **сами в рантайме** — отдельной команды не нужно, но port-forward к БД должен быть поднят, пока их гоняешь. Эталоны визуалки (`*.png`) уже в репозитории — засевать не нужно.

### 3. Запуск и отчёт

**Функциональные** (реальный браузер, dev2 по умолчанию):

```bash
npx playwright test --project=functional     # все
npm run test:critical                        # @critical смоук
npm run test:nodb                            # всё, кроме @db (без port-forward)
npx playwright test tests/player/videoPlayer.spec.ts --project=functional   # один файл
```

**`@db`-тесты** — сначала port-forward (см. шаг 2), затем:

```bash
npx playwright test --project=functional --grep @db
```

**Визуальные** — только в Docker (пиксель-стабильность):

```bash
docker build -t test .        # один раз собрать образ
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-desktop-chromium
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-mobile-webkit
```

**Отчёт** — HTML-репорт последнего прогона:

```bash
npx playwright show-report    # откроет отчёт из папки playwright-report/
```
