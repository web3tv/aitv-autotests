# W3-2808 — телефон на /account: журнал сетапа

**Дата:** 2026-08-17
**Задача:** [W3-2808](https://stretch-com.atlassian.net/browse/W3-2808) — добавление/смена номера телефона на вкладке Security страницы `/account`.
**Стенд:** dev2 (`ENV_FILE=.env.web3tv2`, `BASE_URL=https://web3tv2.dev`).

## Сборка и деплой

Ветка в обоих продуктовых репо: `W3-2808/erzikov/manage-account-phone`.

| Воркload | Образ | Как получен |
|---|---|---|
| `api2` | `ghcr.io/web3tv/api:0.0.0-w3-2808` | тег создан и запушен из HEAD ветки (`b1e5d15c`), CI run 32004292061 — success |
| `frontend2` | `ghcr.io/web3tv/frontend:0.0.0-w3-2808-manage-account-phone-9-aitv` | образ уже был собран на HEAD ветки (`63fb1f85`), переиспользован; суффикс `-aitv` обязателен для dev2 |

`deploy/values-dev.yaml` в `web3tv/devops` обновлён коммитом `100ead0`, ArgoCD раскатал; проверено `kubectl get deploy api2 frontend2 -n web3tv`.

Лимиты OTP, реально выставленные на api2 (из env деплоймента): `AUTH_OTP_TTL_SECONDS=600`, `AUTH_OTP_RESEND_COOLDOWN_SECONDS=60`, `AUTH_OTP_MAX_SENDS_PER_HOUR=5`, `AUTH_OTP_MAX_SENDS_PER_DAY=10`. Попыток ввода кода на challenge — 5.

## Созданные юзеры

Пароль у всех — `USER_PASSWORD` из env (не дублирую здесь).

| Юзер | Способ | Роль в проверках |
|---|---|---|
| `qa_1786947490368_lnlzzz@aitv-test.com` / `fxoqg4395` | `AuthApi.createUserFast` | основной прогон MCP: happy path, дубликат своего номера, 5 неверных кодов, Edit/сброс модалки. Привязанные номера: `+12015312169`, затем `+12013196965` |
| `qa_1786955407879_cckqre@aitv-test.com` / `hurqt1388` | `AuthApi.createUserFast` | скриншоты всех состояний; итоговый номер `+12011433317` |

Номера генерируются `DataGenerator.generatePhoneNumber()` (`+1201XXXXXXX`), код подтверждения — статический `1111` (`AuthApi.STATIC_OTP_CODE`), он принимается и account-флоу (`POST /api/account/phone/verify` → 204).

## Засеянный контент

Никакого — фича не требует видео/каналов. Общая фикстура `@qavischan` не трогалась: `npx playwright test --project=fixture-check` зелёный после передеплоя, re-seed не требовался (изменения аддитивные, DOM канала/видео/плеера и студийные листинги не затронуты).

## Скриншоты

| Файл | Состояние |
|---|---|
| `01-security-empty-state.png` | вкладка Security, строка «Add Phone» (телефона нет) |
| `02-modal-form-step.png` | модалка, шаг формы (страна US, поле номера, текущий пароль) |
| `03-wrong-password-error-BUG.png` | **баг**: неверный пароль подсвечивает поле телефона с текстом «Please enter a valid phone number.» |
| `04-modal-otp-step.png` | шаг ввода 4-значного кода |
| `05-otp-invalid-code.png` | неверный код: «Incorrect code. 4 attempts remaining.» |
| `06-modal-success-step.png` | «Added phone number» + Finish |
| `07-security-filled-state.png` | вкладка Security с сохранённым номером `+1 201 143 3317` и кнопкой Change |

Макетов в Jira нет (`attachment: []`), сравнивать с эталоном не с чем — скриншоты зафиксированы как референс фактического вида.

## Прогресс

- Пайплайн пройден целиком (Phase 0-11) на ветке автотестов `test/w3-2808-account-phone`.
- Написаны 9 UI-тестов ACCOUNT-013..021 (блок `test.describe('Manage phone')` в `security.spec.ts`) и 5 API-тестов API-PHONE-001..005 (`tests/api/accountPhone.spec.ts`). Прогон: 20 passed, 3 skipped (ACCOUNT-006 — старый fixme по W3-2783; ACCOUNT-017 и ACCOUNT-020 — fixme по багам ниже).
- ACCOUNT-017 и ACCOUNT-020 прогонялись со снятым fixme и падали ровно на целевых ассертах — тесты корректны, блокируют их баги продукта.
- Побочно: ACCOUNT-012 расфикстмлен и зелёный — W3-2910 закрыт этой веткой (email-модалка теперь спрашивает текущий пароль при `hasPassword`).
- В `TEST_COVERAGE.md` секция ACCOUNT SETTINGS переписана: добавлены новые строки, поправлены устаревшие пути `tests/account/account.spec.ts` → `tests/accountSettings/security.spec.ts` и статусы ACCOUNT-008/009/012.

## Найденные расхождения (отписаны в комментарии к W3-2808)

1. Неверный текущий пароль → ошибка рисуется под полем телефона («Please enter a valid phone number.») вместо «The provided password is incorrect.» под полем пароля. Причина: бэк отдаёт `errors[].path`, а `normalizePhoneError` читает `field`/`propertyPath`/`property`.
2. После неверного кода поля OTP не очищаются; повторный ввод того же кода не отправляет запрос — выглядит как зависание.
3. После `attempts_exhausted` (429) поля кода остаются активными, хотя во фронте задуман `otpBlocked`.
4. При смене номера заголовки те же, что при добавлении: «Add phone number» / «Added phone number» (ключи `aitvAccountPhoneUpdatedTitle` в i18n есть, но не используются).

## Как продолжить

1. Перечитать этот файл и `TEST_COVERAGE.md` (секция ACCOUNT SETTINGS).
2. Тесты живут в `tests/accountSettings/security.spec.ts`, блок `test.describe('Manage phone')`; POM — `src/pages/account/SecurityPage.ts`.
3. Прогон: `npx playwright test tests/accountSettings/security.spec.ts --project=functional --workers=1`.
4. При работе с OTP помнить: перед повторным вводом кода поля надо очищать вручную (см. расхождение №2), иначе сабмит не триггерится.
