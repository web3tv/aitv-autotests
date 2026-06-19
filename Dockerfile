FROM mcr.microsoft.com/playwright:v1.57.0-jammy

WORKDIR /app

COPY . .

CMD ["npx", "playwright", "test", "--workers=1","--project=visual-desktop-chromium","--project=visual-mobile-webkit"]
