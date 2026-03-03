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

  async createMailbox(retries = 3, delayMs = 10000) {
    // console.log('Attempting to create mailbox with email:', this.email);

    for (let i = 0; i < retries; i++) {
      const res = await this.request.post(`${this.baseUrl}/accounts`, {
        data: {
          address: this.email,
          password: this.password
        }
      });

      if (res.ok()) {
        // console.log('Mailbox created successfully.');
        return;
      }

      if (res.status() === 429) {
        console.warn(`Too Many Requests. Retrying in ${delayMs}ms... (${i + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }

      throw new Error(`Failed to create mailbox: ${res.statusText()}`);
    }

    throw new Error('Failed to create mailbox after multiple retries due to Too Many Requests.');
  }

  async getToken(email: string, password: string) {
    // console.log('Attempting to fetch token from Mail.tm');

    const res = await this.request.post(`${this.baseUrl}/token`, {
      data: {
        address: email,
        password: password
      }
    });

    if (!res.ok()) {
      if (res.status() === 401) {
        console.error('Invalid credentials provided. Ensure the email and password match the created account.');
      }
      throw new Error(`Failed to fetch token from Mail.tm: ${res.statusText()}`);
    }

    const json = await res.json();
    // console.log('Token received successfully.');
    this.token = json.token;
    return this.token;
  }

  async waitForMessage(
    token: string,
    subjectText: string,
    retries = 10,
    delayMs = 3000,
    afterTimestamp?: number
  ) {
    if (!token) {
      throw new Error('Authorization token is missing. Cannot fetch messages from Mail.tm.');
    }

    for (let i = 0; i < retries; i++) {
      const res = await this.request.get(`${this.baseUrl}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok()) {
        if (res.status() === 401) {
          console.error('Unauthorized error. The token might be invalid or expired.');
        }
        throw new Error(`Failed to fetch messages from Mail.tm: ${res.statusText()}`);
      }

      const json = await res.json();
      const messages = json?.['hydra:member'] ?? [];
      const targetMessage = messages.find(m => {
        if (!m.subject?.includes(subjectText)) {
          return false;
        }

        if (afterTimestamp === undefined) {
          return true;
        }

        const messageTime = new Date(m.createdAt ?? m.receivedAt ?? 0).getTime();
        return messageTime > afterTimestamp;
      });

      if (targetMessage) {
        // console.log(`Found target message with subject: ${targetMessage.subject}`);
        this.messageId = targetMessage.id;
        return this.messageId;
      }

      await new Promise(r => setTimeout(r, delayMs));
    }

    throw new Error(`Mail.tm timeout: письмо "${subjectText}" не пришло`);
  }

  async extractVerificationUrl(messageId?: string, token?: string) {
    const msgId = messageId ?? this.messageId;
    const authToken = token ?? this.token;
    
    if (!msgId || !authToken) {
        throw new Error('messageId and token are required');
    }

    const res = await this.request.get(`${this.baseUrl}/messages/${msgId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const json = await res.json();
    const text = json.text ?? '';

    const verifyMatch = text.match( /https:\/\/web3tv2?\.dev\/verification\?[^\s\)"]+/);
    if (verifyMatch) {
      return verifyMatch[0];
    }

    throw new Error('Verification URL not found in email');
}

  async extractPasswordResetnUrl(messageId:string,token:string) {
    const res = await this.request.get(`${this.baseUrl}/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const json = await res.json();
    const text = json.text ?? '';

    const verifyMatch = text.match( /https:\/\/web3tv2?\.dev\/reset-password\?[^\s"'<>)]*/i);
    if (verifyMatch) {
      return verifyMatch[0];
    }

    throw new Error('Reset Password URL not found in email');
  }

  async extract2FACode(messageId:string,token:string) {
    const res = await this.request.get(`${this.baseUrl}/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const json = await res.json();
    const text = json.text ?? '';

    if (text.length !== 4) {
      throw new Error(`Invalid 2FA code: "${text}"`);
    }

    return text.split('');
  }
}