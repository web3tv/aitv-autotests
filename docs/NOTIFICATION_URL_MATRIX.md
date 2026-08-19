# Матрица покрытия: целевые URL уведомлений

Составлена 19.08.2026 при разборе бага
[W3-2923](https://stretch-com.atlassian.net/browse/W3-2923) (клик по уведомлению об эпизоде
открывает «This page isn't available»).

**Ось матрицы:** тип уведомления × тип контента. **Проверка в каждой ячейке одна:**
кликнуть по уведомлению и убедиться, что открылся правильный URL — плюс якорь комментария
там, где он есть.

Живой статус кейсов ведётся в `TEST_COVERAGE.md`, раздел
«NOTIFICATION TARGET URLS». Здесь — контекст, почему матрица именно такая.

## Матрица

| ID | Тип уведомления | Контент | Ожидаемый URL | Статус |
|---|---|---|---|---|
| NOTIF-POPUP-011 | video released | видео | watch URL видео | 🟢 покрыт |
| NOTIF-URL-001 | commented / replied | видео | `/video/{cat}/{slug}?comment={id}` | 🟡 `seedCommentReplies()` |
| NOTIF-URL-002 | commented / replied | **эпизод** | watch URL эпизода + якорь | 🔴 `setupSeriesWithEpisodes()` + `CommentsApi` |
| NOTIF-URL-003 | commented / replied | шортс | `/short/shorts/{slug}?comment={id}` | 🟡 `seedCommentReplies()` на шортсе |
| NOTIF-URL-004 | video released | **эпизод** | watch URL эпизода | 🔴 `setupSeriesWithEpisodes()`, долгий транскод |
| NOTIF-URL-005 | video released | шортс | `/short/shorts/{slug}` | 🟡 сейчас только вручную |
| NOTIF-URL-006 | ai metadata generated | видео | `/studio/content?edit={videoId}` | 🟡 проверяется только доставка |
| NOTIF-URL-007 | chapters generated | видео | `/studio/content?edit={videoId}` | 🟡 доставка есть (CHAP-002), клик нет |
| NOTIF-URL-008 | followed your channel | канал | URL канала, **не** `/studio` | 🟠 нужен триггер крона или строка в БД |
| NOTIF-URL-009 | liked your video | видео / эпизод | watch URL | 🟠 то же |
| NOTIF-URL-010 | liked your comment | видео / эпизод | watch URL + якорь | 🟠 то же |
| NOTIF-URL-013 | live stream started | стрим | `/livestream/{id}` | 🟡 `POST /live-streams/` + `PUT /live-streams/status` |
| NOTIF-URL-012 | channel transfer | канал | `/@{channelHandleName}` | ⛔ ончейн-передача NFT-хендла |
| NOTIF-URL-011 | rec_video | — | — | ⚪ типа нет на бэке, мёртвая ветка во фронте |

🟢 покрыто · 🟡 пишется сейчас как есть · 🔴 сломано в W3-2923, пишется сейчас ·
🟠 после разблокировки триггера · ⛔ заблокировано · ⚪ тестировать нечего

**Итого 13 строк:** 1 покрыта, 7 берутся в работу сразу, 3 — после появления способа
дёрнуть агрегирующий крон, 1 заблокирована, 1 не существует.

## Как фронт строит ссылку

`lib/layouts/Header/Notifications/Notification/Notification.tsx` — свой URL на каждый тип.
Шесть типов используют шаблон `/{payload.type}/{category}/{slug}`, где `payload.type` —
сырой енам бэка (`video` / `short` / `episode`). Реальных роутов только два — `/video/...`
и `/short/...`, поэтому любой эпизод даёт несуществующий `/episode/...` → 404.

Follow-уведомления (`CHANNEL_SUBSCRIPTION`) URL не строят вовсе — там захардкожен `/studio`.

Канонический хелпер `lib/utils/getVideoWatchUrl.ts` (`getVideoWatchPath()`) умеет
3-сегментный путь эпизода, но уведомления его не используют — см. обсуждение единой точки
входа в `~/.claude/plans/typed-wandering-quail.md`.

## Что нужно знать при написании тестов

- **Эталонный URL брать из хелпера, а не собирать в тесте.** `setupSeriesWithEpisodes()`
  (`src/utils/studioTestHelpers.ts`) возвращает `episodes[].watchUrl` — готовое ожидаемое
  значение. Для обычного видео то же даёт `setupVideoViaApi().videoUrl`.
- **2-сегментная форма эпизода допустима.** `/video/{category}/{episode-slug}` фронт
  редиректит на канонический 3-сегментный URL и сохраняет query (проверено на dev2 и prod).
  Ассерт лучше делать по конечному URL после редиректа.
- **Почему 🟠 у follow и лайков.** С W3-2848 эти уведомления собирает часовой крон
  `notifications:aggregate-grouped --hours=N`. Команда умеет переобработать произвольное
  окно, но прав `pods/exec` в кластере у QA нет. Два пути: попросить бэк повесить триггер
  на служебный эндпоинт, либо (для этих строк достаточно) вписать строку уведомления прямо
  в БД и проверить только целевой URL — продюсера эти кейсы не тестируют.
- **NOTIF-POPUP-007 закрепляет баг.** Существующий `test.fixme` ожидает переход на
  `/studio` по клику на follow-уведомление — это ровно то, что W3-2923 объявил дефектом.
  При фиксе тест надо переписать на URL канала, а не просто снять `fixme`.
