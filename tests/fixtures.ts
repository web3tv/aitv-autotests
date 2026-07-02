import { test as base, request as pwRequest } from '@playwright/test';
import { setupVideoViaApi, VideoSetupResult } from '../src/utils/studioTestHelpers';
import { setupSeededAnalytics, SeededAnalytics } from '../src/utils/analyticsSeed';

/**
 * Расширенный `test` с переиспользуемыми ресурсами.
 *
 * `publishedVideo` — worker-scoped: публичное видео создаётся через API ОДИН РАЗ
 * на воркер и переиспользуется всеми тестами файла. Подходит для веера
 * read-only проверок (видео открывается по ссылке, видно на канале, метаданные
 * корректны и т.п.) — дорогая загрузка не повторяется под каждый тест.
 *
 * ВАЖНО: переиспользуй только для проверок, которые НЕ меняют видео/канал.
 * Если тесту нужно мутировать ресурс (удалить, сменить privacy, добавить главу) —
 * создавай свой ресурс внутри теста (через setupVideoViaApi), не трогай фикстуру.
 */
type WorkerFixtures = {
  publishedVideo: VideoSetupResult;
};

/**
 * `seededAnalytics` — test-scoped: prepares (via API + DB) a channel with one processed
 * video and a full spread of analytics data (views/likes/comments/subscribers), and
 * returns the owner credentials + expected totals. A consuming test just logs in as
 * `seededAnalytics.owner` and asserts against `seededAnalytics.totals`.
 *
 * Requires DB access (the `@db` port-forward from CLAUDE.md).
 */
type TestFixtures = {
  seededAnalytics: SeededAnalytics;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  publishedVideo: [
    async ({}, use, workerInfo) => {
      const ctx = await pwRequest.newContext();
      const video = await setupVideoViaApi(ctx, {
        privacySetting: 'public',
        title: `Fixture_w${workerInfo.workerIndex}_${Date.now()}`,
        waitForProcessing: true,
      });
      await use(video);
      await ctx.dispose();
    },
    { scope: 'worker' },
  ],

  seededAnalytics: async ({ request }, use) => {
    const data = await setupSeededAnalytics(request);
    await use(data);
  },
});

export { expect } from '@playwright/test';
