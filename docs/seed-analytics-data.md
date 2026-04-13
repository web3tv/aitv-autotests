# Накрутка статистики для страницы Analytics

Для тестирования страницы Analytics (`studio.web3tv.dev/analytics`) нужны реальные записи в БД.
Простое обновление счётчиков не влияет на графики и watchTime — нужны INSERT'ы в таблицы `video_views`, `video_rates`, `comments`.

## Prerequisite

```bash
kubectl port-forward -n web3tv svc/mariadb 3307:3306
```

Подключение к БД:

```bash
mysql -h 127.0.0.1 -P 3307 -u web3tv_user -p'5Empkc4SNNd09Am10o30' --skip-ssl web3tv
```

## 1. Узнать binary ID видео

```sql
SELECT HEX(id) as vid_hex, title, statistics_view_count as views
FROM videos
WHERE channel_id = (
    SELECT id FROM channels
    WHERE id = (SELECT channel_id FROM videos WHERE title = 'НАЗВАНИЕ_ВИДЕО' LIMIT 1)
)
AND deletedAt IS NULL
ORDER BY published_at DESC LIMIT 5;
```

## 2. Получить user_id для вставки

Каждая запись в `video_views`, `video_rates`, `comments` ссылается на реального юзера:

```sql
SELECT HEX(id) as user_hex, email FROM users WHERE deletedAt IS NULL LIMIT 20;
```

## 3. Вставить просмотры (video_views)

| Поле | Тип | Описание |
|------|-----|----------|
| `video_id` | binary(16) | ID видео |
| `ip_address` | varchar | Уникальный IP для каждой записи |
| `view_events` | JSON | Массив секунд просмотра, напр. `'[5,10,15,30,60,90,120]'`. MAX значение = watchTime этой записи |
| `is_viewed` | tinyint | Должен быть `1` чтобы считался просмотром |
| `created_at` | datetime | Дата просмотра (влияет на графики и period-фильтрацию) |
| `user_id` | binary(16) | Опционально |

```sql
SET @vid = 0x<HEX_ID_ВИДЕО>;

INSERT INTO video_views (video_id, ip_address, view_events, is_viewed, created_at, user_id) VALUES
(@vid, '10.0.1.1', '[5,10,15,30,60,90,120]', 1, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 1 HOUR, 0x<HEX_USER_ID>),
(@vid, '10.0.1.2', '[5,10,20,45,80]', 1, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 3 HOUR, 0x<HEX_USER_ID>);
```

## 4. Вставить лайки (video_rates)

| Поле | Тип | Описание |
|------|-----|----------|
| `video_id` | binary(16) | ID видео |
| `user_id` | binary(16) | Кто поставил лайк |
| `rating` | varchar | `'like'` или `'dislike'` |
| `created_at` | datetime | Лайки за последние 48ч попадут в `engagement.likes48h` |

```sql
INSERT INTO video_rates (video_id, user_id, rating, created_at) VALUES
(@vid, 0x<HEX_USER_ID>, 'like', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(@vid, 0x<HEX_USER_ID>, 'like', DATE_SUB(NOW(), INTERVAL 2 DAY));
```

## 5. Вставить комментарии (comments)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | binary(16) | Генерируется: `UNHEX(REPLACE(UUID(), '-', ''))` |
| `video_id` | binary(16) | ID видео |
| `author_id` | binary(16) | Кто написал |
| `text_original` | longtext | Текст комментария |
| `text_display` | longtext | Отображаемый текст (обычно = text_original) |
| `statistics_popularity` | double | Обязательное поле, ставить `0` |

```sql
INSERT INTO comments (id, video_id, author_id, text_original, text_display, created_at, published_at,
    statistics_like_count, statistics_dislike_count, statistics_reply_count, statistics_popularity) VALUES
(UNHEX(REPLACE(UUID(), '-', '')), @vid, 0x<HEX_USER_ID>,
    'Comment text', 'Comment text',
    DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY),
    0, 0, 0, 0);
```

## 6. Обновить счётчики (обязательно!)

Без этого summary на карточке видео и в аналитике не обновится:

```sql
-- Видео
UPDATE videos SET
    statistics_view_count = statistics_view_count + <N_VIEWS>,
    statistics_like_count = statistics_like_count + <N_LIKES>,
    statistics_comment_count = statistics_comment_count + <N_COMMENTS>
WHERE id = @vid;

-- Канал
UPDATE channels SET
    statistics_view_count = statistics_view_count + <N_VIEWS>
WHERE id = (SELECT channel_id FROM videos WHERE id = @vid);
```

## Маппинг: DB -> API -> UI

| DB таблица | API поле | UI блок |
|---|---|---|
| `channels.statistics_view_count` | `summary.views` | Views (карточка) |
| `channels.statistics_subscriber_count` | `summary.subscribers` | Subscribers (карточка) |
| `video_views` (SUM max view_events) | `summary.watchTimeSeconds` | Watch Time |
| `video_views` (GROUP BY date) | chart `metric=views` | График просмотров |
| `subscriptions` (COUNT in period) | `newSubscribers` | New Subscribers |
| `video_rates` rating='like' last 48h | `engagement.likes48h` | Engagement (48h) |
| `video_rates` (GROUP BY date) | chart `metric=likes` | График лайков |
| `subscriptions` (GROUP BY date) | chart `metric=subscribers` | График подписчиков |
| `videos.statistics_*` | `latestVideo`, `topContent` | Latest Content, Top Content |

## API эндпоинты

```
GET /channels/{channelId}/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD
GET /channels/{channelId}/analytics/chart?metric=views&by=day&from=YYYY-MM-DD&to=YYYY-MM-DD
```

- `metric`: `views`, `subscribers`, `likes`
- `by`: `day`, `hour`
- Без дат — дефолт 30 дней
- Макс. диапазон — 365 дней

## Что НЕ реализовано на бэкенде

- **CTR (Click-Through-Rate)** — нет в API
- **Retention Rate** — поле есть, но всегда `null`
- **Total Impressions** — нет в API
