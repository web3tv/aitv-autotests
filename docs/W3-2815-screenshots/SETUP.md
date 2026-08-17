# W3-2815 — журнал сетапа (страница Content в студии, редизайн)

**Дата:** 14.08.2026 · **Задача:** [W3-2815](https://stretch-com.atlassian.net/browse/W3-2815) «FE: create new flow for series»
**Стенд:** dev2 — `ENV_FILE=.env.web3tv2`, `BASE_URL=https://web3tv2.dev`, `STUDIO_URL=https://studio.web3tv2.dev`
**Ветка тестов:** `w3-2815-studio-content-redesign-tests` (от `main`)
**Ветка фронта:** фича раскатана на dev2 (проверено по DOM — есть `aitv-studio-tab-*`, bulk-бар, кебаб);
исходники — `origin/W3-2815/mamulian/create-new-flow-series` в `~/Desktop/autotests/web3tv-main_app-nextjs`
(локальный `master` фичу НЕ содержит).

## Юзеры и контент

Ничего не сеялось и не мутировалось. Весь smoke прошёл на **общей read-only фикстуре**
`@qavischan` (`resolveSharedFixture()`): логин владельцем `qa_vis_chan@aitv-test.com`
(пароль — `USER_PASSWORD` из env), контент — 3 эпизода `QAVISCHAN Unique Series`,
`QA Visual Description/Unlisted/Private`, `QAVISCHAN Unique Short`, 3 длинных видео.
Модалки открывались и **отменялись** (Cancel), submit не нажимался ни разу.

`npx playwright test --project=fixture-check` — **PASS** (эндпоинты резолвера
`GET /videos/studio/` и `/playlists/?mine=true` редизайн не менял, ре-сид не нужен).

## Прогон «до правок» (фиксация фактических падений)

| Спека | Результат |
|---|---|
| `studioSearch.spec.ts` STUDIO-017/018/019 | **FAIL** — `[data-testid="studioSearchInput"]` не найден; поиск переехал на `aitv-studio-search` |
| `uploadSeries.spec.ts` SERIES-001/002 @critical | PASS — `getByRole('link')` на Series-табе жив |
| `editContentType.spec.ts` EDIT-001..003 | PASS при перепрогоне (в первом прогоне 2 упали — флейк, не редизайн) |
| `uploadMovie.spec.ts` UPLOAD-006 (>50mb) | FAIL по таймауту загрузки (96%) — медленный dev, к задаче не относится |
| `uploadMovie` MOVIE-001/002, `uploadShorts` SHORTS-001..003 | PASS |

## Факты, снятые на стенде (основа для ассертов)

- **Оба DOM-дерева смонтированы одновременно:** 10 видимых `studio-card` и 20 `video-row` в DOM →
  все коллекции обязаны фильтроваться по видимости.
- **URL табов:** all → `?type=all`, movies → `?type=video`, series → `?type=playlist`, shorts → `?type=short`.
  Вид — отдельный параметр `?view=grid|table` + localStorage `aitv-studio-content-view`. Дефолт — grid.
- **Deep-link `?type=video|short|all` работает** (6/1/10 карточек) → `editTitleViaStudio` не трогаем.
- **Bulk-бар:** счётчика выбранного НЕТ, только «Select all». Считать выбранное по `[data-selected="true"]`.
  Эпизод в выборке → `aitv-studio-bulk-add-to-series` и `-create-series` **disabled**, Delete активен.
  На Series-табе: только `aitv-series-bulk-delete` + `aitv-series-bulk-change-visibility`.
  `aitv-studio-bulk-more` рендерится и на 1920×1080.
- **Кебаб по типам:** video → add-to-series, copy-link, copy-embed-code, analytics, change-visibility, delete;
  episode → copy-link, **manage-episodes (disabled — ожидаемо)**, change-visibility, delete;
  short → copy-link, copy-embed-code, change-visibility, delete.
- **Create series:** title 1 символ → Continue disabled, ≥2 → enabled; поля жёстко обрезаются (100/200).
  Шаг 2 «Finalize Details» — public/unlisted/private, кнопка `aitv-create-series-submit` («Create Series»).
- **Add to series:** submit **disabled** пока серия не выбрана; поиска нет при ≤4 сериях;
  заголовок «Adding N video to the existing series».
- **Change visibility (видео):** submit **disabled** при текущем значении (подтверждает VISCHG-002);
  «Changing visibility of N selected video», кнопка «Change».
- **Change visibility (серия):** `aitv-series-visibility-*`, submit disabled изначально, Unlisted есть.
- **Пустой поиск:** `[data-id="studio-no-filter-results"]` + `reset-filters-button`,
  текст «No results found. Try adjusting your filters.» (это НЕ `aitv-studio-empty-state`).
- **Delete confirm:** «Delete video» / «You are about to permanently delete this video from your
  channel. This action cannot be undone.»; Cancel ничего не удаляет (10 карточек до и после).
- **Строка серии в table-view:** `[data-id="playlist-row"]`, ссылка «Content» →
  `/studio/content/playlist/{playlistId}/{channelId}/videos`.

## Скриншоты

`01-content-grid-default.png`, `02-content-table-view.png`, `04-create-series-step2-visibility.png`,
`05-add-to-series-modal.png`, `06-change-visibility-modal.png`, `07-series-tab-bulk-bar.png`,
`08-no-filter-results.png`, `09-delete-confirm-modal.png`.
Эталонов Figma в сравнении не открывалось — макеты в тикете (node-id 10525-107164 / 107873 / 108084),
сверка вида отложена; фактический вид зафиксирован скриншотами выше.

**Нюанс съёмки:** страница постоянно анимируется, MCP `browser_take_screenshot` падает по таймауту.
Снимать через `browser_run_code_unsafe` → `page.screenshot({ animations: 'disabled', caret: 'hide' })`.

## Найденные баги (проверены на dev2 14.08, тикеты НЕ заведены)

1. **[BE] Серии не поддерживают Unlisted.** `POST /playlists/` и `PUT /playlists/` отвечают
   **422** `Validation Failed / privacyStatus: "This value should be of type int|string"`
   на `privacyStatus=unlisted`; `public` и `private` проходят (201/200). При этом обе UI-модалки
   (Create Series и Change series visibility) предлагают опцию Unlisted — пользователь выбирает её
   и получает молчаливую ошибку. Это ровно пункт из QA-комментария тикета «Add 'Unlisted'
   visibility for 'Series'» — на бэке он не сделан.
   Блокирует: SERIES-UI-001, VISCHG-010 (оба помечены `test.fixme`).

2. **[FE] «Add to Series» не фильтрует серии по приватности выбранного видео.** Для приватного
   видео в списке остаются публичные серии. Причина в коде ветки:
   `useAddToSeries` читает выбранные видео как
   `queryClient.getQueryData(['videos-{channelId}-studio'])` — точным ОДНОэлементным ключом,
   тогда как листинг кэшируется двухэлементным ключом
   `['videos-{channelId}-studio', {order, filterByVisibility, filterByStatus, title, type}]`.
   Совпадения нет никогда → выборка пуста → `hasPrivateVideos` всегда false.
   Рабочий аналог рядом: `findSelectedVideosInCache` (change-visibility) использует
   `getQueriesData({ predicate })` по первому элементу ключа — там фильтрация по типу работает
   (подтверждено зелёным BULK-003). Блокирует: SERIES-UI-011 (`test.fixme`).

## Грабли, на которые уже наступили (не повторять)

- **«Select all» кликается по подписи** `aitv-studio-select-all-label`. Клик по самому чекбоксу
  `aitv-studio-select-all` при частичном выборе СНИМАЕТ выделение, а не расширяет его.
- **Возврат на уже посещённый таб не шлёт запрос** — react-query отдаёт данные из кэша,
  поэтому `waitForResponse` там вешает тест. Ждать надо появления карточек.
- **N одинаковых `page.waitForResponse` не ждут N ответов** — одно событие резолвит все
  зарегистрированные промисы. Для bulk-действий (N запросов по одному на элемент) используем
  `collectResponses()` из `src/utils/responseCollector.ts`.
- **Тулбар на пустом канале НЕ дизейблится** (проверено) — не ассертить `toBeDisabled`.
- **Приватность видео в API — поле `privacySettings`** (мн. ч.), не `privacySetting`.
- **Дубликат названия серии ловится на шаге Continue**, а не на сабмите: шаг видимости
  просто не открывается.
- **Модалка видимости серии имеет success-экран** (общий `aitv-change-visibility-success`),
  она НЕ закрывается сама после успешного PUT.
- **URL страницы эпизодов** — `/content/playlist/{id}/{channelId}/videos` на поддомене
  `studio.`, без сегмента `/studio`.
- **После `goto` на /content нельзя сразу трогать карточку.** Под нагрузкой полного регресса
  студия подолгу висит на спиннере, и карточка не успевает отрисоваться за 15 с (так падал
  BULK-007). Все мутирующие спеки после навигации вызывают
  `studioContent.waitForListing()` (ждёт первую видимую карточку до 45 с).
- **В table-view на каждый элемент рендерятся ДВЕ строки `video-row`**, чекбокс только у одной →
  считать элементы через `:visible:has([data-testid="aitv-studio-row-checkbox"])`.
  Старый хардкод «2 строки на видео» в `studioSearch.spec.ts` из-за этого остаётся верным.

## Прогресс и как продолжить

Пройдено: Phase 0 (ветка, fixture-check, прогон «до»), Phase 1-4 (Jira/код/дизайн/маппинг),
Phase 5 (план утверждён), Phase 6-8 (smoke + скриншоты).
Осталось: починка `StudioContentPage` + `studioSearch.spec.ts` (только локаторы), новая инфраструктура
(5 модальных POM), спеки P1 → P2 → P3, visual baseline, review, TEST_COVERAGE.md.

Чтобы продолжить: перечитать план
`~/.claude/plans/https-stretch-com-atlassian-net-browse-w-snuggly-pumpkin.md` и этот файл,
прогнать `npx playwright test --project=fixture-check`, затем работать по разделу
«Порядок реализации» плана.
