import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-unsafe-webgpu', '--no-sandbox'],
});

const page = await browser.newPage({
  viewport: { width: 1440, height: 960 },
  deviceScaleFactor: 1,
});

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.screenshot({
  path: '/home/senik/Desktop/type-gpu-playground/nebula-forge.png',
});

await browser.close();
