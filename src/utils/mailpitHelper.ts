import { APIRequestContext } from '@playwright/test';
import { EmailMessage } from './gmailHelper';

/**
 * Чтение почты из своего Mailpit (VPS, catch-all на MAIL_DOMAIN) по HTTP API.
 * Транспортная замена GmailHelper с тем же публичным интерфейсом — тесты и флоу
 * не знают, какой транспорт под ними (выбор в createMailHelper по MAIL_TRANSPORT).
 *
 * Изоляция между тестами — как и раньше: уникальный адрес на тест
 * (`qa_<ts>_<rnd>@<MAIL_DOMAIN>`, catch-all принимает всё без регистрации ящиков),
 * фильтрация по получателю. «token» = адрес-получатель (см. gmailHelper.ts).
 *
 * env: MAIL_API_URL (http(s)://host[:port]), MAIL_DOMAIN (домен адресов),
 * MAIL_API_AUTH (`user:pass` basic-auth UI/API Mailpit).
 */
export class MailpitHelper {
  private apiUrl = (process.env.MAIL_API_URL ?? '').replace(/\/+$/, '');
  private domain = process.env.MAIL_DOMAIN ?? '';
  private auth = process.env.MAIL_API_AUTH ?? '';
  private email = '';
  private messageId = '';
  /** Кэш писем по Mailpit ID, чтобы extract-методы не перечитывали API. */
  private cache = new Map<string, EmailMessage>();

  // request не нужен (используется глобальный fetch), принимается для совместимости сигнатуры.
  constructor(_request?: APIRequestContext) {
    if (!this.apiUrl || !this.domain || !this.auth) {
      throw new Error('MAIL_API_URL, MAIL_DOMAIN и MAIL_API_AUTH должны быть заданы в env для MailpitHelper');
    }
  }

  /** Уникальный адрес на catch-all домене: `qa_<ts>_<rnd>@<MAIL_DOMAIN>`. */
  generateEmail(): string {
    const rnd = Math.random().toString(36).slice(2, 8);
    this.email = `qa_${Date.now()}_${rnd}@${this.domain}`;
    return this.email;
  }

  /** Совместимость сигнатур (см. gmailHelper.ts): ящик не создаётся — catch-all. */
  async createMailbox(): Promise<void> {}

  /** Возвращает «token» = адрес-получатель — ключ фильтрации писем. */
  async getToken(email: string, _password?: string): Promise<string> {
    this.email = email;
    return email;
  }

  private async api<T>(path: string): Promise<T> {
    const res = await fetch(this.apiUrl + path, {
      headers: { Authorization: 'Basic ' + Buffer.from(this.auth).toString('base64') },
    });
    if (!res.ok) throw new Error(`Mailpit API ${path} ответил ${res.status}`);
    return res.json() as Promise<T>;
  }

  /**
   * Ждёт письмо с темой, содержащей subjectText, адресованное `token`.
   * Поиск по получателю через API, тема и afterTimestamp фильтруются на клиенте
   * (семантика идентична GmailHelper). Возвращает Mailpit ID (строкой).
   */
  async waitForMessage(
    token: string,
    subjectText: string,
    retries = 10,
    delayMs = 3000,
    afterTimestamp?: number,
  ): Promise<string> {
    if (!token) {
      throw new Error('Recipient token (email address) is missing. Cannot fetch messages from Mailpit.');
    }
    const query = encodeURIComponent(`to:"${token}"`);

    for (let i = 0; i < retries; i++) {
      try {
        const data = await this.api<{
          messages: { ID: string; Subject: string; Created: string }[];
        }>(`/api/v1/search?query=${query}&limit=50`);

        // Mailpit отдаёт свежайшие первыми.
        for (const msg of data.messages ?? []) {
          if (!msg.Subject?.toLowerCase().includes(subjectText.toLowerCase())) continue;
          if (afterTimestamp !== undefined && new Date(msg.Created).getTime() <= afterTimestamp) continue;
          this.messageId = msg.ID;
          return msg.ID;
        }
      } catch {
        // транспортный сбой — просто следующая попытка
      }
      await new Promise(r => setTimeout(r, delayMs));
    }

    throw new Error(`Mailpit timeout: письмо "${subjectText}" не пришло на ${token}`);
  }

  /** Достаёт письмо по Mailpit ID: из кэша (после waitForMessage) либо из API. */
  private async getEmailById(id: string): Promise<EmailMessage> {
    const cached = this.cache.get(id);
    if (cached) return cached;

    const m = await this.api<{
      Subject: string;
      From: { Name: string; Address: string } | null;
      Text: string;
      HTML: string;
    }>(`/api/v1/message/${id}`);

    const em: EmailMessage = {
      subject: m.Subject ?? '',
      fromAddress: m.From?.Address ?? '',
      fromName: m.From?.Name ?? '',
      text: m.Text ?? '',
      html: m.HTML ?? '',
    };
    this.cache.set(id, em);
    return em;
  }

  async extractVerificationUrl(messageId?: string, _token?: string): Promise<string> {
    const id = messageId ?? this.messageId;
    if (!id) throw new Error('messageId is required');
    const { text, html } = await this.getEmailById(id);
    const body = `${text}\n${html}`;
    const verifyMatch = body.match(/https:\/\/[^\s/]+\/verification\?[^\s)"'<>]+/);
    if (verifyMatch) return verifyMatch[0];
    throw new Error('Verification URL not found in email');
  }

  async extractPasswordResetnUrl(messageId: string, _token?: string): Promise<string> {
    const { text, html } = await this.getEmailById(messageId);
    const body = `${text}\n${html}`;
    const verifyMatch = body.match(/https:\/\/[^\s/]+\/reset-password\?[^\s"'<>)]*/i);
    if (verifyMatch) return verifyMatch[0];
    throw new Error('Reset Password URL not found in email');
  }

  async extract2FACode(messageId: string, _token?: string): Promise<string[]> {
    const { text, html } = await this.getEmailById(messageId);
    const body = `${text}\n${html}`;
    // В реальном письме код — среди HTML-шаблона; берём отдельно стоящую 4-значную группу.
    const match = body.match(/\b(\d{4})\b/);
    if (!match) throw new Error(`2FA code not found in email`);
    return match[1].split('');
  }

  async extractVerificationCode(messageId: string, _token?: string): Promise<string> {
    const { text, html } = await this.getEmailById(messageId);
    const body = `${text}\n${html}`;
    const match = body.match(/\b(\d{4,8})\b/);
    if (match) return match[1];
    throw new Error('Verification code not found in email');
  }

  /** Полное содержимое письма для проверок контента шаблонов. */
  async getMessage(messageId: string, _token?: string): Promise<EmailMessage> {
    return this.getEmailById(messageId);
  }
}
