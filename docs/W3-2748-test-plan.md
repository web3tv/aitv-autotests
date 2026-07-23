# W3-2748 — План автоматизации: AITV попап уведомлений

**Jira:** https://stretch-com.atlassian.net/browse/W3-2748 («FE: Notification Popup Implementation»)
**Стенд:** dev2 (фича уже развёрнута). **Ветка автотестов:** `W3-2748-notifications-tests`.

> Важно: грумминг-комменты в Jira переписали исходные AC. Реальное поведение:
> плоский список с секциями **FOR YOU** / **MENTIONS** (никакой группировки по каналам);
> кнопка **«Mark all as read»** свипит все unseen → seen одним батчем и сразу сбрасывает бейдж;
> «Show older notifications» — отключённая заглушка.

## Скоуп

Новая папка **`tests/notifications/`**, спек `notificationsPopup.spec.ts`, проект `functional`
(desktop Chromium 1920×1080). Фича только для залогиненных — каждый тест создаёт своих юзеров,
фикстура `@qavischan` не трогается.

## Тест-кейсы (12)

| TC-ID | Название | Prio | Сидинг |
|---|---|---|---|
| NOTIF-POPUP-001 | Колокольчик открывает попап (заголовок «Notifications», Mark all / шестерёнка / Show older) | P1 | — |
| NOTIF-POPUP-002 | Попап закрывается по Escape и клику мимо | P1 | — |
| NOTIF-POPUP-003 | Свежий юзер: «You're all caught up», бейджа нет, Mark all disabled | P1 | — |
| NOTIF-POPUP-004 | 3 подписчика → бейдж «3», у каждого ряда синяя точка unread | P1 | 3 фоллоу через API |
| NOTIF-POPUP-005 | Секции: ответ на коммент → MENTIONS, подписка на канал → FOR YOU | P1 | коммент+ответ, фоллоу |
| NOTIF-POPUP-006 | Hover по ряду (100мс) → POST seen, точка исчезает | P2 | 1 фоллоу |
| NOTIF-POPUP-007 | Клик по ряду → POST clicked + навигация (channel_subscription → /studio) | P1 | 1 фоллоу |
| NOTIF-POPUP-008 | Mark all as read: один батч-POST, бейдж → 0, кнопка disabled, состояние живёт после reload | P1 | 4 фоллоу |
| NOTIF-POPUP-009 | Шестерёнка → страница /notifications | P2 | — |
| NOTIF-POPUP-010 | «Show older notifications» — всегда disabled (заглушка) | P2 | — |
| NOTIF-POPUP-011 | Канал из подписок загрузил видео → уведомление в FOR YOU, клик ведёт на видео | P1 | подписка + аплоад с транскодом (~2 мин) |
| NOTIF-POPUP-012 | 10 непрочитанных → бейдж «9+» | P3 | 10 фоллоу |

## Новая инфраструктура

- `SubscriptionApi.followChannel(token, channelId)` — `POST /subscriptions/` — **проверено вживую на dev2 (201, нотификация приходит)**
- `CommentsApi.createComment(token, {videoId, textOriginal, parentId?, channelId?})` — `POST /comments/` — **проверено вживую (comment_reply приходит)**
- `VideoApi.getNotifications(token, status?)` — добавить параметр `?status=unseen&maxResults=99`
- Хелпер `seedFollowers(request, channelId, n)` — насеять N подписчиков
- POM `src/pages/components/NotificationsPopupPage.ts` — колокольчик `aitv-header-notifications`, попап `#aitv-notifications-scroll-container`, `aitv-notifications-clear-all`, `notifications-settings`, `aitv-notifications-show-older`; ряды/секции/точка — по текстам (testid у них нет)

## Попутная починка

`AitvHomePage.notificationPanel` и `NotificationsPage` смотрят в старый `#notifications-scroll-container`,
которого на AITV-хедере больше нет → обновить на `#aitv-notifications-scroll-container`,
перегнать AITV-001/002 (scheduledVideoNotify).

## Скриншоты всех типов уведомлений (отдельное задание)

Все 13 поддерживаемых типов (`subscription`, `video_release`, `comment_reply`, `channel_subscription`,
`paid_channel_subscription`, `live_stream`, `channel_transfer_sent/received`, `chapters_generation_success`,
`ai_metadata_success/failed`, `recommended_video`, `paid_subscription`) отрендерить в попапе через подмену
ответа `GET /api/notifications` в браузере (вживую большинство типов не вызвать) →
скрины в `docs/W3-2748-screenshots/` + сверка с Figma (node 8071-12164).

## Вне скоупа

- Визуальные (скриншотные) тесты попапа — решение пользователя
- Пагинация свипа «Mark all as read» (тестируем одну страницу, 3–5 уведомлений)
- Типы без бэкенда: weekly watchlist, new episodes, «liked your comment» (отложены в Jira)
- Страница истории уведомлений («Show older») — отдельный тикет

## Риски

1. Нет testid у рядов/секций/точки/пустого состояния — селекторы по текстам (хрупче; стоит завести FE-задачу на testid).
2. `comment_reply` рендерится только при `payload.commentText` — проверяется в MCP-смоуке.
3. NOTIF-POPUP-011 — единственный медленный кейс (транскод на dev медленный by design).
