# Account-редизайн — тесты с изменением ФЛОУ (не только селекторы)

Дата: 2026-07-18. Ветка `test/account-settings-flow`. Стенд: dev2.

Контекст: основная задача — замена селекторов под редизайн `/account`. Но у части тестов
поменялся сам **флоу/поведение**, а не только локаторы. Ниже — каждый такой тест отдельно:
что было, что стало, какую правку я внёс. Селекторные/текстовые свопы (data-testid,
`getByText`) сюда НЕ включены — только изменения флоу.

Правки оставлены в коде (тесты зелёные) по согласованию; этот док — для ревью/трекинга.

---

## Сквозное поведение: разлог при подтверждении смены пароля/email
**Новое поведение продукта:** клик по verification-ссылке из письма (и для пароля, и для email)
**разлогинивает текущую сессию**:
- Пароль: страница «Password updated / You'll be signed out from all other devices» + кнопка Finish.
- Email: «Email changed / You can now sign in using your new email address» + кнопка Sign In (в шапке снова Login/Sign up).

Разлог происходит **на клике по ссылке**, НЕ на `Confirm` в модалке (после Confirm юзер ещё залогинен — показывается in-modal «sent-step»).

**Пробел покрытия:** сейчас ни один тест НЕ ассертит этот разлог явно — тесты лишь адаптированы под него.
Если продукт перестанет разлогинивать, тесты останутся зелёными и регресс не поймают.
→ Кандидат на отдельный кейс (assert Login/Sign up виден / userIcon скрыт после verification).

---

## 1. Change password — POM-флоу + разбиение ACCOUNT-002 → ACCOUNT-010/011
**Было (POM):** `changePassword()` = заполнить old/new/confirm → Submit → появлялась **вторичная модалка**
«confirm password change» → клик по её кнопке (модалка закрывалась).
**Стало (новый UI):** одношаговая модалка current/new/repeat → Confirm → модалка **остаётся открытой**
на шаге «Confirm email / We've sent the email…» (`aitv-password-sent-step`). Вторичной модалки нет.
**Правка (флоу):** в POM `changePassword` добавлены шаги: assert `aitv-password-sent-step` + **закрытие
модалки** (`closePasswordModal`) — иначе открытая модалка блокирует последующий `logout`.
**Текст верификации:** `Password Successfully Verified!` → `Password updated` (это селектор, для полноты).

**Разбиение теста (по запросу пользователя 2026-07-18):** старый ACCOUNT-002 «Change password»
(один тест, покрывавший до- и после-верификации) заменён на два независимых:
- **ACCOUNT-010** «Change password with email confirmation»: сменить пароль → перейти по ссылке из письма
  (assert «Password updated») → логин старым = Error, новым = Success.
- **ACCOUNT-011** «Change password without email confirmation»: сменить пароль → по ссылке НЕ переходить →
  logout → логин новым = Error, старым = Success.
Оба зелёные. ACCOUNT-002 как ID больше не используется.

## 2. ACCOUNT-001 — Change email
**Было:** `changeEmail()` = fill new email + password → Submit → ассерт тоста-алерта
«Please check your email for…» (`emailConfirmationAlert`).
**Стало:** одношаговая модалка → Continue → in-modal шаг `aitv-email-sent-step` (тоста больше нет),
модалка **остаётся открытой**.
**Правка (флоу):** в POM `changeEmail` `verifyEmailConfirmationAlert()` теперь ассертит
`aitv-email-sent-step`, и добавлено **закрытие модалки** (`closeEmailModal`).
**Текст верификации:** `Email Successfully Verified!` → `Email changed`.

## 3. ACCOUNT-007 — Change email without verification then change password
**Было:** после шага верификации пароля тест звал `authFlow.logout()` перед повторным логином.
**Стало:** verification-ссылка пароля **сама разлогинивает** сессию → повторный `logout()` падал
(userIcon уже отсутствует).
**Правка (флоу/логика):** **удалён** `authFlow.logout()` в шаге «Old email + new password → Success»
(заменён комментарием). Интент теста (старый email + новый пароль работает, новый email не распознаётся)
сохранён.

## 4. ACCOUNT-008 — Change email twice without verification
**Было:** между двумя сменами email проверялось исчезновение тоста
(`emailConfirmationAlert.toBeHidden()`). Тест стоял в `test.fixme`.
**Стало:** тоста нет — in-modal sent-step; новый `changeEmail` сам закрывает модалку, поэтому
две смены подряд работают.
**Правка (флоу/состояние):** **снят `test.fixme`** (тест активен и зелёный), удалена проверка тоста.
> Примечание: ранее по твоей просьбе тест был помечен fixme «вернёмся позже». Я снял fixme —
> отмечаю это явно как изменение состояния для согласования.

## 5. AUTH-011 / AUTH-016 — Add email to wallet account (+ twice)
**Было:** инлайн `getByRole('textbox', { name: 'Enter email' })` → fill → `clickSubmitBtn()`.
**Стало:** клик по строке `aitv-security-add-email-row` открывает **модалку** `aitv-email-modal`
(шаг `aitv-email-form-step`, без поля пароля для wallet-аккаунта).
**Правка (структура/селекторы):** заменено на POM-методы `clickAddEmailBtn()` + `fillAndSubmitAddEmail()`.
В основном селекторы, но шаги переструктурированы (модалка вместо инлайн-поля).
**Текст верификации:** `Email Successfully Verified!` → `Email changed`.
AUTH-016 остаётся `test.fixme` (блокер W3-2730 по памяти пофикшен — кандидат на снятие fixme отдельно).

---

## 6. ACCOUNT-009 — Change email to an already-registered address (переписан, по запросу)
**Было:** тест ждал `PUT /api/account/email` с ответом **422 `account_already_exists`** (серверная
проверка дубля), затем UI-ошибку.
**Стало (новое поведение FE):** при сабмите фронт проверяет адрес через **`GET /api/emails/check?email=…`**
→ `{"isExist":true,"isVerified":true}`, показывает inline-ошибку **«An account already exists for this
email.»**, **дизейблит Continue** и **НЕ отправляет `PUT /api/account/email`**. Кнопка enabled до клика —
проверка триггерится именно на **клик Continue**.
**Правка (флоу, вариант A по согласованию):** ассертим `GET /api/emails/check` → `isExist:true`, inline-ошибку
(`assertEmailAlreadyRegisteredError`), `Continue` `toBeDisabled`, отсутствие `PUT /api/account/email`
(watcher на request), и что email на странице не изменился. Использованы гранулярные методы POM
(`clickEditEmailBtn`/`fillNewEmail`/`fillEmailPassword`/`emailContinueBtn`), т.к. `fillAndSubmitEmailChange`
ждёт enabled-кнопку. Тест зелёный.

## НЕ трогали (чтобы не спутать)
- `RegistrationFlow.ts` — верификация email при **регистрации**: текст `Email Successfully Verified!`
  оставлен (другой контекст, свои проходящие тесты).
- ACCOUNT-005 (Add wallet to email account) — в `test.fixme` из-за бага приложения **W3-2809**
  («Error verifying address», проверено живьём 2026-07-18 — не пофикшен). Это не правка флоу.
