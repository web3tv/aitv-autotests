import { APIRequestContext } from '@playwright/test';

export class MailTmHelper {
  private request: APIRequestContext;
  private baseUrl = 'https://api.mail.tm';
  private email = '';
  private password = 'StrongPass123!';
  private token = '';
  private messageId = '';
  private domain = '';

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async generateEmail() {
    const res = await this.request.get(`${this.baseUrl}/domains`);
    const data = await res.json();
    this.domain = data['hydra:member'][0].domain;

    this.email = `qa_${Date.now()}@${this.domain}`;
    return this.email;
  }

  async createMailbox() {
    await this.request.post(`${this.baseUrl}/accounts`, {
      data: {
        address: this.email,
        password: this.password
      }
    });
  }

  // 3. Получить токен
  async getToken(email:string,password:string) {
    const res = await this.request.post(`${this.baseUrl}/token`, {
      data: {
        address: email,
        password: password
      }
    });

    const json = await res.json();
    this.token = json.token;

    return this.token;
  }

  // 4. POLLING писем (ждём письмо от Web3TV)
  async waitForMessage(token: string,subjectText: string,retries = 10, delayMs = 3000) {
    for (let i = 0; i < retries; i++) {
      const res = await this.request.get(`${this.baseUrl}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });


      const json = await res.json();
      const messages = json?.['hydra:member'] ?? [];

      const targetMessage = messages.find(m =>
        m.subject?.includes(subjectText)
      );

      if (targetMessage) {
        this.messageId = targetMessage.id;
        return this.messageId;
      }

      await new Promise(r => setTimeout(r, delayMs));
    }

    throw new Error(`Mail.tm timeout: письмо "${subjectText}" не пришло`);
  }

  // 5. Забрать письмо по ID + достать verification URL
  async extractVerificationUrl() {
    const res = await this.request.get(`${this.baseUrl}/messages/${this.messageId}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });

    const json = await res.json();
    const text = json.text ?? '';

    const verifyMatch = text.match(/https:\/\/web3tv\.dev\/verification\?[^\s\)"]+/);
    if (verifyMatch) {
      return verifyMatch[0];
    }

    throw new Error('Verification URL not found in email');
  }

  // 5. Забрать письмо по ID + достать verification URL
  // async extractVerificationUrl() {
  //   const res = await this.request.get(`${this.baseUrl}/messages/${this.messageId}`, {
  //     headers: { Authorization: `Bearer ${this.token}` }
  //   });

  //   const json = await res.json();
  //   const html = json.html?.[0] ?? '';

  //   let link = null;

  //   // 1. Ищем tracking-ссылку (ПРАВИЛЬНАЯ)
  //   const trackingMatch = html.match(/https?:\/\/url\d+\.web3\.tv\/[^\s"']+/i);
  //   if (trackingMatch) {
  //     link = trackingMatch[0];
  //     return link;
  //   }

  //   // 2. fallback — обычная verification ссылка
  //   const verifyMatch = html.match(/https:\/\/web3tv\.dev\/verification[^\s"']+/i);
  //   if (verifyMatch) {
  //     return verifyMatch[0];
  //   }

  //   // 3. fallback — первый href
  //   const hrefMatch = html.match(/href="([^"]+)"/i);
  //   if (hrefMatch) {
  //     return hrefMatch[1];
  //   }

  //   throw new Error('Verification URL not found in email');
  // }

  async extractPasswordResetnUrl(messageId:string,token:string) {
    const res = await this.request.get(`${this.baseUrl}/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const json = await res.json();
    const text = json.text ?? '';

    const verifyMatch = text.match( /https:\/\/web3tv\.dev\/reset-password\?[^\s"'<>)]*/i);
    if (verifyMatch) {
      return verifyMatch[0];
    }

    throw new Error('Reset Password URL not found in email');
  }
}