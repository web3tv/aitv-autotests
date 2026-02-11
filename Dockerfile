FROM mcr.microsoft.com/playwright:v1.57.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Браузеры уже включены в официальный playwright image,
# но если хочешь гарантированно — можно оставить:
RUN npx playwright install --with-deps

COPY . .

CMD ["npx", "playwright", "test", "--workers=1","--project=visual-desktop-chromium","--project=visual-mobile-webkit"]

