import { APIRequestContext, expect } from '@playwright/test';
import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';

/** Незаполненный Twig-плейсхолдер вида {{ ... }}. */
const PLACEHOLDER_RE = /\{\{.*?\}\}/;

export type EmailMessage = {
  subject: string;
  fromAddress: string;
  fromName: string;
  text: string;
  html: string;
};

/**
 * Чтение почты из ОДНОГО реального Gmail-ящика (аккаунт из EMAIL_ACCOUNT) по IMAP.
 *
 * Изоляция между тестами достигается plus-addressing: каждый тест получает уникальный
 * адрес `<account>+qa_<rnd>@gmail.com`, все письма падают в общий ящик, а фильтрация
 * идёт по получателю. Поэтому «token» здесь — это сам адрес-получатель: он передаётся
 * в waitForMessage/extract* как ключ фильтра (имя «token» историческое, сохранено ради
 * стабильности сигнатур).
 *
 * Доступ по App Password (EMAIL_PASSWORD, 16 символов, требует включённой 2FA на аккаунте).
 */
export class GmailHelper {
  private account = process.env.EMAIL_ACCOUNT ?? '';
  private appPassword = process.env.EMAIL_PASSWORD ?? '';
  private email = '';
  private messageId = '';
  /** Совместимость: старый код местами читает helper['password']. Для Gmail не используется. */
  private password = '';
  /** Кэш распарсенных писем по IMAP UID, чтобы extract-методы и getMessage не перечитывали IMAP. */
  private cache = new Map<string, EmailMessage>();
  /** UID → папка, из которой письмо прочитано (для докачки в getEmailByUid). */
  private uidBox = new Map<string, string>();

  private static readonly HOST = 'imap.gmail.com';
  /**
   * Ищем в All Mail (супермножество INBOX + архив — под burst Gmail часть писем
   * доставляет мимо INBOX) и в Spam (bulk-письма подтверждения могут туда попадать).
   * UID уникален в рамках одной папки; ищем сначала All Mail, поэтому inbox/архив
   * находятся раньше спама.
   */
  private static readonly MAILBOXES = ['[Gmail]/All Mail', '[Gmail]/Spam'];

  // request не нужен для IMAP, но принимается для совместимости с прежней сигнатурой.
  constructor(_request?: APIRequestContext) {
    if (!this.account || !this.appPassword) {
      throw new Error('EMAIL_ACCOUNT и EMAIL_PASSWORD (Gmail App Password) должны быть заданы в env');
    }
  }

  /** Уникальный plus-адрес в общем ящике: `<account>+qa_<ts>_<rnd>@gmail.com`. */
  generateEmail(): string {
    const [local, domain] = this.account.split('@');
    const rnd = Math.random().toString(36).slice(2, 8);
    this.email = `${local}+qa_${Date.now()}_${rnd}@${domain}`;
    return this.email;
  }

  /** Исторический no-op (сигнатура сохранена): отдельный ящик не нужен —
   *  используется общий Gmail-ящик, изоляция через plus-addressing. */
  async createMailbox(): Promise<void> {}

  /**
   * Возвращает «token» = адрес-получатель. Именно он далее фильтрует письма в общем ящике.
   * password игнорируется (совместимость сигнатуры).
   */
  async getToken(email: string, _password?: string): Promise<string> {
    this.email = email;
    return email;
  }

  private async connect(): Promise<ImapFlow> {
    const client = new ImapFlow({
      host: GmailHelper.HOST,
      port: 993,
      secure: true,
      auth: { user: this.account, pass: this.appPassword },
      logger: false,
    });
    // Транспортные ошибки (редкий TLS "bad record mac") эмитятся как 'error' —
    // глушим, чтобы не падал процесс; цикл ретраев переподключится.
    client.on('error', () => {});
    await client.connect();
    return client;
  }

  private toEmailMessage(parsed: ParsedMail): EmailMessage {
    const from = parsed.from?.value?.[0];
    return {
      subject: parsed.subject ?? '',
      fromAddress: from?.address ?? '',
      fromName: from?.name ?? '',
      text: parsed.text ?? '',
      html: typeof parsed.html === 'string' ? parsed.html : (parsed.textAsHtml ?? ''),
    };
  }

  /** Одна попытка найти письмо: ищет по получателю, фильтрует по теме и timestamp, берёт свежайшее. */
  private async findOnce(
    client: ImapFlow,
    recipient: string,
    subjectText: string,
    afterTimestamp: number | undefined,
    sinceDate: Date,
  ): Promise<string | null> {
    for (const box of GmailHelper.MAILBOXES) {
      let lock;
      try {
        lock = await client.getMailboxLock(box);
      } catch {
        continue; // папка недоступна на аккаунте — пропускаем
      }
      try {
        // IMAP TO-поиск подстрочный, но полный адрес с @gmail.com делает совпадение фактически точным.
        const uids = (await client.search({ to: recipient, since: sinceDate }, { uid: true })) || [];
        // Идём от самых новых UID к старым.
        for (const uid of [...uids].reverse()) {
          const msg = await client.fetchOne(String(uid), { source: true, internalDate: true }, { uid: true });
          if (!msg || !msg.source) continue;

          if (afterTimestamp !== undefined && msg.internalDate) {
            if (new Date(msg.internalDate).getTime() <= afterTimestamp) continue;
          }

          const parsed = await simpleParser(msg.source);
          if (!parsed.subject?.toLowerCase().includes(subjectText.toLowerCase())) continue;

          // Подстраховка: точное совпадение получателя (To / Cc / Delivered-To).
          const recipients = [
            parsed.to?.text ?? '',
            parsed.cc?.text ?? '',
            parsed.headers.get('delivered-to')?.toString() ?? '',
          ].join(' ').toLowerCase();
          if (!recipients.includes(recipient.toLowerCase())) continue;

          const id = String(uid);
          this.cache.set(id, this.toEmailMessage(parsed));
          this.uidBox.set(id, box);
          return id;
        }
      } finally {
        lock.release();
      }
    }
    return null;
  }

  /**
   * Ждёт письмо с темой, содержащей subjectText, адресованное `token` (адрес-получателю).
   * Держит одно IMAP-соединение на всё время ожидания; переподключается при транспортном сбое.
   * Возвращает IMAP UID (строкой) — совместимо с прежним messageId.
   */
  async waitForMessage(
    token: string,
    subjectText: string,
    retries = 10,
    delayMs = 3000,
    afterTimestamp?: number,
  ): Promise<string> {
    if (!token) {
      throw new Error('Recipient token (email address) is missing. Cannot fetch messages from Gmail.');
    }
    const recipient = token;
    // IMAP SINCE — с точностью до суток; берём с запасом в день, точную отсечку делаем по internalDate.
    const base = afterTimestamp ?? Date.now() - 10 * 60 * 1000;
    const sinceDate = new Date(base - 24 * 60 * 60 * 1000);

    let client: ImapFlow | null = null;
    try {
      for (let i = 0; i < retries; i++) {
        try {
          if (!client || !client.usable) client = await this.connect();
          const uid = await this.findOnce(client, recipient, subjectText, afterTimestamp, sinceDate);
          if (uid) {
            this.messageId = uid;
            return uid;
          }
        } catch (e) {
          // Транспортный сбой — закрываем и переподключаемся на следующей итерации.
          try { if (client) await client.logout(); } catch { /* ignore */ }
          client = null;
        }
        await new Promise(r => setTimeout(r, delayMs));
      }
    } finally {
      if (client) { try { await client.logout(); } catch { /* ignore */ } }
    }

    throw new Error(`Gmail timeout: письмо "${subjectText}" не пришло на ${recipient}`);
  }

  /** Достаёт письмо по UID: из кэша (после waitForMessage) либо дочитывает из IMAP. */
  private async getEmailByUid(uid: string): Promise<EmailMessage> {
    const cached = this.cache.get(uid);
    if (cached) return cached;

    const box = this.uidBox.get(uid) ?? '[Gmail]/All Mail';
    const client = await this.connect();
    try {
      const lock = await client.getMailboxLock(box);
      try {
        const msg = await client.fetchOne(String(uid), { source: true }, { uid: true });
        if (!msg || !msg.source) throw new Error(`Message uid ${uid} not found in Gmail`);
        const em = this.toEmailMessage(await simpleParser(msg.source));
        this.cache.set(uid, em);
        return em;
      } finally {
        lock.release();
      }
    } finally {
      try { await client.logout(); } catch { /* ignore */ }
    }
  }

  async extractVerificationUrl(messageId?: string, _token?: string): Promise<string> {
    const uid = messageId ?? this.messageId;
    if (!uid) throw new Error('messageId is required');
    const { text, html } = await this.getEmailByUid(uid);
    const body = `${text}\n${html}`;
    const verifyMatch = body.match(/https:\/\/[^\s/]+\/verification\?[^\s)"'<>]+/);
    if (verifyMatch) return verifyMatch[0];
    throw new Error('Verification URL not found in email');
  }

  async extractPasswordResetnUrl(messageId: string, _token?: string): Promise<string> {
    const { text, html } = await this.getEmailByUid(messageId);
    const body = `${text}\n${html}`;
    const verifyMatch = body.match(/https:\/\/[^\s/]+\/reset-password\?[^\s"'<>)]*/i);
    if (verifyMatch) return verifyMatch[0];
    throw new Error('Reset Password URL not found in email');
  }

  async extract2FACode(messageId: string, _token?: string): Promise<string[]> {
    const { text, html } = await this.getEmailByUid(messageId);
    const body = `${text}\n${html}`;
    // В реальном письме код — среди HTML-шаблона; берём отдельно стоящую 4-значную группу.
    const match = body.match(/\b(\d{4})\b/);
    if (!match) throw new Error(`2FA code not found in email`);
    return match[1].split('');
  }

  /**
   * Возвращает полное содержимое письма для проверок контента шаблонов:
   * subject, отправитель (адрес и имя), текстовое и HTML-тело.
   */
  async getMessage(messageId: string, _token?: string): Promise<EmailMessage> {
    return this.getEmailByUid(messageId);
  }

  /**
   * Проверяет инвариантные (общие для всех писем AITV) свойства письма:
   * точная тема, домен отправителя, брендинг и отсутствие незаполненных плейсхолдеров.
   * Специфичный для письма контент проверяется в самом тесте.
   *
   * Отправитель на стейдже технический (Web3TV Staging <staging@web3.tv>), поэтому
   * sender проверяется по домену, а бренд — по содержимому (футер «© 2026 AITV»).
   */
  static assertEmailBasics(
    email: EmailMessage,
    opts: {
      subject: string;
      senderDomain?: string;
      branding?: string;
      noPlaceholders?: boolean;
    },
  ): void {
    const senderDomain = opts.senderDomain ?? 'web3.tv';
    const branding = opts.branding ?? 'AITV';

    expect(email.subject, 'email subject').toBe(opts.subject);
    expect(email.fromAddress, 'sender domain').toContain(senderDomain);
    expect(email.text, 'AITV branding present').toContain(branding);

    if (opts.noPlaceholders !== false) {
      expect(email.text, 'no unresolved Twig placeholders').not.toMatch(PLACEHOLDER_RE);
    }
  }

  async extractVerificationCode(messageId: string, _token?: string): Promise<string> {
    const { text, html } = await this.getEmailByUid(messageId);
    const body = `${text}\n${html}`;
    const match = body.match(/\b(\d{4,8})\b/);
    if (match) return match[1];
    throw new Error('Verification code not found in email');
  }
}
