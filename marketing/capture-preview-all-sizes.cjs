const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SIZES = [
  { width: 1242, height: 2688 },
  { width: 2688, height: 1242 },
  { width: 1284, height: 2778 },
  { width: 2778, height: 1284 },
];

const PREVIEWS = [
  { file: 'preview-1-sos.html', label: 'preview-1-emergency-sos', waitTime: 9000 },
  { file: 'preview-2-rights.html', label: 'preview-2-gps-rights', waitTime: 9000 },
  { file: 'preview-3-ai.html', label: 'preview-3-ai-features', waitTime: 15000 },
];

async function main() {
  const outputDir = path.join(__dirname, 'preview-images');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  for (const size of SIZES) {
    const sizeDir = path.join(outputDir, `${size.width}x${size.height}`);
    if (!fs.existsSync(sizeDir)) fs.mkdirSync(sizeDir, { recursive: true });
  }

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });

  for (const size of SIZES) {
    const isLandscape = size.width > size.height;
    console.log(`\nCapturing ${size.width}x${size.height} (${isLandscape ? 'landscape' : 'portrait'})...`);

    for (const preview of PREVIEWS) {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      const filePath = `file://${path.join(__dirname, preview.file)}`;
      await page.goto(filePath, { waitUntil: 'load' });

      await page.evaluate(({ w, h, landscape }) => {
        const body = document.body;
        body.style.width = w + 'px';
        body.style.height = h + 'px';

        if (landscape) {
          const content = document.querySelector('.content');
          if (content) {
            content.style.flexDirection = 'row';
            content.style.flexWrap = 'wrap';
            content.style.alignContent = 'center';
            content.style.justifyContent = 'center';
            content.style.gap = '40px';
            content.style.padding = '40px';
          }
          const topText = document.querySelector('.top-text');
          if (topText) {
            topText.style.marginTop = '0';
            topText.style.maxWidth = '45%';
            topText.style.textAlign = 'left';
            const h1 = topText.querySelector('h1');
            if (h1) h1.style.fontSize = '52px';
            const p = topText.querySelector('p');
            if (p) { p.style.fontSize = '24px'; p.style.padding = '0'; }
          }
          const phone = document.querySelector('.phone');
          if (phone) {
            phone.style.width = '380px';
            phone.style.height = '780px';
            phone.style.marginTop = '0';
            phone.style.borderRadius = '36px';
            phone.style.flexShrink = '0';
          }
          const bottomText = document.querySelector('.bottom-text');
          if (bottomText) {
            bottomText.style.position = 'static';
            bottomText.style.marginTop = '20px';
            bottomText.style.width = '100%';
          }
          const statsRow = document.querySelector('.stats-row');
          if (statsRow) {
            statsRow.style.position = 'static';
            statsRow.style.marginTop = '20px';
          }
        }

        document.querySelectorAll('.show, [class*="show"]').forEach(() => {});
        document.querySelectorAll('.top-text, .phone, .bottom-text, .stats-row, .alert-card, .rights-card, .chat-msg, .coach-msg, .risk-box, .feat-card, .gps-anim, .state-badge, .typing, .screen-1, .screen-2, .screen-3').forEach(el => {
          el.classList.add('show');
        });
      }, { w: size.width, h: size.height, landscape: isLandscape });

      await page.waitForTimeout(preview.waitTime);

      const sizeDir = path.join(outputDir, `${size.width}x${size.height}`);
      const filepath = path.join(sizeDir, `${preview.label}-${size.width}x${size.height}.png`);
      await page.screenshot({ path: filepath, clip: { x: 0, y: 0, width: size.width, height: size.height } });
      console.log(`  Saved: ${preview.label}-${size.width}x${size.height}.png`);
      await context.close();
    }
  }

  await browser.close();
  console.log('\nDone! All preview images saved.');
}

main().catch(console.error);
