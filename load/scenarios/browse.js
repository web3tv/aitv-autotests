// Нагрузочный сценарий «анонимный сёрфинг»: главная → публичный листинг видео →
// карточка случайного видео → страница канала фикстуры @qavischan.
// Только чтение, без авторизации — ничего на стенде не мутирует.
//
// Запуск: bash scripts/runLoad.sh            (smoke: 5 VU / 30s, дефолт)
//         PROFILE=load bash scripts/runLoad.sh  (полка: 50 VU / 8 мин)
import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL;
const API_URL = __ENV.API_URL;
const FIXTURE_CHANNEL_HANDLE = 'qavischan';

const PROFILES = {
    // Дымовой прогон — проверить, что сценарий жив, стенд не грузит.
    smoke: [
        { duration: '30s', target: 5 },
    ],
    // Базовый нагрузочный профиль: разгон → полка → спад.
    load: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '1m', target: 0 },
    ],
};
// weekly-load.yml зовёт полный профиль `full` (единый селектор с prodHomepage.js).
PROFILES.full = PROFILES.load;

export const options = {
    stages: PROFILES[__ENV.PROFILE || 'smoke'],
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<800'],
        checks: ['rate>0.99'],
    },
};

export default function () {
    group('home page', () => {
        const res = http.get(`${BASE_URL}/`);
        check(res, { 'home page is 200': (r) => r.status === 200 });
    });
    sleep(1);

    let videoIds = [];
    group('public video listing', () => {
        const res = http.get(`${API_URL}/videos/?maxResults=12`);
        const ok = check(res, {
            'video listing is 200': (r) => r.status === 200,
            'video listing has items': (r) => (r.json('items') || []).length > 0,
        });
        if (ok) {
            videoIds = (res.json('items') || []).map((v) => v.id).filter(Boolean);
        }
    });
    sleep(1);

    group('video detail', () => {
        if (videoIds.length === 0) return;
        const id = videoIds[Math.floor(Math.random() * videoIds.length)];
        const res = http.get(`${API_URL}/videos/?id=${id}`);
        check(res, {
            'video detail is 200': (r) => r.status === 200,
            'video detail returns the video': (r) => (r.json('items') || []).length > 0,
        });
    });
    sleep(1);

    group('channel page', () => {
        const res = http.get(`${BASE_URL}/@${FIXTURE_CHANNEL_HANDLE}`);
        check(res, { 'channel page is 200': (r) => r.status === 200 });
    });
    sleep(2);
}
