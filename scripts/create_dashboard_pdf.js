import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createDashboardPDF() {
  console.log('Starting dashboard PDF generation...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport for consistent screenshots
    await page.setViewport({ width: 1200, height: 800 });
    
    // Navigate to dashboard
    console.log('Navigating to dashboard...');
    await page.goto('http://localhost:5000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for dashboard content to load
    await page.waitForTimeout(3000);
    
    // Generate PDF with optimized settings for small file size
    console.log('Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size:10px; margin:0 auto;">C.A.R.E.N. Dashboard</div>',
      footerTemplate: '<div style="font-size:8px; margin:0 auto;">Priority #1 & #2 Automation Systems Operational</div>'
    });
    
    // Save PDF
    const outputPath = path.join(__dirname, '..', 'public', 'dashboard-screenshot.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    // Check file size
    const stats = fs.statSync(outputPath);
    const fileSizeKB = Math.round(stats.size / 1024);
    
    console.log(`PDF created: ${outputPath}`);
    console.log(`File size: ${fileSizeKB}KB`);
    
    if (fileSizeKB > 45) {
      console.log('File size too large, creating compressed version...');
      
      // Create a more compressed version
      const compressedPdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: false, // Disable background to reduce size
        margin: {
          top: '0.3in',
          right: '0.3in', 
          bottom: '0.3in',
          left: '0.3in'
        },
        scale: 0.8, // Reduce scale
        displayHeaderFooter: true,
        headerTemplate: '<div style="font-size:8px; margin:0 auto;">CAREN Dashboard</div>',
        footerTemplate: '<div style="font-size:6px; margin:0 auto;">Automation Systems Active</div>'
      });
      
      const compressedPath = path.join(__dirname, '..', 'public', 'dashboard-compressed.pdf');
      fs.writeFileSync(compressedPath, compressedPdfBuffer);
      
      const compressedStats = fs.statSync(compressedPath);
      const compressedSizeKB = Math.round(compressedStats.size / 1024);
      
      console.log(`Compressed PDF created: ${compressedPath}`);
      console.log(`Compressed file size: ${compressedSizeKB}KB`);
    }
    
    return { success: true, fileSizeKB };
    
  } catch (error) {
    console.error('Error creating PDF:', error);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the function
createDashboardPDF().then(result => {
  if (result.success) {
    console.log('Dashboard PDF generation completed successfully');
    process.exit(0);
  } else {
    console.error('Dashboard PDF generation failed:', result.error);
    process.exit(1);
  }
});