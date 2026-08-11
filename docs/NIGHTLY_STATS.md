# Nightly Stats — учёт падений ночных ранов

Ведёт скилл **`/morning-report`**: каждое утро дописывает сюда блок по каждому ночному
рану — **Nightly Regression** (dev2) и **Prod Smoke** (prod). Цель — видеть, какие тесты
нестабильны во времени, и отделять баги приложения от проблем тестов.

**Как читать (сигнал качества):** grep по `file:line` теста — сколько раз он всплывал и
с какой категорией.
- Часто повторяющийся **[TEST/FLAKY]** → тест нестабильный, чинить или парковать.
- Повторяющийся **[NEEDS CHECK]** → скорее всего баг приложения / деградация стенда, а не тест.
- **[KNOWN]** → уже в триаже (см. память `pending-stand-failures.md`).

Категории: **[NEEDS CHECK]** похоже на баг приложения · **[TEST/FLAKY]** проблема теста/инфры ·
**[KNOWN]** уже в триаже. Флейк = упал, но прошёл на ретрае (ран при этом зелёный).

Новые записи — **сверху**. Один блок = один прогон. Зелёные раны тоже фиксируем (строкой
со счётчиками), чтобы был знаменатель для оценки стабильности.

---

## 2026-07-24

**Nightly Regression (dev2)** — ❌ failure · [run #30063059974](https://github.com/web3tv/aitv-autotests/actions/runs/30063059974)
Passed 104 · Failed 22 · Flaky 0 · Skipped 28 · _(данные: лог-fallback, results.json в артефакте нет)_
- `search/globalSearch.spec.ts:36,57,79,104,130,151,172,203,224,250,274,303,324,352,372,391,417,437,467,492,527` — **[TEST/FLAKY]** — все 21 тест файла, одна сигнатура: `getByTestId('aitv-search-open')` не найден. Проверено вживую на dev2: поиск переделан с модалки на отдельную страницу — в хедере теперь `<a data-id="aitv-header-search" href="/search">`, страница `/search` с `data-id="search-video-preview"`/`more-button`; заодно новый топ-нав `aitv-top-nav` (home/series/movies/shorts). Сьют W3-2692 + SearchModal POM устарели целиком → переписывать под новую страницу
- `content/manage/studioSearch.spec.ts:11` — **[TEST/FLAKY]** — «Test timeout of 90000ms exceeded» (обе попытки, точка смерти плавает: legacy-login / studio-videos). Разобрано по таймстемпам: перегруза бэка нет (2 воркера, параллельно шёл один тест, соседние STUDIO-018/019 прошли) — STUDIO-017 грузит 2 видео с `waitForProcessing` под дефолтные 90s, на медленном dev-транскоде не влезает. Та же причина у падений 15–17.07. Фикс: `test.setTimeout(240_000)` (ветка `fix/studio-017-timeout`)

**Prod Smoke (prod)** — ✅ success · [run #30056800573](https://github.com/web3tv/aitv-autotests/actions/runs/30056800573)
Passed 5 · Skipped 2 · Failed 0

## 2026-07-17

**Nightly Regression (dev2)** — ❌ failure · [run #29551291216](https://github.com/web3tv/aitv-autotests/actions/runs/29551291216)
Passed 87 · Failed 9 · Flaky 0 · Skipped 28 · _(данные: лог-fallback, results.json в артефакте нет)_
- `account/account.spec.ts:7` — **[NEEDS CHECK]** — «Edit password button» не найдена на account-странице (AccountPage:99), оба раза
- `account/account.spec.ts:114` — **[NEEDS CHECK]** — `oldEmail` не найден (AccountPage:167), оба раза
- `account/account.spec.ts:165` — **[NEEDS CHECK]** — `oldEmail` не найден (AccountPage:167), оба раза
- `account/account.spec.ts:264` — **[NEEDS CHECK]** — `displayedEmail` не найден (AccountPage:78), оба раза
- `auth/walletAuth.spec.ts:43` — **[NEEDS CHECK]** — `walletAddress` не виден на account-странице (:82), оба раза
- `auth/walletAuth.spec.ts:63` — **[NEEDS CHECK]** — `addWalletBtn` не виден (:88), оба раза
- `auth/walletAuth.spec.ts:135` — **[NEEDS CHECK]** — `addEmailInput` не виден (:156), оба раза
- ↑ все 7 — один системный корень: элементы account/security-страницы отсутствуют на dev2 (вероятно редизайн/регрессия страницы), не чинить тесты вслепую
- `content/manage/studioSearch.spec.ts:11` — **[NEEDS CHECK]** — `/content` waitForResponse 90s timeout, «Studio content is not visible»; **3-ю ночь подряд** (та же сигнатура 15.07 и 16.07)
- `player/seriesPlayback.spec.ts:36` — **[NEEDS CHECK]** — «Episodes button is not visible» в плеере (:141), оба раза

**Prod Smoke (prod)** — ❌ failure · [run #29545475810](https://github.com/web3tv/aitv-autotests/actions/runs/29545475810)
Passed 2 · Skipped 2 · Failed 3
- `production/prodSmoke.spec.ts:10` — **[NEEDS CHECK]** — «Email/username input is not visible» на странице логина (LoginPage:143), оба раза
- `production/prodSmoke.spec.ts:48` — **[NEEDS CHECK]** — то же (падает на логине перед загрузкой), оба раза
- `production/prodSmoke.spec.ts:78` — **[NEEDS CHECK]** — то же (падает на логине перед плеером), оба раза
- ↑ все 3 — один корень: инпут email/username не виден на login-странице prod; **вчера (16.07) prod был зелёный** → свежая регрессия/инцидент на проде

## 2026-07-16

**Nightly Regression (dev2)** — ❌ failure · [run #29467900498](https://github.com/web3tv/aitv-autotests/actions/runs/29467900498)
Passed 94 · Failed 1 · Flaky 1 · Skipped 27 · _(данные: лог-fallback, results.json в артефакте нет)_
- `content/manage/studioSearch.spec.ts:11` — **[NEEDS CHECK]** — `/api/videos/studio-videos` 90s timeout (ретрай упал уже на `/api/auth/legacy-login`); **2-ю ночь подряд**, та же сигнатура что 15.07
- flaky `api/videoChapters.spec.ts:40` — `beforeAll` hook timeout 600s (обработка видео), прошёл на ретрае; вчера падал оба раза, сегодня флейк

**Prod Smoke (prod)** — ✅ success · [run #29462035942](https://github.com/web3tv/aitv-autotests/actions/runs/29462035942)
Passed 5 · Skipped 2 · Failed 0

## 2026-07-15

**Nightly Regression (dev2)** — ❌ failure · [run #29385416161](https://github.com/web3tv/aitv-autotests/actions/runs/29385416161)
Passed 89 · Failed 3 · Flaky 2 · Skipped 27
- `api/videoChapters.spec.ts:40` — **[NEEDS CHECK]** — video processing timed out (48 attempts), оба раза
- `content/manage/studioSearch.spec.ts:11` — **[NEEDS CHECK]** — `/api/videos/studio-videos` 90s timeout, `/content` не загрузился
- `player/videoPlayer.spec.ts:27` — **[TEST/FLAKY]** — strict-mode: `.swiper-slide-active .vjs-playing` → 2 элемента
- flaky `api/videoChapters.spec.ts:106` — processing timeout (24 attempts), прошёл на ретрае
- flaky `player/embedPlayer.spec.ts:5` `@critical` — `waitForFunction` readyState timeout 5s, прошёл на ретрае

**Prod Smoke (prod)** — ✅ success · [run #29379480326](https://github.com/web3tv/aitv-autotests/actions/runs/29379480326)
Passed 5 · Skipped 2 · Failed 0
