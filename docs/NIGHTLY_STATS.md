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
