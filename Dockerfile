FROM mcr.microsoft.com/playwright:v1.57.0-jammy

# Install dependencies in /deps so they survive the -v "$PWD:/app" bind mount
WORKDIR /deps
COPY package*.json ./
RUN npm ci
RUN npx playwright install --with-deps

ENV PATH="/deps/node_modules/.bin:$PATH"
ENV NODE_PATH="/deps/node_modules"

WORKDIR /app
COPY . .

CMD ["playwright", "test", "--workers=1","--project=visual-desktop-chromium","--project=visual-mobile-webkit"]

