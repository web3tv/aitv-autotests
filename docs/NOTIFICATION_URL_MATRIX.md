# Матрица покрытия: целевые URL уведомлений

Составлена 19.08.2026 при разборе бага
[W3-2923](https://stretch-com.atlassian.net/browse/W3-2923) (клик по уведомлению об эпизоде
открывает «This page isn't available»). Обновлена 21.08.2026 после ручной проверки фикса.

**Ось матрицы:** тип уведомления × тип контента. **Проверка в каждой ячейке одна:**
кликнуть по уведомлению и убедиться, что открылся правильный URL — плюс якорь комментария
там, где он есть.

Живой статус кейсов ведётся в `TEST_COVERAGE.md`, раздел
«NOTIFICATION TARGET URLS». Здесь — контекст, почему матрица именно такая.

## Статус фикса W3-2923 (проверено вручную 21.08.2026, dev2)

Фикс только на фронте: коммит `c41c85026` «Fix notification links for episodes, follows and
streams» (ветка `W3-2923/valentindk/fix-notification-target-urls`), на dev2 выкачен образ
`frontend2: 0.0.0-w3-2923-notification-urls-aitv`. Бэк не менялся: payload по-прежнему без
`seriesSlug`, у follow — без `channelHandleName` (фронт берёт `payload.channelName`, а в
сгруппированном follow это и есть handle — `hh.name AS channel_name` в
`GroupedNotificationReadRepository`).

Проверено под `subscriber2` на `/notifications` (все href + реальные переходы):

| Тип | payload | href, который строит фронт | Результат клика |
|---|---|---|---|
| comment_reply (эпизод) | `type=episode, category=animation, slug=ewfwefewfewf-tqfo, commentId` | `/video/animation/ewfwefewfewf-tqfo?comment={id}` | 301 → `/video/animation/{series-slug}/ewfwefewfewf-tqfo?comment={id}`, страница эпизода открыта; `?comment` фронт сам снимает после подсветки (`useHighlightedCommentParam`) |
| video_like (эпизод) | `type=episode, category=education, slug=erferferf-t5j1` | `/video/education/erferferf-t5j1` | редирект на 3-сегментный URL ✅ |
| video_release (эпизод) | `type=episode, category=kids-family, slug=days-e8-wz43` | `/video/kids-family/days-e8-wz43` | → `/video/kids-family/days-1rw8/days-e8-wz43` ✅ |
| video_release (short) | `type=short, category=shorts, slug=…-3g26` | `/short/shorts/…-3g26` | страница шортса ✅ |
| comment_reply / video_like (видео) | `type=video` | `/video/{cat}/{slug}[?comment=]` | ✅ |
| channel_subscription (follow) | `channelName=boostvideos` | `/@boostvideos` (было `/studio`) | страница канала ✅ |
| chapters_generation_success | `videoId` | `/studio/content?edit={videoId}` | ✅ (без изменений) |

Что ещё изменил фикс (важно для тестов):
- Ссылка строится через общий `buildAssociatedVideoUrl` (`/video|/short` + `category ?? 'uncategorized'`
  + slug). Для эпизода фронт отдаёт **2-сегментный** URL и полагается на редирект в канонический
  3-сегментный — ассерт делать по **конечному** URL после редиректа (`episodes[].watchUrl`).
- `comment_like` получил якорь `?comment={commentId}` (раньше его не было).
- Live-стрим: `/live/{id}` (раньше `/livestream/{id}`, такого роута нет).
- Если в payload нет нужных полей (slug / handle / id) — строка рендерится **без ссылки**
  (`<div data-testid="notification-item">`), иначе `<a data-testid="notification-link" href=…>`.
  Это новые стабильные локаторы для `NotificationsPopupPage` / страницы `/notifications`.
- В студии (`isStudio`) внешняя ссылка кликается через `window.location.assign` после отправки
  события `clicked`; на основном домене — обычный `next/link`.

## Типы уведомлений на бэке: как и когда отправляются

Источник: `src/Entity/Enums/NotificationType.php`, `MessageHandler/NotificationHandler.php`,
`Command/Notification/AggregateGroupedNotificationsCommand.php`,
`.infrastructure/docker/php/cron/crontab` (api-symfony, master на 21.08.2026).

| Тип (enum) | Доставка | Триггер / продюсер | Можно засеять в тесте синхронно? |
|---|---|---|---|
| `comment_reply` | **синхронно** (messenger `NotificationHandler`) | `NotificationManager::sendCommentNotification` — комментарий/ответ (владельцу видео и автору родительского коммента) | ✅ `CommentsApi.createComment` → приходит сразу |
| `video_release` | синхронно при публикации | `sendVideoReleaseNotification` из `video:publishing:update` (крон `* * * * *`, раз в минуту) после транскода — фолловерам канала | ✅ но ждать транскод (минуты) |
| `live_stream` | синхронно | `sendLiveStreamNotification` при старте стрима | ✅ `POST /live-streams/` + `PUT /live-streams/status` |
| `ai_metadata_success` / `ai_metadata_failed` | синхронно | AI-пайплайн после загрузки | ⏳ приходит по окончании обработки (как CHAP-002) |
| `chapters_generation_success` | синхронно | генерация глав | ⏳ то же |
| `channel_transfer_sent` / `_received` | синхронно (`ChannelTransferredNotificationSendHandler`) | ончейн-передача NFT-хендла | ⛔ нет REST-триггера |
| `channel_subscription` (follow) | **раз в час кроном** `0 * * * * notifications:aggregate-grouped` — окно = предыдущий астрономический час (`end = начало текущего часа`, `start = end - N часов`) | группировка подписок `ChannelSubscriptionGroup` | ❌ событие в 10:05 → уведомление в 11:00; прав `pods/exec` у QA нет |
| `video_like` | **раз в час кроном** (то же) | `VideoLikeGroup` | ❌ |
| `comment_like` | **раз в час кроном** (то же) | `CommentLikeGroup` | ❌ |
| `paid_subscription` / `paid_channel_subscription` | синхронно | платный функционал — **убран из продукта** (19.08.2026) | ⚪ продюсера в продукте нет |
| `recommended_video`, `promotion_offering`, `email_subscription_activity` | — | нигде не отправляются (только в enum) | ⚪ нечего тестировать |

Вывод для автотестов: **follow / video_like / comment_like нельзя дождаться в функциональном
ране** (до 60 минут). Для них проверяем только URL по строке, вписанной в БД (`@db`), либо просим
бэк повесить триггер `aggregate-grouped --hours=1` на служебный эндпоинт.

## Матрица

| ID | Тип уведомления | Контент | Ожидаемый URL (после фикса) | Статус |
|---|---|---|---|---|
| NOTIF-POPUP-011 | video released | видео | watch URL видео | 🟢 покрыт |
| NOTIF-URL-001 | commented / replied | видео | `/video/{cat}/{slug}?comment={id}` | 🟡 `seedCommentReplies()` |
| NOTIF-URL-002 | commented / replied | **эпизод** | `/video/{cat}/{series}/{ep}` (после редиректа) + якорь | 🟡 фикс проверен вручную, пишем |
| NOTIF-URL-003 | commented / replied | шортс | `/short/shorts/{slug}?comment={id}` | 🟡 `seedCommentReplies()` на шортсе |
| NOTIF-URL-004 | video released | **эпизод** | `/video/{cat}/{series}/{ep}` | 🟡 фикс проверен вручную, пишем (долгий транскод) |
| NOTIF-URL-005 | video released | шортс | `/short/shorts/{slug}` | 🟡 |
| NOTIF-URL-006 | ai metadata generated | видео | `/studio/content?edit={videoId}` | 🟡 |
| NOTIF-URL-007 | chapters generated | видео | `/studio/content?edit={videoId}` | 🟡 |
| NOTIF-URL-008 | followed your channel | канал | `/@{channelName}` (было `/studio`) — вручную ✅ | 🟠 почасовой крон → `@db`-строка |
| NOTIF-URL-009 | liked your video | видео / эпизод | watch URL — вручную ✅ | 🟠 почасовой крон → `@db`-строка |
| NOTIF-URL-010 | liked your comment | видео / эпизод | watch URL + `?comment={id}` (новое) | 🟠 почасовой крон → `@db`-строка |
| NOTIF-URL-013 | live stream started | стрим | `/live/{id}` (было `/livestream/{id}`) | 🟡 `POST /live-streams/` + `PUT /live-streams/status` |
| NOTIF-URL-012 | channel transfer | канал | `/@{channelHandleName}` (поле в payload есть — `buildChannelTransferPayload`) | ⛔ ончейн-передача NFT-хендла |
| NOTIF-URL-011 | rec_video | — | — | ⚪ типа нет на бэке, мёртвая ветка во фронте |

🟢 покрыто · 🟡 пишется сейчас · 🟠 только URL по `@db`-строке (триггера нет) ·
⛔ заблокировано · ⚪ тестировать нечего

## План автотестов (после фикса)

Новый спек `tests/notifications/notificationTargetUrls.spec.ts`; проверка идёт на странице
`/notifications` (там видны все уведомления, включая прочитанные; поповер показывает только
непрочитанные и авто-помечает их seen при открытии — W3-2785). Общий паттерн кейса:

1. seed через API → `waitForNotification(request, token, n => n.type === … && n.payload.slug === …)`;
2. логин, `/notifications`, взять `a[data-testid="notification-link"]` нужной строки;
3. `expect(link).toHaveAttribute('href', expectedHref)` — href до клика (ловит сам баг без сети);
4. клик → `page.waitForURL(url => url.pathname === expectedPath)` — **конечный** путь после
   редиректа; для эпизодов `expectedPath` = `new URL(episodes[i].watchUrl).pathname`;
5. для комментариев — проверить `?comment={id}` в href (шаг 3) и подсвеченный комментарий на
   странице; **не** ждать `?comment` в финальном URL — фронт снимает параметр сразу после
   подсветки (`useHighlightedCommentParam.clearCommentParam`).

| Очередь | Кейсы | Что нужно добавить |
|---|---|---|
| 1 — ловят баг | NOTIF-URL-002, 004 | `setupSeriesWithEpisodes()` (уже есть), `CommentsApi.createComment` на эпизоде; 004 — фолловер + `enableReleaseNotifications` + ожидание `video_release` как в NOTIF-POPUP-011 (таймаут 420 с) |
| 2 — дёшево | NOTIF-URL-001, 003, 005 | `seedCommentReplies()` расширить опцией `videoType: 'short'` (или `filePath` вертикального видео); 005 — упрощённый клон 011 на шортсе |
| 3 | NOTIF-URL-006, 007 | после `setupVideoViaApi` дождаться `ai_metadata_success` / `chapters_generation_success` (как CHAP-002), кликнуть → `/studio/content?edit=` — можно объединить в один тест с 2 шагами |
| 4 | NOTIF-URL-013 | `LiveStreamApi` (новый): `POST /live-streams/`, `PUT /live-streams/status` → `/live/{id}` |
| 5 — `@db` | NOTIF-URL-008, 009, 010 | `DatabaseHelper.insertNotification(userId, type, payload)` с payload как у крона (`channelName` = handle; `type/category/slug[/commentId]`), проверка только href + переход; пометить `@db`; параллельно попросить бэк о служебном триггере крона |
| POM | — | `NotificationsPopupPage`/новый `NotificationsHistoryPage`: `links = page.getByTestId('notification-link')`, `rowLink(text)` |
| Переписать | NOTIF-POPUP-007 | ожидание `/studio` → `/@{handle}` канала владельца; остаётся fixme до появления `@db`-сидинга или триггера, затем снять |

Подводные камни: `category: null` даёт `/video/uncategorized/{slug}` — отдельный кейс не нужен,
но не падать на нём; строка без ссылки (`notification-item`) — допустимое состояние при неполном
payload, ассертить `notification-link` по тексту строки, а не по индексу.

## Как фронт строит ссылку (после фикса)

`lib/layouts/Header/Notifications/Notification/Notification.utils.ts`:
`buildNotificationWatchUrl(payload, {commentId})` → `buildAssociatedVideoUrl` (`/video|/short` +
`category ?? 'uncategorized'` + slug, `?comment=` по опции); `buildNotificationChannelUrl(handle)`
→ `/@{handle}`; `buildNotificationLiveStreamUrl` → `/live/{id}`; `buildNotificationStudioVideoUrl`
→ `/studio/content?edit={videoId}` (aitv) / `/studio/content/video/{videoId}`. Пустой результат →
строка без ссылки. Канонический 3-сегментный URL эпизода фронт **не** строит (нет `seriesSlug` в
payload) — полагается на редирект `/video/{cat}/{ep}` → `/video/{cat}/{series}/{ep}`.

## Что нужно знать при написании тестов

- **Эталонный URL брать из хелпера, а не собирать в тесте.** `setupSeriesWithEpisodes()`
  (`src/utils/studioTestHelpers.ts`) возвращает `episodes[].watchUrl` — готовое ожидаемое
  значение. Для обычного видео то же даёт `setupVideoViaApi().videoUrl`.
- **2-сегментная форма эпизода — это то, что фронт отдаёт.** Ассерт по конечному URL после
  редиректа.
- **Почему 🟠 у follow и лайков.** С W3-2848 эти уведомления собирает часовой крон
  `notifications:aggregate-grouped` (см. таблицу типов выше). Прав `pods/exec` в кластере у QA
  нет. Два пути: попросить бэк повесить триггер на служебный эндпоинт, либо вписать строку
  уведомления прямо в БД и проверить только целевой URL — продюсера эти кейсы не тестируют.
- **NOTIF-POPUP-007 закрепляет старое поведение.** Существующий `test.fixme` ожидает переход на
  `/studio` по клику на follow-уведомление — это ровно то, что W3-2923 объявил дефектом.
  Переписать на URL канала, а не просто снять `fixme`.
