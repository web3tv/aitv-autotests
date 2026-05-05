# План: Создание монорепо (web3tv + aitv)

## Контекст

Текущий репо `web3tv-autotests` нужно превратить в монорепо, поддерживающий два проекта:
- **web3tv** — существующий сайт web3tv.dev
- **aitv** — новый аналог ai.tv, функционально идентичен, отличается только URL и текстовыми assertions ("Web3" → "EITV")

Цель: shared-код (`src/`, `test-data/`) живёт в одном месте, каждый проект имеет свои тесты и конфиги.

---

## Целевая структура

```
autotests/                        ← переименован из web3tv-autotests
  src/                            ← shared (без изменений, остаётся на корне)
    flows/
    pages/
    api/
    utils/
  test-data/                      ← shared (без изменений, остаётся на корне)
    fixtures/
  
  web3tv/                         ← новая папка
    tests/                        ← перемещено из корня tests/
    .env.dev
    .env.dev2
    .env.prod
    playwright.config.ts
    tsconfig.json
    package.json
  
  aitv/                           ← новая папка
    tests/                        ← копия web3tv/tests/ изначально
    .env.dev                      ← новый (aitv URLs)
    .env.prod
    playwright.config.ts
    tsconfig.json
    package.json
  
  tsconfig.base.json              ← общий базовый tsconfig
  package.json                    ← корневой (запуск обоих проектов)
  .gitignore
  CLAUDE.md
  Dockerfile
  .github/
    workflows/
      playwright-web3tv.yml
      playwright-aitv.yml
```

---

## Шаги миграции

### Шаг 1 — Создать папки
```bash
mkdir web3tv aitv
```

### Шаг 2 — Переместить tests/ в web3tv/
```bash
mv tests web3tv/tests
mv .env.dev .env.dev2 .env.prod web3tv/
```

### Шаг 3 — Обновить импорты в тестах web3tv

Все тест-файлы переедут на уровень глубже:
- было: `web3tv-autotests/tests/auth/emailAuth.spec.ts`
- стало: `autotests/web3tv/tests/auth/emailAuth.spec.ts`

Импорты меняются на 1 уровень глубже:

| Было | Станет |
|------|--------|
| `'../../src/flows/...'` | `'../../../src/flows/...'` |
| `'../../src/pages/...'` | `'../../../src/pages/...'` |
| `'../../src/api/...'` | `'../../../src/api/...'` |
| `'../../src/utils/...'` | `'../../../src/utils/...'` |
| `'../../test-data/...'` | `'../../../test-data/...'` |

Команда для замены (запустить из корня):
```bash
find web3tv/tests -name "*.ts" -exec sed -i '' \
  "s|'../../src/|'../../../src/|g; s|\"../../src/|\"../../../src/|g; \
   s|'../../test-data/|'../../../test-data/|g; s|\"../../test-data/|\"../../../test-data/|g" {} +
```

### Шаг 4 — Создать конфиги для web3tv/

**`web3tv/tsconfig.json`:**
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {},
  "include": [
    "tests/**/*.ts",
    "../src/**/*.ts",
    "playwright.config.ts"
  ],
  "exclude": ["node_modules"]
}
```

**`web3tv/playwright.config.ts`:**
```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

if (process.env.ENV_FILE || !process.env.CI) {
  const envFile = process.env.ENV_FILE || '.env.dev';
  dotenv.config({ path: path.resolve(__dirname, envFile), quiet: true });
}

export default defineConfig({
  testDir: './tests',
  expect: { timeout: 10_000 },
  timeout: 90_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list'], ['html', { open: 'always', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'functional',
      testMatch: /^(?!.*visual)(?!.*production).*\.spec\.ts$/,
      use: { browserName: 'chromium', viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'prodSmoke',
      testMatch: /production\/(?!setup).*\.spec\.ts$/,
      use: { browserName: 'chromium', viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'visual-desktop-chromium',
      testMatch: /visualSuite\/desktop\/visualSuites\.spec\.ts$/,
      fullyParallel: false,
      use: { browserName: 'chromium', viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, colorScheme: 'light', locale: 'en-US' },
    },
    {
      name: 'visual-studio-desktop-chromium',
      testMatch: /visualSuite\/desktop\/studioVisualSuites\.spec\.ts$/,
      fullyParallel: false,
      use: { browserName: 'chromium', baseURL: process.env.STUDIO_URL, viewport: { width: 2560, height: 2000 }, deviceScaleFactor: 1, colorScheme: 'light', locale: 'en-US' },
    },
    {
      name: 'visual-mobile-webkit',
      testMatch: /visualSuite\/mobile\/visualSuites\.spec\.ts$/,
      fullyParallel: false,
      use: { ...devices['iPhone 15 Pro Max'] },
    },
  ],
});
```

**`web3tv/package.json`:**
```json
{
  "name": "web3tv-tests",
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test --config=playwright.config.ts",
    "test:functional": "playwright test --project=functional",
    "test:critical": "playwright test --project=functional --grep @critical",
    "test:prod": "ENV_FILE=.env.prod playwright test --project=prodSmoke"
  },
  "devDependencies": {
    "@playwright/test": "^1.57.0",
    "@synthetixio/synpress": "^4.1.2",
    "@types/node": "^24.10.1",
    "typescript": "^5.9.3"
  },
  "dependencies": {
    "dotenv": "^17.2.3",
    "ethers": "^6.16.0",
    "mysql2": "^3.20.0",
    "tronweb": "^6.2.2"
  }
}
```

### Шаг 5 — Создать структуру aitv/

```bash
cp -r web3tv/tests aitv/tests
cp web3tv/playwright.config.ts aitv/playwright.config.ts
cp web3tv/tsconfig.json aitv/tsconfig.json
cp web3tv/package.json aitv/package.json
```

Создать `aitv/.env.dev`:
```
BASE_URL=https://ai.tv
STUDIO_URL=https://studio.ai.tv
API_URL=https://api.ai.tv
USER_PASSWORD=Admin1@@
USER_LOGIN_ADMIN=...
...
```

В aitv/package.json изменить `"name": "aitv-tests"`.

### Шаг 6 — Создать корневые файлы

**`tsconfig.base.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node10",
    "esModuleInterop": true,
    "strict": false,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "types": ["node"],
    "lib": ["ES2022", "DOM"],
    "ignoreDeprecations": "5.0"
  }
}
```

**Корневой `package.json`:**
```json
{
  "name": "autotests",
  "version": "1.0.0",
  "scripts": {
    "test:web3tv": "cd web3tv && npx playwright test --project=functional",
    "test:aitv": "cd aitv && npx playwright test --project=functional",
    "test:all": "npm run test:web3tv && npm run test:aitv",
    "install:all": "cd web3tv && npm install && cd ../aitv && npm install"
  }
}
```

### Шаг 7 — Обновить CI/CD

Разделить `playwright.yml` на два файла:

**`.github/workflows/playwright-web3tv.yml`** — то же что сейчас, но:
- `working-directory: web3tv`
- `env` берёт секреты web3tv

**`.github/workflows/playwright-aitv.yml`** — копия:
- `working-directory: aitv`
- `env` берёт секреты aitv

---

## Как запускать после миграции

```bash
# web3tv — из папки web3tv/
cd web3tv
npx playwright test --project=functional

# web3tv — с другим env
ENV_FILE=.env.dev2 npx playwright test --project=functional

# aitv — из папки aitv/
cd aitv
npx playwright test --project=functional

# оба проекта — из корня
npm run test:all
```

---

## Важные замечания

- `npm install` нужно делать **в каждой папке** (`web3tv/` и `aitv/`) отдельно — или через `npm run install:all` из корня
- `node_modules` в каждом проекте свои (не hoisted на корень)
- `playwright-report` и `test-results` создаются в папке каждого проекта
- Visual тесты (Docker) запускаются из папки проекта: `cd web3tv && docker run ...`
- `.gitignore` обновить: добавить `web3tv/node_modules`, `aitv/node_modules`, `web3tv/playwright-report`, `aitv/playwright-report`

---

## Верификация после миграции

1. `cd web3tv && npm install && npx playwright test tests/auth/emailAuth.spec.ts --project=functional` — должен пройти
2. `cd aitv && npm install && npx playwright test tests/auth/emailAuth.spec.ts --project=functional` — должен пройти (с правильным .env.dev)
3. Проверить что `src/` и `test-data/` доступны из обоих проектов (импорты резолвятся)
