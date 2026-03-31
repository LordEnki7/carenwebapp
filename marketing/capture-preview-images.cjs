const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const WIDTH = 886;
const HEIGHT = 1920;

const PREVIEWS = [
  { file: 'preview-1-sos.html', label: 'preview-1-emergency-sos', waitTime: 9000 },
  { file: 'preview-2-rights.html', label: 'preview-2-gps-rights', waitTime: 9000 },
  { file: 'preview-3-ai.html', label: 'preview-3-ai-features', waitTime: 15000 },
];

async function main() {
  const outputDir = path.join(__dirname, 'preview-images');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });

  for (const preview of PREVIEWS) {
    console.log(`Capturing ${preview.label}...`);
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const filePath = `file://${path.join(__dirname, preview.file)}`;
    await page.goto(filePath, { waitUntil: 'load' });
    await page.waitForTimeout(preview.waitTime);

    const filepath = path.join(outputDir, `${preview.label}-${WIDTH}x${HEIGHT}.png`);
    await page.screenshot({ path: filepath, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    console.log(`  Saved: ${preview.label}-${WIDTH}x${HEIGHT}.png`);
    await context.close();
  }

  await browser.close();
  console.log('\nDone!');
}

main().catch(console.error);
