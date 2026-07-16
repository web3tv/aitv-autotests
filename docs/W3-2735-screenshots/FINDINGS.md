# W3-2735 — ручная верификация (stage / dev2)

Дата: 2026-07-15 · Стенд: `.env.web3tv2` (web3tv2.dev) · Метод: API-репродукция (throwaway spec, удалён).

Сетап: автор + подписчик (`AuthApi.createAndVerifyUser`), автор загрузил видео и
запланировал релиз на `now + 2 min` (coming-soon), затем крон опубликовал.

## Проблема 1 — дубли `video_release` → ✅ ИСПРАВЛЕНО

```
[W3-2735][PROBLEM1] first notification arrived=true
[W3-2735][PROBLEM1] subscriber video_release count=1 (expected 1)
[W3-2735][PROBLEM1] sample=[{"id":460,"type":"video_release","createdAt":"2026-07-15T14:02:00+00:00"}]
```

Подписчик получил **ровно 1** уведомление `video_release` (после 20-сек settle-окна),
а не 3. Баг дублей на стенде **не воспроизводится** — считаем исправленным.

## Проблема 2 — самоподписка автора → ❌ ВОСПРОИЗВОДИТСЯ

```
[W3-2735][PROBLEM2] self-subscribe status=204 ok=true body=
[W3-2735][PROBLEM2] author isNotifyOnReleaseSubscribed=true
[W3-2735][PROBLEM2] author self video_release count=1 (expected 0)
```

- `POST /videos/{id}/notify-on-release` собственным токеном автора вернул **204** (принято),
  ожидался **4xx** (403/422).
- Подписка **сохранена**: `GET /videos/coming-soon` токеном автора → `isNotifyOnReleaseSubscribed=true`.
- После публикации автор **получил** `video_release` о собственном релизе (count=1, ожидалось 0).

Баг подтверждён end-to-end. Фикс на стенде **не выкачен**.

## Итог
Из двух проблем тикета исправлена только Проблема 1. Проблема 2 (самоподписка) всё ещё
активна — тикет нельзя закрывать. Скриншот UI не снимался: баг уровня API, доказательство
исчерпывающее по ответам эндпоинтов.

## Отражено в покрытии (TEST_COVERAGE.md)
- **AITV-003** `[TODO]` — подписчик получает ровно одно `video_release` (регресс-гард для Проблемы 1).
- **AITV-004** `[BLOCKED]` — самоподписка автора отклоняется 4xx + не сохраняется (ждёт фикса Проблемы 2).
