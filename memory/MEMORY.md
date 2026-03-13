# Project Memory: web3tv-autotests

## Patterns & Conventions

### test.describe.serial → single test with test.step
When rewriting `test.describe.serial` blocks into a single test:
- Use `test()` + `test.step()` for each logical step
- Share state via `let` variables declared at the top of the test
- Add explicit logout at the end of every step that leaves the user logged in — required because all steps share the same `page` instance
- Before steps that call `loginSuccess`/`loginFailed`/`loginWith2Fa*`, the user must be logged out
- `loginFailed` steps do NOT need a preceding logout (the login attempt itself fails, user stays logged out)
- Add explicit `'Logout before anonymous checks'` step between upload and anonymous checks
- The last step (another user check) logs in as user2 directly — no explicit logout needed before it
- `description` is NOT declared for `Private video` (not used in assertions) and `Upload public short video`
- `Paid video` needs `await page.goto('/')` before uploadVideo (user is on membership page after creating plan)
- `test.describe.configure({ mode: 'parallel' })` is commented out when all tests are converted to single tests

### Chunk upload 500 assertion pattern
Extracted into `uploadWithChunkCheck(page, uploadFn)` helper in `content.spec.ts`:
```typescript
async function uploadWithChunkCheck(page: Page, uploadFn: () => Promise<void>): Promise<void> {
    let chunkError: string | null = null;
    const listener = (response: import('@playwright/test').Response) => {
        if (response.url().includes('chunk') && response.status() === 500) {
            chunkError = `Chunk upload failed with 500: ${response.url()}`;
        }
    };
    page.on('response', listener);
    await uploadFn();
    page.off('response', listener);
    expect(chunkError, chunkError ?? '').toBeNull();
}
```

### Setup user with public channel pattern
Extracted into `setupUserWithPublicChannel(page, request)` helper in `content.spec.ts` — creates user via API, logs in, sets channel privacy to public.

### page.goto — никогда не использовать waitUntil: 'networkidle'
Видео-страницы постоянно шлют сетевые запросы (стриминг, плеер), поэтому `networkidle` никогда не наступает и тест падает по таймауту.
Всегда использовать `waitUntil: 'domcontentloaded'`:
```typescript
await page.goto(url, { waitUntil: 'domcontentloaded' });
```

### waitForResponse — устанавливать ДО триггера действия
`page.waitForResponse` должен быть вызван ДО действия, которое вызывает запрос (иначе — race condition):
```typescript
const responsePromise = page.waitForResponse(r => r.url().includes('/api/...') && r.status() === 200, { timeout: 40000 });
await someAction(); // триггерит запрос
await responsePromise;
```

### .MOV файлы — явный MIME-тип при setInputFiles
В CI `.MOV` иногда определяется с неправильным MIME-типом. Передавать явно:
```typescript
await uploadVideoButton.setInputFiles({ name: 'shortsVideo.MOV', mimeType: 'video/quicktime', buffer: fs.readFileSync(path) });
```
`UploadVideoPage.uploadVideo(path, mimeType?)` поддерживает опциональный второй параметр.

### VideoPlayerPage — проверка плеера
- `assertPlayerVisible()` — проверяет что плеер отрендерился (используется в content/subscription тестах для проверки доступности видео)
- `assertVideoIsPlaying()` — полная проверка воспроизведения: клик play → vjs-playing → currentTime двигается → прогресс-бар двигается (используется в videoPlayer.spec.ts)
- `assertShortsIsPlaying()` — проверка шортсов: клик по `.swiper-slide-active .vjs-big-play-button` → ждёт `.swiper-slide-active .vjs-playing` → проверяет currentTime активного слайда. Шорты НЕ автоплеят, нужен явный клик. Прогресс-бар не проверяется (может отсутствовать).

### Shorts player — особенности
- На странице шорта в DOM всегда два `video.vjs-tech` (два swiper slide), нужно таргетить `.swiper-slide-active`
- Видео НЕ автоплеит — статус `vjs-paused` при загрузке
- Локаторы для шортсов: `.swiper-slide-active .vjs-big-play-button`, `.swiper-slide-active video.vjs-tech`, `.swiper-slide-active .vjs-playing`

### page.evaluate — async/await не работает для таймеров
`await new Promise(res => setTimeout(res, N))` внутри `page.evaluate` не блокирует реальное время. Для паузы использовать `page.waitForTimeout()` на стороне Node.js, а `currentTime` читать двумя отдельными `evaluate`.

### Проверка написанных тестов через Playwright MCP
После написания любого нового теста — ОБЯЗАТЕЛЬНО запускать его через `mcp__web3tv-playwright__run_test` для проверки что тест проходит. Не ограничиваться `--list` (компиляция), а именно запускать выполнение.

## Key Files
- `tests/auth/auth.spec.ts` — Authentication tests
- `tests/user/user.spec.ts` — Account settings tests (password, email, avatar, 2FA)
- `tests/subscription/subscriptionPlan.spec.ts` — Subscription & paid content
- `tests/hero/heroIntegration.spec.ts` — HERO integration
- `tests/studio/content.spec.ts` — video upload/visibility tests (Public, Private, Paid, Unlisted, Shorts)
- `tests/studio/videoPlayer.spec.ts` — video player playback test
- `src/flows/UploadVideoFlow.ts` — upload orchestration
- `src/flows/AuthFlow.ts` — login/logout (`authFlow.logout()`)
- `src/pages/components/SideBarPage.ts` — sidebar navigation
- `src/pages/components/UploadVideoPage.ts` — upload page POM (was UploadVideoPagel.ts, typo fixed)
- `src/pages/components/VideoPlayerPage.ts` — video player POM (`assertPlayerVisible`, `assertVideoIsPlaying`)

# currentDate
Today's date is 2026-03-13.
