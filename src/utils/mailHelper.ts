import { APIRequestContext } from '@playwright/test';
import { GmailHelper } from './gmailHelper';
import { MailpitHelper } from './mailpitHelper';
import { MailFlows } from './mailFlows';

export type { EmailMessage } from './gmailHelper';
export { MailFlows } from './mailFlows';
export type { WaitOpts } from './mailFlows';
export { MailSubject } from './mailSubjects';

/**
 * Общий интерфейс почтового хелпера — то, чем пользуются тесты и флоу.
 * Оба транспорта (Gmail IMAP и Mailpit API) реализуют его полностью.
 */
export type MailHelper = Pick<
  GmailHelper,
  | 'generateEmail'
  | 'createMailbox'
  | 'getToken'
  | 'waitForMessage'
  | 'extractVerificationUrl'
  | 'extractPasswordResetnUrl'
  | 'extract2FACode'
  | 'extractVerificationCode'
  | 'getMessage'
>;

/**
 * Единая точка выбора почтового транспорта: MAIL_TRANSPORT=mailpit → свой
 * Mailpit (Cloudflare Email Routing → Worker `infra/mailpit-forwarder` →
 * Mailpit на VPS), иначе Gmail IMAP (App Password отозван 13.07.2026).
 * Тесты и флоу создают хелпер только через эту фабрику.
 */
export function createMailHelper(request?: APIRequestContext): MailHelper {
  return process.env.MAIL_TRANSPORT === 'mailpit'
    ? new MailpitHelper(request)
    : new GmailHelper(request);
}

/**
 * Обёртка над хелпером с интент-именованными действиями «дождаться письма и
 * извлечь ссылку/код» (см. mailFlows.ts). Единая точка правки при смене флоу/темы.
 */
export function createMailFlows(request?: APIRequestContext): MailFlows {
  return new MailFlows(createMailHelper(request));
}

/** Транспортно-независимые проверки инвариантов письма (см. gmailHelper.ts). */
export const assertEmailBasics = GmailHelper.assertEmailBasics;
