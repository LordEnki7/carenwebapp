const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SIZES = [
  { width: 2048, height: 2732, label: '2048x2732' },
  { width: 2064, height: 2752, label: '2064x2752' },
];

const BASE_URL = 'http://localhost:5000';

const PAGES = [
  { path: '/',              label: '01-landing',      waitTime: 3000 },
  { path: '/onboarding',   label: '02-onboarding',   waitTime: 4000 },
  { path: '/dashboard',    label: '03-dashboard',    waitTime: 4000 },
  { path: '/rights',       label: '04-legal-rights', waitTime: 4000 },
  { path: '/emergency',    label: '05-emergency',    waitTime: 4000 },
  { path: '/ai-assistant', label: '06-ai-assistant', waitTime: 4000 },
  { path: '/record',       label: '07-recording',    waitTime: 4000 },
  { path: '/location',     label: '08-location',     waitTime: 4000 },
  { path: '/referral',     label: '09-referral',     waitTime: 4000 },
  { path: '/settings',     label: '10-settings',     waitTime: 4000 },
];

async function main() {
  const outDir = path.join(__dirname, 'appstore-ipad-screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });

  for (const size of SIZES) {
    const sizeDir = path.join(outDir, size.label);
    if (!fs.existsSync(sizeDir)) fs.mkdirSync(sizeDir, { recursive: true });
    console.log(`\n=== Capturing ${size.label} ===`);

    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: 1, // Must be 1 — App Store requires exact pixel dimensions, not retina-doubled
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });

    const page = await context.newPage();

    // Log in as demo user first
    try {
      await page.goto(`${BASE_URL}/api/auth/demo-login`, { waitUntil: 'networkidle', timeout: 10000 });
    } catch(e) {
      console.log('  Demo login attempt done');
    }

    for (const pg of PAGES) {
      try {
        console.log(`  Capturing ${pg.label}...`);
        await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(pg.waitTime);

        const outPath = path.join(sizeDir, `${pg.label}-${size.label}.png`);
        await page.screenshot({
          path: outPath,
          clip: { x: 0, y: 0, width: size.width, height: size.height },
        });
        const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
        console.log(`  -> ${pg.label}-${size.label}.png (${kb} KB)`);
      } catch(e) {
        console.log(`  -> FAILED ${pg.label}: ${e.message.slice(0, 80)}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('\n=== All iPad screenshots done! ===');
  console.log(`Output: marketing/appstore-ipad-screenshots/`);
}

main().catch(console.error);
