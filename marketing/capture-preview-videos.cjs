const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const SIZES = [
  { width: 1242, height: 2688, label: '6.5-inch-portrait' },
  { width: 1284, height: 2778, label: '6.7-inch-portrait' },
];

const PREVIEWS = [
  { file: 'preview-1-sos.html', label: 'preview-1-emergency-sos', duration: 12000 },
  { file: 'preview-2-rights.html', label: 'preview-2-gps-rights', duration: 12000 },
  { file: 'preview-3-ai.html', label: 'preview-3-ai-features', duration: 18000 },
];

async function main() {
  const baseDir = '/home/runner/workspace/marketing';
  const outDir = path.join(baseDir, 'preview-videos');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });

  for (const size of SIZES) {
    const sizeDir = path.join(outDir, size.label);
    if (!fs.existsSync(sizeDir)) fs.mkdirSync(sizeDir, { recursive: true });

    console.log(`\nCapturing ${size.label} (${size.width}x${size.height})...`);

    for (const preview of PREVIEWS) {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
        deviceScaleFactor: 1,
        recordVideo: {
          dir: sizeDir,
          size: { width: size.width, height: size.height },
        },
      });

      const page = await context.newPage();
      const fileUrl = 'file://' + path.join(baseDir, preview.file);
      await page.goto(fileUrl, { waitUntil: 'load' });

      // Wait for the full animation to play
      await page.waitForTimeout(preview.duration);

      // Get the video path before closing
      const video = page.video();
      await page.close();
      await context.close();

      if (video) {
        const videoPath = await video.path();
        const finalName = `${preview.label}-${size.label}.webm`;
        const finalPath = path.join(sizeDir, finalName);
        
        // Rename the video file
        if (fs.existsSync(videoPath)) {
          fs.renameSync(videoPath, finalPath);
          console.log(`  Saved: ${finalName} (${(fs.statSync(finalPath).size / 1024 / 1024).toFixed(1)} MB)`);
          
          // Convert to MP4 using ffmpeg
          const mp4Name = `${preview.label}-${size.label}.mp4`;
          const mp4Path = path.join(sizeDir, mp4Name);
          try {
            execSync(`ffmpeg -y -i "${finalPath}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 "${mp4Path}" 2>/dev/null`);
            console.log(`  Converted: ${mp4Name} (${(fs.statSync(mp4Path).size / 1024 / 1024).toFixed(1)} MB)`);
            // Remove webm after successful conversion
            fs.unlinkSync(finalPath);
          } catch (e) {
            console.log(`  Note: ffmpeg conversion failed, keeping webm`);
          }
        }
      }
    }
  }

  await browser.close();
  console.log('\nDone! All preview videos saved.');
}

main().catch(console.error);
