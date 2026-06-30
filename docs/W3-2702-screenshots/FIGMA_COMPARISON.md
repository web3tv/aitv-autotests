# W3-2702 — Сверка реализации (dev2) с дизайном Figma

Дизайн: Figma `AITV-UI`, секция «Upload Video» (node `3118-77348`).
Реализация: studio.web3tv2.dev, скриншоты в этой же папке (`STEP-*.png`).
Дата: 2026-06-30.

| Экран | Макет (figma-*.png) | Реализация (STEP-*.png) | Итог |
|-------|---------------------|--------------------------|------|
| Селектор типа (Movie/Series/Shorts) | в каждом экране | STEP-01 | ✅ совпадает |
| Movie Details (title, desc, category, genre, 2 обложки H+V) | figma-movie-filled | STEP-01b | ✅ совпадает |
| Series → New Series (табы, Series Name, Episode #=1 авто, Episode Title, обложки) | figma-series-new | STEP-02 | ✅ совпадает |
| Series → New Episode (Parent Series, Episode Title, обложки, наследование cat/genre) | figma-series-episode | — | ✅ совпадает |
| Shorts (одна мультиаспектная обложка, **один** тоггл Associated movie/series) | figma-shorts | STEP-05 | ✅ совпадает |
| Finalize (Visibility, Schedule, Content Rating, Hotspots+3 подкарточки, Preview) | figma-finalize | STEP-03 | ✅ совпадает |
| Success (Congratulations, View Video, Visit Studio, Upload Another) | figma-success | STEP-04 | ⚠️ расхождение (см. ниже) |

## Расхождения (реализация ≠ дизайн)

### 1. Success-экран — отсутствует строка ссылки с кнопками Copy / Share — ⚠️ среднее
В макете (`figma-success.png`) между «View Video» и «Visit Studio / Upload Another» есть строка с медиа-ссылкой `https://www.ai.tv/media/...` и кнопками **Copy** и **Share**.
В реализации (`STEP-04-movie-success.png`) этой строки **нет** — присутствуют только View Video, Visit Studio, Upload Another и юридический текст. Проверено на публичном видео (для которого ссылка должна быть).
→ Кандидат на баг (потеря функции «поделиться ссылкой» после загрузки).

### 2. Публикация Shorts не работает — 🐞 заведён W3-2722
`POST /api/videos/update/{id}` → 400 `categoryId: should not be null`. Залоченная категория «Shorts» не отправляется. Не визуальное, но блокирует флоу. (Подробности — в FINDINGS.md и W3-2722.)

## Уточнения (НЕ расхождения — снимаю ранее высказанные сомнения)
- **Отсутствие Paid/Membership на Finalize** — так задумано: в макете только Public / Unlisted / Private.
- **Shorts: «два тоггла Associated Movie/Series»** — формулировка из текста Jira. В макете и в реализации — **один** тоггл «Associated movie/series» + общий дропдаун «Select Movie or Series». Совпадает.
- Вертикальная обложка: Movie 2:3, Series 3:4 — соответствует контексту (в макете обложки показаны корректно по типам).
</content>
