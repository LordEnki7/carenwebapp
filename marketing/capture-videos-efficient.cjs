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

const TARGETS = [
  { width: 1242, height: 2688, label: '6.5-inch-portrait' },
  { width: 1284, height: 2778, label: '6.7-inch-portrait' },
];

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Record at half resolution (621x1344) then scale up
  const captureW = 621;
  const captureH = 1344;

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });

  for (const preview of PREVIEWS) {
    console.log(`\nRecording: ${preview.label}...`);

    const tempDir = path.join(outDir, 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: captureW, height: captureH },
      deviceScaleFactor: 1,
      recordVideo: {
        dir: tempDir,
        size: { width: captureW, height: captureH },
      },
    });

    const page = await context.newPage();
    const fileUrl = 'file://' + path.join(baseDir, preview.file);

    // Override body size to match capture viewport
    await page.goto(fileUrl, { waitUntil: 'load' });
    await page.evaluate(({ w, h }) => {
      document.body.style.width = w + 'px';
      document.body.style.height = h + 'px';
      document.body.style.transform = 'scale(0.5)';
      document.body.style.transformOrigin = 'top left';
    }, { w: captureW * 2, h: captureH * 2 });

    // Let the animation play
    await page.waitForTimeout(preview.duration);

    const video = page.video();
    await page.close();
    await context.close();

    if (video) {
      const srcPath = await video.path();
      // Wait for video file to be written
      await new Promise(r => setTimeout(r, 1000));

      if (fs.existsSync(srcPath)) {
        const fileSize = fs.statSync(srcPath).size;
        console.log(`  Raw video: ${(fileSize/1024/1024).toFixed(1)} MB`);

        // Scale to each target size and convert to MP4
        for (const target of TARGETS) {
          const targetDir = path.join(outDir, target.label);
          if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

          const mp4Path = path.join(targetDir, `${preview.label}-${target.label}.mp4`);
          try {
            execSync(`ffmpeg -y -i "${srcPath}" -vf "scale=${target.width}:${target.height}:flags=lanczos" -c:v libx264 -pix_fmt yuv420p -preset medium -crf 20 -r 30 -t 30 -an "${mp4Path}" 2>/dev/null`, { timeout: 30000 });
            const mp4Size = fs.statSync(mp4Path).size;
            console.log(`  -> ${target.label}: ${(mp4Size/1024/1024).toFixed(1)} MB`);
          } catch(e) {
            console.log(`  -> ${target.label}: conversion failed - ${e.message}`);
          }
        }
        // Clean up temp webm
        fs.unlinkSync(srcPath);
      }
    }
  }

  // Clean up temp dir
  try { fs.rmdirSync(path.join(outDir, 'temp')); } catch(e) {}

  await browser.close();
  console.log('\nAll preview videos generated!');
}

main().catch(console.error);
