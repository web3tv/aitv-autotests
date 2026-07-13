import PostalMime from 'postal-mime';

/**
 * Email Worker: принимает письмо из Cloudflare Email Routing (catch-all на
 * lapito.app), парсит MIME и кладёт его в Mailpit через POST /api/v1/send.
 * Полная цепочка: прод/стенд шлёт на qa_*@lapito.app → MX Cloudflare →
 * catch-all → этот Worker → Mailpit (читается тестами через MailpitHelper).
 * Деплой: npx wrangler deploy; секрет: npx wrangler secret put MAILPIT_AUTH.
 */
export default {
  async email(message, env) {
    const parsed = await PostalMime.parse(message.raw);

    const payload = {
      From: {
        Email: parsed.from?.address ?? message.from,
        Name: parsed.from?.name ?? '',
      },
      // message.to — envelope-получатель (qa_...@lapito.app); именно по нему
      // MailpitHelper фильтрует письма, поэтому он обязан попасть в To.
      To: [{ Email: message.to, Name: '' }],
      Subject: parsed.subject ?? '',
      Text: parsed.text ?? '',
      HTML: parsed.html ?? '',
      Headers: { 'Delivered-To': message.to },
    };

    const res = await fetch(`${env.MAILPIT_URL}/api/v1/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(env.MAILPIT_AUTH),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      // throw помечает письмо недоставленным в Activity log Email Routing —
      // сбой виден сразу, а не молча теряется.
      throw new Error(`Mailpit send failed: ${res.status} ${await res.text()}`);
    }
  },
};
