const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SIZES = [
  { name: '6.5-portrait', width: 1242, height: 2688 },
  { name: '6.5-landscape', width: 2688, height: 1242 },
  { name: '6.7-portrait', width: 1284, height: 2778 },
];

const SCREENSHOTS = [
  { id: 'screenshot-1', label: 'hero' },
  { id: 'screenshot-2', label: 'gps-rights' },
  { id: 'screenshot-3', label: 'emergency-sos' },
  { id: 'screenshot-4', label: 'ai-voice-coach' },
  { id: 'screenshot-5', label: 'attorney-connect' },
  { id: 'screenshot-6', label: 'all-features' },
];

async function captureScreenshots() {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  for (const size of SIZES) {
    const sizeDir = path.join(outputDir, `${size.width}x${size.height}`);
    if (!fs.existsSync(sizeDir)) fs.mkdirSync(sizeDir, { recursive: true });
  }

  const browser = await chromium.launch({ args: ['--no-sandbox'] });

  for (const size of SIZES) {
    console.log(`\nCapturing ${size.width}x${size.height}...`);
    const isLandscape = size.width > size.height;

    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    const filePath = `file://${path.join(__dirname, 'screenshots.html')}`;
    await page.goto(filePath, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    if (isLandscape) {
      await page.evaluate(({ w, h }) => {
        document.querySelectorAll('.screenshot').forEach(el => {
          el.style.width = w + 'px';
          el.style.height = h + 'px';
          el.style.flexDirection = 'row';
          el.style.flexWrap = 'wrap';
          el.style.alignContent = 'center';
          el.style.justifyContent = 'center';
          el.style.gap = '40px';
          const phone = el.querySelector('.phone-frame');
          if (phone) {
            phone.style.width = '400px';
            phone.style.height = '820px';
            phone.style.marginTop = '0';
            phone.style.borderRadius = '36px';
          }
          const headline = el.querySelector('.headline');
          if (headline) {
            headline.style.fontSize = '48px';
            headline.style.padding = '0 40px';
            headline.style.maxWidth = '900px';
          }
          const subheadline = el.querySelector('.subheadline');
          if (subheadline) {
            subheadline.style.fontSize = '24px';
            subheadline.style.padding = '0 40px';
            subheadline.style.maxWidth = '900px';
          }
        });
      }, { w: size.width, h: size.height });
      await page.waitForTimeout(500);
    }

    for (const ss of SCREENSHOTS) {
      const el = await page.$(`#${ss.id}`);
      if (!el) {
        console.log(`  Skipping ${ss.id} - not found`);
        continue;
      }

      const sizeDir = path.join(__dirname, 'output', `${size.width}x${size.height}`);
      const filename = `${ss.label}-${size.width}x${size.height}.png`;
      const filepath = path.join(sizeDir, filename);

      await el.screenshot({ path: filepath });
      console.log(`  Saved: ${filename}`);
    }

    await context.close();
  }

  await browser.close();
  console.log('\nDone! Screenshots saved to marketing/output/');
}

captureScreenshots().catch(console.error);
