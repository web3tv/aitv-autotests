# Аудит дорогого setup и план перехода на Playwright fixtures

Документ — результат аудита всех спеков проекта на предмет дублирования дорогого setup
(загрузка видео, создание юзеров, seed в БД) и рекомендации по переиспользованию
ресурсов через Playwright **worker-scoped fixtures**.

## TL;DR

- **Проект уже хорошо оптимизирован.** «Наивных дублей» (несколько read-only тестов
  грузят одно и то же видео по отдельности) почти нет.
- Дорогой setup уже либо **изолирован намеренно** (auth/validation — свой юзер на тест),
  либо **шарится через `beforeAll`**, либо **статичен** (env-ресурсы).
- Поэтому **массовая миграция на fixtures даст мало выигрыша по скорости.** Главная
  ценность — **чистота кода**: убрать копипасту setup-boilerplate из ~6–9 файлов в
  единый типобезопасный источник; worker-fixture также переживает retry лучше `beforeAll`.

## Как worker-fixture ускоряет и стабилизирует

**Setup в каждом тесте:**
```
test1: [загрузка видео 90с] + проверка 3с = 93с
test2: [загрузка видео 90с] + проверка 3с = 93с
test3: [загрузка видео 90с] + проверка 3с = 93с
                                      ИТОГО ≈ 279с, 3 точки флаки на загрузке
```
**worker-scoped fixture (setup один раз):**
```
[загрузка видео 90с ОДИН раз на воркер]
  test1: 3с   test2: 3с   test3: 3с
                                      ИТОГО ≈ 99с, 1 точка флаки
```
Подтверждено на образце `tests/studio/publishedVideo.example.spec.ts`: 3 теста, видео
загружено **1 раз** — 37.8с вместо ~105с при дублировании.

- **Ускоряет:** дорогой setup выполняется 1 раз, а не N.
- **Стабилизирует:** дорогих операций (где рвётся TLS, ловится 429, не доходит
  обработка) в N раз меньше → меньше поводов для флаки.
- **Не ломает изоляцию:** переиспользовать можно только то, что тесты **читают**, не меняют.

## Сводная классификация спеков

| Категория | Спеки | Вердикт |
|---|---|---|
| Изоляция by design | весь `auth/*`, `validation/*`, `user.fixme/profile,account` | LEAVE — свой юзер на тест обязателен |
| Уже `beforeAll` (1 ресурс на describe) | `videoVisibility` (4×), `subscription/authPopup` (paid), `subscription/paidSubsStatus`, `visualSuite/*/videoChannelVisual`, `aitvVisual` | OK; опц. → fixture ради чистоты (не скорости) |
| Статичные env | `embedPlayer`, `prodSmoke` | OK |
| Pure API (дёшево) | `videoCategories` | OK |
| Mutating / уникальные данные | `comingSoonEmail`, `channel`, `uploadVideoUI`, `studioSearch`, `analytics.fixme`, `nft.fixme` | LEAVE — у каждого теста свой ресурс/данные |
| Реальные кандидаты на fixture | `subscription/paidSubsStatus` + `authPopup` (video+DB), `notifications.fixme` (user-pair) | см. «Что делать» |

## Важные нюансы (на чём легко ошибиться)

- **`scope: 'worker'` обязателен.** `test.extend` без указания scope создаёт ресурс
  **на каждый тест** (test-scoped) и не даёт никакой экономии. Для переиспользования —
  только `{ scope: 'worker' }`.
- **`videoPlayer.spec.ts`** — НЕ кандидат: два теста грузят **разные** ресурсы (видео и
  short, по одному использованию), шаринг не помогает.
- **`studioSearch` / `uploadVideoUI`** — НЕ кандидаты: тесты используют **разные** видео
  и данные (уникальный description, размеры файлов). Общая фикстура исказит логику.
- **`beforeAll`-кейсы уже грузят ресурс 1 раз на describe** в том же воркере — миграция
  на worker-fixture их **не ускоряет**, выигрыш только в чистоте/переиспользовании между
  describe и переживании retry.

## Когда что (шпаргалка по тест-дизайну)

- **Веер независимых read-only проверок над одним ресурсом** → worker-fixture, отдельные `test()`.
- **Причинно-следственная цепочка с мутацией состояния** (upload → publish → email) →
  один `test()` + `test.step` (или `describe.serial`).
- **Тест меняет ресурс** (delete/edit/privacy/DB-mutation, не восстанавливая) → свой ресурс в тесте.
- **Проверка изоляции** (auth/регистрация/валидация) → свой юзер на тест, НЕ шарить.

Правило «один тест = одна проверка» — про **одну причину падения**, а не про повторный
setup. Дорогой ресурс строй один раз; не перезагружай видео под каждую проверку.

## Что делать (рекомендованный набор фикстур)

### 1. `publishedVideo` (worker) — есть
Read-only веер над публичным видео. Файл `tests/fixtures.ts`. Образец использования —
`tests/studio/publishedVideo.example.spec.ts`.

### 2. `paidVideo` (worker) — для `subscription/*`
Фикстура грузит видео `privacySetting: 'paid'` один раз; **мутацию статуса подписки тест
делает сам** (`DatabaseHelper.setActiveSubscription` / `expireSubscription`), потому что
каждый тест проверяет своё состояние. Это и есть паттерн «дорогой общий ресурс + мутация в тесте»:

```ts
// fixture (worker): дорогой общий ресурс
paidVideo: [async ({}, use) => {
  const ctx = await pwRequest.newContext();
  const setup = await setupVideoViaApi(ctx, {
    privacySetting: 'paid',
    subscriptionOptions: { title: 'Plan', description: 'desc', price: '0.99' },
  });
  await use(setup);
  await ctx.dispose();
}, { scope: 'worker' }],

// тест: мутация состояния — своя на каждый тест, поверх общего видео
test('expired subscriber sees paywall', async ({ page, paidVideo }) => {
  const db = new DatabaseHelper();
  await db.connect();
  await db.expireSubscription(paidVideo.user.email); // мутация изолирована в тесте
  await db.disconnect();
  // ...read-only проверки UI...
});
```

### 3. `creatorWithSubscriber` (worker) — на будущее
Для `notifications.fixme` (2 юзера + видео + подписка), когда сьют разблокируют.

### Не трогать
`auth/*`, `validation/*` (изоляция), `prodSmoke` (env), все `*.fixme`, mutating-сьюты
(`channel`, `comingSoonEmail`, `uploadVideoUI`, `studioSearch`).

## План миграции (поэтапно, без «большого взрыва»)

1. **Этап 0 — инфраструктура (готово).** `tests/fixtures.ts` с `test = base.extend(...)`,
   worker-scoped. Спеки импортируют `test`/`expect` отсюда.
2. **Этап 1 — классифицировать** (эта таблица).
3. **Этап 2 — добавить `paidVideo`** и перевести `subscription/paidSubsStatus` + `authPopup`
   (paid) с `beforeAll` на фикстуру; мутации БД оставить в тестах. Прогнать.
4. **Этап 3 — по потребности** добавлять фикстуры (`creatorWithSubscriber` и т.п.).
5. **Этап 4 — теги и правило.** Дорогие e2e → `@slow`/`@db`, вне `@critical`. Зафиксировать
   в CLAUDE.md правило: «дорогой ресурс — fixture для веера read-only; serial-journey для
   причинной цепочки; не дублировать дорогой setup; для шаринга обязателен `scope: 'worker'`».

## Метрики аудита

- Спек-файлов: ~20 (без учёта `*.fixme` — меньше активных).
- Дорогой setup (видео/2 юзера/mail/seed): ~9 файлов.
- Реальных кандидатов на новые фикстуры: 2–3 (video+DB для subscription, user-pair для notifications).
- Большинство остального — намеренная изоляция или уже `beforeAll`/env (трогать не нужно).
