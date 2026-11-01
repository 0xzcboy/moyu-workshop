import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:4321', channel: 'msedge', headless: true },
  webServer: { command: 'npm run dev -- --port 4321', url: 'http://127.0.0.1:4321', reuseExistingServer: !process.env.CI, timeout: 120000 },
});
