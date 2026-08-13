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

// BASELINE / норма для детекта регресса (прод ai.tv, 100 VU).
// Порог вешаем на СЕРВЕРНЫЕ, портируемые метрики — TTFB (http_req_waiting) и ошибки.
// НЕ на http_req_duration: под ним сидит время скачивания 754-КБ главной, которое
// упирается в канал раннера (на ноутбуке ~57 Мбит/с), а не в прод — с другой машины
// эта цифра невалидна. duration оставлен справочным (широкий предел, не гейт).
//
// Норму снимать с ФИКСИРОВАННОГО стенда (GitHub-раннер weekly-load.yml), не с ноутбука,
// иначе baseline меняется от сети к сети. Текущие значения — с прод-прогона 13.08.2026
// (load/reports/prod-homepage-20260813-1255.json): TTFB med 0.53s, p95 2.64s, ошибок 0%.
// Пороги = текущее + запас; ужимать по мере накопления чистых прогонов из CI.
export const options = {
    stages: PROFILES[__ENV.PROFILE || 'smoke'],
    thresholds: {
        'http_req_waiting': ['med<1000', 'p(95)<3000'], // TTFB: сервер. Регресс — сюда
        'http_req_failed': ['rate<0.01'],               // ошибок < 1% (baseline 0%)
        'checks': ['rate>0.99'],
        'http_req_duration': ['p(95)<60000'],           // справочный, ловит только катастрофу
    },
};

export default function main() {
    const response = http.get(`${BASE_URL}/`);
    check(response, { 'home page is 200': (r) => r.status === 200 });
    sleep(1);
}
