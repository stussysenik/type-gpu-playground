import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-unsafe-webgpu', '--no-sandbox'],
});

const page = await browser.newPage();
page.on('console', (msg) => {
  console.log(`console:${msg.type()}: ${msg.text()}`);
});
page.on('pageerror', (error) => {
  console.log(`pageerror: ${error.message}`);
});

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const diagnostics = await page.evaluate(async () => {
  const hasGpu = Boolean(navigator.gpu);
  let adapter = null;
  let features = [];
  if (hasGpu) {
    adapter = await navigator.gpu.requestAdapter();
    features = adapter ? Array.from(adapter.features.values()) : [];
  }

  return {
    hasGpu,
    adapter: Boolean(adapter),
    features,
    text: document.body.innerText,
  };
});

console.log(JSON.stringify(diagnostics, null, 2));
await browser.close();
