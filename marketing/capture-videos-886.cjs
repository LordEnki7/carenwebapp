const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const baseDir = '/home/runner/workspace/marketing';
const outDir = path.join(baseDir, 'preview-videos');

const PREVIEWS = [
  { file: 'preview-1-sos.html', label: 'preview-1-emergency-sos', duration: 10000 },
  { file: 'preview-2-rights.html', label: 'preview-2-gps-rights', duration: 10000 },
  { file: 'preview-3-ai.html', label: 'preview-3-ai-features', duration: 16000 },
];

async function main() {
  // Portrait: 886x1920
  const portraitDir = path.join(outDir, '886x1920');
  fs.mkdirSync(portraitDir, { recursive: true });

  const tempDir = path.join(outDir, 'temp');
  fs.mkdirSync(tempDir, { recursive: true });

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });

  for (const preview of PREVIEWS) {
    console.log(`Recording portrait: ${preview.label}...`);

    const context = await browser.newContext({
      viewport: { width: 886, height: 1920 },
      deviceScaleFactor: 1,
      recordVideo: { dir: tempDir, size: { width: 886, height: 1920 } },
    });

    const page = await context.newPage();
    await page.goto('file://' + path.join(baseDir, preview.file), { waitUntil: 'load' });
    await page.evaluate(({ w, h }) => {
      document.body.style.width = w + 'px';
      document.body.style.height = h + 'px';
    }, { w: 886, h: 1920 });

    await page.waitForTimeout(preview.duration);
    const video = page.video();
    await page.close();
    await context.close();

    if (video) {
      const srcPath = await video.path();
      await new Promise(r => setTimeout(r, 1500));
      if (fs.existsSync(srcPath)) {
        const mp4Path = path.join(portraitDir, `${preview.label}-886x1920.mp4`);
        execSync(`ffmpeg -y -i "${srcPath}" -an -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.2 -preset medium -crf 18 -r 30 -vf "scale=886:1920:flags=lanczos,setsar=1:1" -movflags +faststart "${mp4Path}" 2>/dev/null`, { timeout: 45000 });
        console.log(`  Saved: ${(fs.statSync(mp4Path).size/1024/1024).toFixed(1)} MB`);
        fs.unlinkSync(srcPath);
      }
    }
  }

  // Landscape: 1920x886
  const landscapeDir = path.join(outDir, '1920x886');
  fs.mkdirSync(landscapeDir, { recursive: true });

  for (const preview of PREVIEWS) {
    console.log(`Recording landscape: ${preview.label}...`);

    const context = await browser.newContext({
      viewport: { width: 1920, height: 886 },
      deviceScaleFactor: 1,
      recordVideo: { dir: tempDir, size: { width: 1920, height: 886 } },
    });

    const page = await context.newPage();
    await page.goto('file://' + path.join(baseDir, preview.file), { waitUntil: 'load' });
    await page.evaluate(({ w, h }) => {
      document.body.style.width = w + 'px';
      document.body.style.height = h + 'px';
      const content = document.querySelector('.content');
      if (content) { content.style.flexDirection='row'; content.style.flexWrap='wrap'; content.style.alignContent='center'; content.style.justifyContent='center'; content.style.gap='40px'; content.style.padding='40px'; }
      const topText = document.querySelector('.top-text');
      if (topText) { topText.style.marginTop='0'; topText.style.maxWidth='45%'; topText.style.textAlign='left'; const h1=topText.querySelector('h1'); if(h1) h1.style.fontSize='42px'; const p=topText.querySelector('p'); if(p){p.style.fontSize='20px';p.style.padding='0';} }
      const phone = document.querySelector('.phone');
      if (phone) { phone.style.width='320px'; phone.style.height='660px'; phone.style.marginTop='0'; phone.style.borderRadius='32px'; phone.style.flexShrink='0'; }
      const bottomText = document.querySelector('.bottom-text');
      if (bottomText) { bottomText.style.position='static'; bottomText.style.marginTop='20px'; bottomText.style.width='100%'; }
      const statsRow = document.querySelector('.stats-row');
      if (statsRow) { statsRow.style.position='static'; statsRow.style.marginTop='20px'; }
    }, { w: 1920, h: 886 });

    await page.waitForTimeout(preview.duration);
    const video = page.video();
    await page.close();
    await context.close();

    if (video) {
      const srcPath = await video.path();
      await new Promise(r => setTimeout(r, 1500));
      if (fs.existsSync(srcPath)) {
        const mp4Path = path.join(landscapeDir, `${preview.label}-1920x886.mp4`);
        execSync(`ffmpeg -y -i "${srcPath}" -an -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.2 -preset medium -crf 18 -r 30 -vf "scale=1920:886:flags=lanczos,setsar=1:1" -movflags +faststart "${mp4Path}" 2>/dev/null`, { timeout: 45000 });
        console.log(`  Saved: ${(fs.statSync(mp4Path).size/1024/1024).toFixed(1)} MB`);
        fs.unlinkSync(srcPath);
      }
    }
  }

  try { fs.rmdirSync(tempDir); } catch(e) {}
  await browser.close();
  console.log('\nDone! All preview videos at correct dimensions.');
}

main().catch(console.error);
