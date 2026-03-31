const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const WIDTH = 886;
const HEIGHT = 1920;
const FPS = 10;

const PREVIEWS = [
  { file: 'preview-1-sos.html', label: 'preview-1-emergency-sos', duration: 10000, frames: 100 },
  { file: 'preview-2-rights.html', label: 'preview-2-gps-rights', duration: 10000, frames: 100 },
  { file: 'preview-3-ai.html', label: 'preview-3-ai-features', duration: 16000, frames: 160 },
];

async function capturePreview(browser, preview) {
  const outputDir = path.join(__dirname, 'previews');
  const framesDir = path.join(outputDir, `${preview.label}-frames`);

  if (fs.existsSync(framesDir)) fs.rmSync(framesDir, { recursive: true });
  fs.mkdirSync(framesDir, { recursive: true });

  console.log(`\nCapturing ${preview.label} (${preview.frames} frames @ ${FPS}fps)...`);

  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const filePath = `file://${path.join(__dirname, preview.file)}`;
  await page.goto(filePath, { waitUntil: 'load' });

  const interval = preview.duration / preview.frames;

  for (let i = 0; i < preview.frames; i++) {
    const framePath = path.join(framesDir, `frame-${String(i).padStart(5, '0')}.jpg`);
    await page.screenshot({
      path: framePath,
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
      type: 'jpeg',
      quality: 90
    });
    if (i % 20 === 0) console.log(`  ${Math.round(i / preview.frames * 100)}%`);
    await page.waitForTimeout(interval);
  }

  console.log(`  100% - Encoding...`);
  await context.close();

  const videoPath = path.join(outputDir, `${preview.label}-${WIDTH}x${HEIGHT}.mp4`);
  try {
    execSync(
      `ffmpeg -y -framerate ${FPS} -i "${framesDir}/frame-%05d.jpg" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 20 -r 30 -s ${WIDTH}x${HEIGHT} "${videoPath}"`,
      { stdio: 'pipe', timeout: 30000 }
    );
    console.log(`  Saved: ${path.basename(videoPath)}`);
  } catch (err) {
    console.error(`  Encoding error: ${err.message}`);
  }

  fs.rmSync(framesDir, { recursive: true });
}

async function main() {
  const outputDir = path.join(__dirname, 'previews');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });

  for (const preview of PREVIEWS) {
    await capturePreview(browser, preview);
  }

  await browser.close();
  console.log('\nDone! Videos saved to marketing/previews/');
}

main().catch(console.error);
