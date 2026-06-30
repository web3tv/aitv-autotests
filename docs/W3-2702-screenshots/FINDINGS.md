# W3-2702 — Разведка живого UI (web3tv2.dev / studio.web3tv2.dev)

Дата: 2026-06-30. Окружение: dev2. Залогинен свежим юзером (createUserFast).

## Точки входа (Studio header → Create)
Меню Create содержит только два пункта:
- `[data-testid="new-video-button"]` — «New video»
- `[data-testid="new-short-button"]` — «New short»

Оба открывают один диалог **Upload Video** с дропзоной:
- `[data-testid="aitv-upload-uploader"]` / `aitv-upload-dropzone` / `aitv-upload-select-file`
- `input[type="file"]` внутри `[role="dialog"]` — приём файла через `setInputFiles`.

## Селектор типа (после загрузки файла) — `aitv-upload-type-selector`
- `aitv-upload-type-movie` (role=radio) — по умолчанию выбран при загрузке landscape-видео
- `aitv-upload-type-series` (role=radio)
- `aitv-upload-type-shorts` (role=radio)

**Важно (поведение):** доступность типа зависит от соотношения сторон загруженного видео:
- Загрузили **landscape** (5secVideo.mp4) → активны Movie/Series; **Shorts серый (opacity 0.5), не выбирается** (`aria-checked` остаётся false при клике; не `aria-disabled`, а визуально/логически заблокирован).
- Загрузили **вертикальный** short (shortsVideo.mp4) через «New short» → активен только **Shorts**, а **Movie/Series серые (0.5)**.
- ⚠️ Для тестов: Movie/Series создаём из landscape-видео; Shorts — из вертикального через «New short».

## Шаг Details — общий каркас `aitv-upload-details-step`
- `aitv-upload-details-autofill` — кнопка «Autofill with AI»
- `aitv-upload-details-title` → внутри `input[name="title"]` (0/100)
- `aitv-upload-details-description` → Quill `[data-id="description"] .ql-editor` (0/1000)
- `aitv-upload-details-category` → внутри MUI Autocomplete, `input` с placeholder «Select a category»
- `aitv-upload-details-genres` → `input` placeholder «Select up to 3 genres» (multi, chips)
- Обложки (**Movie/Series — ДВЕ**):
  - `aitv-upload-details-thumb-horizontal` → `input[type="file"]`; Aspect 16:9, 10MB, JPEG/PNG
  - `aitv-upload-details-thumb-vertical` → `input[type="file"]`; Movie 2:3, **Series 3:4**, 10MB

### Кроп обложки (важно!)
После выбора файла обложки открывается **модал кропа** с зумом и кнопкой **Confirm** (у кнопки **нет** `data-testid` — селектор `button:has-text("Confirm")`). Пока кроп не подтверждён, кнопка Next перехватывается оверлеем. Если загрузить обе обложки подряд — модалы кропа встают в очередь (Confirm нажимать по числу обложек).

### Footer — `aitv-upload-footer`
- `aitv-upload-footer-cancel`, `aitv-upload-footer-save-draft`, `aitv-upload-footer-next`, `aitv-upload-footer-back`, `aitv-upload-footer-publish`
- `aitv-upload-processing` — текст «Processing....NN%» → «Video successfully uploaded»

## Series-специфика — `aitv-upload-series-fields`
- Режимы (P-элементы, не tabs): `aitv-upload-series-mode-new` («New Series») / `aitv-upload-series-mode-episode` («New Episode»)
- **New Series**: `aitv-upload-series-name` → `input[name="seriesName"]`; `aitv-upload-series-episode-number` → input (Episode), + Episode Title (`input[name="title"]`)
- **New Episode**: `aitv-upload-series-parent` → MUI Autocomplete `input` placeholder «Select series» (Parent Series), + Episode Title
- Vertical обложка для Series: **3:4** (не 2:3).

## Shorts-специфика (вход «New short», вертикальное видео)
- Категория **залочена**: `aitv-upload-details-category` → `input` `disabled=true`, `value="Shorts"`.
- **Одна мультиаспектная обложка**: `aitv-upload-shorts-thumbnail` (Aspect 2:3, 16:9, или 1:1; 10MB; JPEG/PNG). Горизонтальной/вертикальной раздельно НЕТ.
- Ассоциация: `aitv-upload-shorts-associated` + тоггл `aitv-upload-shorts-associated-toggle`. При включении появляется `aitv-upload-shorts-associated-select` → combobox «Select Movie or Series» (единый дропдаун, **не** два отдельных тоггла Movie/Series как в формулировке Jira).
- Genres у Shorts остаются (combobox «Select up to 3 genres»).

## Шаг Finalize — `aitv-upload-finalize-step`
- Visibility (radio): `aitv-upload-finalize-visibility-public` / `-unlisted` / `-private`.
  - ⚠️ **Нет варианта Paid/Membership** на этом экране (в отличие от старого `UploadVideoPage`).
- `aitv-upload-finalize-schedule-toggle` (SPAN switch) — Schedule (выбор будущей даты публикации).
- `aitv-upload-finalize-content-rating` → combobox, по умолчанию «General Audience».
- `aitv-upload-finalize-hotspots-toggle` (SPAN switch) — Hotspots (подопции: Add links to objects, Viewers can click hotspots, Track performance).
- `aitv-upload-finalize-preview` + `aitv-upload-finalize-preview-play` — превью с кнопкой play.

## Экран Success — `aitv-upload-success-root`
Текст: «Congratulations! Your video was successfully uploaded».
- `aitv-upload-success-close`, `aitv-upload-success-hero`
- `aitv-upload-success-view-video` («View Video»)
- `aitv-upload-success-visit-studio` («Visit Studio»)
- `aitv-upload-success-upload-another` («Upload Another»)

## Проверка результата — `/content` (studio.web3tv2.dev/content)
Табы: `[data-id="segmented-control-all" | "-movies" | "-series" | "-shorts"]`.
Строки: `[data-testid="video-row"]` (содержит title + description). Опубликованный Movie появился сразу.

## Прочее
- При закрытии диалога с несохранёнными данными срабатывает нативный **beforeunload** при уходе со страницы — в тестах закрывать корректно (Cancel) и/или принимать диалог.
- Кнопка Confirm в кропе и режимы Series — без явных «tab» ролей.
</content>
