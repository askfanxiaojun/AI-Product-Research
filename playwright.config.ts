import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',use:{launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH},baseURL:'http://127.0.0.1:4321/AI-Product-Research/'},webServer:{command:'npx astro preview --host 127.0.0.1',url:'http://127.0.0.1:4321/AI-Product-Research/',reuseExistingServer:false,timeout:30000}});
