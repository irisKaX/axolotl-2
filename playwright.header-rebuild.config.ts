import { defineConfig } from '@playwright/test';
export default defineConfig({
  outputDir:'test-results/header-rebuild',
  testDir:'./tests/header-rebuild', timeout:30000, workers:1, retries:0, reporter:'list',
  use:{ baseURL:'http://127.0.0.1:4174/axolotl-2/header-rebuild.html', viewport:{width:1440,height:844}, locale:'cs-CZ', timezoneId:'Europe/Prague', reducedMotion:'reduce', screenshot:'only-on-failure', trace:'retain-on-failure' },
  projects:[{name:'chromium',use:{browserName:'chromium',launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROME_EXECUTABLE || (process.env.CI ? undefined : '/usr/bin/chromium')}}},{name:'webkit',use:{browserName:'webkit'}},{name:'firefox',use:{browserName:'firefox'}}],
  webServer:{command:'npx vite preview --config vite.header-rebuild.config.ts --host 127.0.0.1 --port 4174',url:'http://127.0.0.1:4174/axolotl-2/header-rebuild.html',reuseExistingServer:!process.env.CI},
});
