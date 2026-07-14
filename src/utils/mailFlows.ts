import type { MailHelper } from './mailHelper';
import type { EmailMessage } from './gmailHelper';
import { MailSubject } from './mailSubjects';

/**
 * Параметры ожидания письма, пробрасываемые в `waitForMessage`.
 * Значения по умолчанию совпадают с дефолтами хелпера (retries=10, delayMs=3000),
 * поэтому вызовы без opts ведут себя идентично прежним инлайновым.
 */
export interface WaitOpts {
  retries?: number;
  delayMs?: number;
  /** afterTimestamp: строгая нижняя граница (мс, Date.now()) — брать письма только новее. */
  since?: number;
}

/**
 * Тонкая обёртка над `MailHelper`: одно интент-именованное действие на
 * (тип письма × извлечение). Прячет и тему (см. `MailSubject`), и связку
 * `waitForMessage → extract*`, так что call-site'ы не трогают ни сырые темы,
 * ни имена экстракторов (включая опечатку `extractPasswordResetnUrl`).
 *
 * НЕ оборачивает `generateEmail`/`getToken`/`createMailbox` — для setup'а
 * почтового ящика используйте `createMailHelper` напрямую.
 */
export class MailFlows {
  constructor(private readonly mail: MailHelper) {}

  private waitId(token: string, subject: string, opts?: WaitOpts): Promise<string> {
    return this.mail.waitForMessage(token, subject, opts?.retries ?? 10, opts?.delayMs ?? 3000, opts?.since);
  }

  // --- URL-письма ---

  /** Верификация смены/добавления email → ссылка подтверждения. */
  async emailChangeUrl(token: string, opts?: WaitOpts): Promise<string> {
    const id = await this.waitId(token, MailSubject.EMAIL_CHANGE_VERIFICATION, opts);
    return this.mail.extractVerificationUrl(id);
  }

  /** Регистрационная верификация → ссылка подтверждения. */
  async registrationUrl(token: string, opts?: WaitOpts): Promise<string> {
    const id = await this.waitId(token, MailSubject.REGISTRATION_VERIFICATION, opts);
    return this.mail.extractVerificationUrl(id);
  }

  /** Подтверждение смены пароля (настройки аккаунта) → ссылка подтверждения. */
  async passwordChangeUrl(token: string, opts?: WaitOpts): Promise<string> {
    const id = await this.waitId(token, MailSubject.PASSWORD_CHANGE_VERIFICATION, opts);
    return this.mail.extractVerificationUrl(id);
  }

  /** Восстановление пароля → ссылка сброса. */
  async passwordResetUrl(token: string, opts?: WaitOpts): Promise<string> {
    const id = await this.waitId(token, MailSubject.PASSWORD_RESET, opts);
    return this.mail.extractPasswordResetnUrl(id);
  }

  // --- Письма с кодом ---

  /** Регистрационная верификация → OTP-код. */
  async registrationCode(token: string, opts?: WaitOpts): Promise<string> {
    const id = await this.waitId(token, MailSubject.REGISTRATION_VERIFICATION, opts);
    return this.mail.extractVerificationCode(id);
  }

  /** 2FA / код аутентификации → массив из 4 символов. */
  async authCode(token: string, opts?: WaitOpts): Promise<string[]> {
    const id = await this.waitId(token, MailSubject.AUTH_CODE, opts);
    return this.mail.extract2FACode(id);
  }

  // --- Контентные письма (в паре с assertEmailBasics на call-site) ---

  /** Дождаться письма по теме и вернуть его целиком (для content/template-проверок). */
  async message(token: string, subject: string, opts?: WaitOpts): Promise<EmailMessage> {
    const id = await this.waitId(token, subject, opts);
    return this.mail.getMessage(id);
  }
}
