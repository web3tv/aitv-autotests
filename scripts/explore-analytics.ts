import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

dotenv.config({ path: path.resolve(__dirname, '../.env.web3tv2') });

const API_URL    = process.env.API_URL!;
const BASE_URL   = process.env.BASE_URL!;
const STUDIO_URL = process.env.STUDIO_URL!;
const PASSWORD   = process.env.USER_PASSWORD!;
const ADMIN_USER = process.env.USER_LOGIN_ADMIN!;
const DOMAIN     = process.env.EMAIL_DOMAIN ?? 'aitv-test.com';
const CLIENT_ID  = 'fa281fa9-ea9c-467e-a0f1-776876c3ad76';

async function pkceToken(username: string, password: string) {
    const verifier  = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    const authRes = await fetch(
        `${API_URL}/auth/authorize?client_id=${CLIENT_ID}&response_type=json` +
        `&code_challenge=${challenge}&code_challenge_method=S256&scope=user`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) }
    );
    const authJson = await authRes.json();
    if (!authJson.code) throw new Error(`Authorize failed: ${JSON.stringify(authJson)}`);
    const tokenRes = await fetch(`${API_URL}/auth/token`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant_type: 'authorization_code', client_id: CLIENT_ID, code: authJson.code, code_verifier: verifier }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenJson.access_token) throw new Error(`Token failed: ${JSON.stringify(tokenJson)}`);
    return tokenJson.access_token as string;
}

async function createAndVerifyUser() {
    const ts = Date.now();
    const username = `explore${ts}`;
    const email = `${username}@${DOMAIN}`;
    const reg = await fetch(`${API_URL}/user/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, plain_password: PASSWORD }),
    });
    if (!reg.ok) throw new Error(`Register failed: ${reg.status} ${await reg.text()}`);
    const regJson = await reg.json();
    const userId = regJson.id ?? regJson.data?.id;
    const adminToken = await pkceToken(ADMIN_USER, PASSWORD);
    const verify = await fetch(`${API_URL}/admin/user/${userId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ email, roles: ['ROLE_USER_VERIFIED'] }),
    });
    if (!verify.ok) throw new Error(`Verify failed: ${verify.status} ${await verify.text()}`);
    return { email, username, token: await pkceToken(email, PASSWORD) };
}

async function getChannelId(token: string): Promise<string> {
    const res = await fetch(`${API_URL}/channels?mine=true&maxResults=50`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    const channelId = json?.data?.items?.[0]?.id ?? json?.items?.[0]?.id;
    if (!channelId) throw new Error('No channel found');
    return channelId;
}

async function getCategoryId(): Promise<number> {
    const res = await fetch(`${API_URL}/videos/categories/`, { headers: { Accept: 'application/json' } });
    const json = await res.json();
    const items = json?.items ?? json?.data?.items ?? [];
    return items[0]?.id;
}

async function uploadVideo(token: string): Promise<string> {
    const channelId = await getChannelId(token);
    const categoryId = await getCategoryId();
    const videoPath = path.resolve(__dirname, '../test-data/fixtures/video/5secVideo.mp4');
    const fileBuffer = fs.readFileSync(videoPath);
    const size = fileBuffer.length;
    const filename = '5secVideo.mp4';
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 1. Init
    const initRes = await fetch(`${API_URL}/videos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ channelId, filename, size, mimeType: 'video/mp4', checksum }),
    });
    if (!initRes.ok) throw new Error(`Init upload failed: ${initRes.status} ${await initRes.text()}`);
    const initJson = await initRes.json();
    const videoId = initJson?.data?.id ?? initJson?.id;
    console.log('Video ID:', videoId);

    // 2. Upload chunk (octet-stream)
    const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const MAX_CHUNK_SIZE = 52428800;
    const contentRange = `bytes 0-${size}/${size}/${MAX_CHUNK_SIZE}`;

    const uploadRes = await fetch(`${API_URL}/videos/${videoId}/chunk`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/octet-stream',
            'Authorization': `Bearer ${token}`,
            'Content-Range': contentRange,
            'Content-MD5': md5Hash,
            'Content-Checksum': checksum,
        },
        body: fileBuffer,
    });
    if (!uploadRes.ok && uploadRes.status !== 202) {
        throw new Error(`Upload chunk failed: ${uploadRes.status} ${await uploadRes.text()}`);
    }

    // 3. Complete
    const completeRes = await fetch(`${API_URL}/videos/${videoId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    if (!completeRes.ok) throw new Error(`Complete failed: ${completeRes.status} ${await completeRes.text()}`);

    // 4. Update metadata (multipart)
    const title = `ExploreVideo_${Date.now()}`;
    const boundary = '----PlaywrightFormBoundary' + Date.now();
    const fields: Record<string, string> = {
        title,
        description: 'explore test',
        'categoryIds[0]': String(categoryId),
        privacySetting: 'public',
    };
    let formBody = '';
    for (const [name, value] of Object.entries(fields)) {
        formBody += `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;
    }
    formBody += `--${boundary}--\r\n`;

    const updateRes = await fetch(`${API_URL}/videos/${videoId}`, {
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            Authorization: `Bearer ${token}`,
        },
        body: formBody,
    });
    if (!updateRes.ok) throw new Error(`Update metadata failed: ${updateRes.status} ${await updateRes.text()}`);

    // 5. Wait for processing
    console.log('Video uploaded, waiting for processing...');
    for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const studioRes = await fetch(`${API_URL}/videos/studio/?withFacets=true&id=${videoId}&type=video`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const studioJson = await studioRes.json();
        const state = (studioJson?.data?.items ?? studioJson?.items)?.[0]?.status?.uploadState;
        console.log(`Processing state: ${state}`);
        if (state === 'completed') break;
        if (state === 'failed') throw new Error('Video processing failed');
    }
    return videoId;
}

(async () => {
    console.log('Creating user...');
    const { email, username, token } = await createAndVerifyUser();
    // console.log(`User: ${email}`);

    // console.log('Uploading video...');
    await uploadVideo(token);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('textbox', { name: 'Enter email or username' }).fill(email);
    await page.getByRole('textbox', { name: 'Enter password' }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/', { timeout: 30_000 });
    await page.waitForResponse(r => r.url().includes('/api/users/whoami'), { timeout: 30_000 });
    console.log('Logged in');

    await page.goto(`${STUDIO_URL}/analytics`, { waitUntil: 'domcontentloaded' });
    try {
        await page.waitForResponse(
            r => r.url().includes('/analytics') && r.url().includes('from=') && r.status() === 200,
            { timeout: 15_000 }
        );
    } catch { /* continue */ }
    await page.waitForTimeout(5000);

    // Screenshot for debugging
    await page.screenshot({ path: path.resolve(__dirname, '../analytics-page.png'), fullPage: true });
    console.log('Screenshot saved to analytics-page.png');

    // Dump all spans
    const allSpans = await page.evaluate(() =>
        Array.from(document.querySelectorAll('span')).map(s => s.innerText?.trim().slice(0, 60))
    );
    console.log('All spans on page:', JSON.stringify(allSpans.slice(0, 50)));

    // Extract elements around "Latest Video" span
    const latestVideoInfo = await page.evaluate(() => {
        function getPath(el: Element, depth = 0): any {
            if (depth > 10 || !el) return null;
            return {
                tag: el.tagName.toLowerCase(),
                class: el.className?.toString().slice(0, 80),
                text: (el.textContent ?? '').trim().slice(0, 80),
                children: Array.from(el.children).map(c => getPath(c, depth + 1)),
            };
        }

        const spans = Array.from(document.querySelectorAll('span'));
        // Use textContent (not innerText) — CSS text-transform doesn't affect textContent
        const lvSpan = spans.find(s => (s.textContent ?? '').trim() === 'Latest Video');
        if (!lvSpan) return { error: 'Latest Video span not found', allSpanTexts: spans.map(s => (s.textContent ?? '').trim().slice(0, 40)) };

        // Walk up to find section
        const ancestors: any[] = [];
        let el: Element | null = lvSpan;
        for (let i = 0; i < 8; i++) {
            el = el?.parentElement ?? null;
            if (el) ancestors.push({
                level: i + 1,
                tag: el.tagName.toLowerCase(),
                class: el.className?.toString().slice(0, 80),
                childCount: el.children.length,
            });
        }

        // Section = 3 levels up from span
        const section3 = lvSpan.parentElement?.parentElement?.parentElement;
        const section4 = section3?.parentElement;
        const section5 = section4?.parentElement;

        return {
            spanFound: true,
            ancestors,
            section3HTML: section3 ? section3.outerHTML.slice(0, 3000) : null,
            section4Tree: section4 ? getPath(section4) : null,
            allPsInSection3: section3 ? Array.from(section3.querySelectorAll('p')).map(p => ({
                text: (p.textContent ?? '').trim().slice(0, 80),
                class: p.className?.toString().slice(0, 80),
            })) : [],
            allSpansInSection3: section3 ? Array.from(section3.querySelectorAll('span')).map(s => ({
                text: (s.textContent ?? '').trim().slice(0, 80),
                class: s.className?.toString().slice(0, 80),
            })) : [],
        };
    });

    const outPath = path.resolve(__dirname, '../latest-video-dom.json');
    fs.writeFileSync(outPath, JSON.stringify(latestVideoInfo, null, 2));
    console.log(`DOM info saved to latest-video-dom.json`);
    console.log(JSON.stringify(latestVideoInfo, null, 2).slice(0, 2000));

    await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
