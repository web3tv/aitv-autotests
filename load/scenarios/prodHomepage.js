// Прод-сценарий (по запросу лида, Slack 13.08.2026): нагрузка на главную ai.tv.
// Регулярный прогон — через воркфлоу .github/workflows/weekly-load.yml.
// Локально гонять ТОЛЬКО в согласованное окно: это живой прод с реальными юзерами.
//
// Запуск: ENV_FILE=.env.prod bash scripts/runLoad.sh load/scenarios/prodHomepage.js
//         PROFILE=full ENV_FILE=.env.prod bash scripts/runLoad.sh load/scenarios/prodHomepage.js
import { check, sleep } from 'k6';
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'https://ai.tv';

// See https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/
const PROFILES = {
    // Осторожный прогон для первого/супервизируемого запуска на проде.
    smoke: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 10 },
        { duration: '30s', target: 0 },
    ],
    // Профиль лида: разгон до 100 VU за 10 минут + плавный спад.
    full: [
        { duration: '10m', target: 100 },
        { duration: '1m', target: 0 },
    ],
};

export const options = {
    stages: PROFILES[__ENV.PROFILE || 'smoke'],
    thresholds: {
        http_req_failed: ['rate<0.02'],    // http errors should be less than 2%
        http_req_duration: ['p(95)<5000'], // 95% of requests should be below 5s
        checks: ['rate>0.99'],
    },
};

export default function main() {
    const response = http.get(`${BASE_URL}/`);
    check(response, { 'home page is 200': (r) => r.status === 200 });
    sleep(1);
}
