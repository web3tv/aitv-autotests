/**
 * Единый источник тем писем. Каждая константа — каноническая (полная) тема для
 * ОДНОГО логического письма. `waitForMessage` матчит тему по подстроке
 * (case-insensitive), а template-тесты (`assertEmailBasics`) сверяют её точно
 * (`toBe`) — поэтому обе стороны должны ссылаться на одну и ту же константу.
 *
 * Регистрационная верификация и верификация смены email — РАЗНЫЕ письма
 * (разные триггеры и темы), их не объединяем.
 */
export const MailSubject = {
  /** Новый аккаунт: письмо содержит и ссылку, и OTP-код. */
  REGISTRATION_VERIFICATION: 'Email Verification',
  /** Добавление / смена email. */
  EMAIL_CHANGE_VERIFICATION: 'Your verification link',
  /** Подтверждение смены пароля в настройках аккаунта. */
  PASSWORD_CHANGE_VERIFICATION: 'Password Verification',
  /** Восстановление пароля (forgot password). */
  PASSWORD_RESET: 'Your password verification link',
  /** Уведомление об успешной смене пароля (content-only). */
  PASSWORD_CHANGED: 'Your password has been changed',
  /** Приветственное письмо (content-only). */
  WELCOME: 'Welcome to AI.TV',
  /** Код двухфакторной аутентификации / логина. */
  AUTH_CODE: 'Authentication Code',
  /** Уведомление «видео вышло» (coming-soon, content-only). */
  VIDEO_RELEASED: 'Video released',
} as const;

export type MailSubjectKey = keyof typeof MailSubject;
