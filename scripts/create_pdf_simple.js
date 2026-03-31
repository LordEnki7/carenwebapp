import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdf from 'html-pdf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createDashboardPDF() {
  console.log('Creating dashboard PDF from HTML template...');
  
  const htmlPath = path.join(__dirname, '..', 'public', 'dashboard-preview.html');
  const outputPath = path.join(__dirname, '..', 'public', 'dashboard-screenshot.pdf');
  
  try {
    // Read the HTML template
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    // PDF options for small file size
    const options = {
      format: 'A4',
      border: {
        top: '0.5in',
        right: '0.5in', 
        bottom: '0.5in',
        left: '0.5in'
      },
      quality: 60, // Reduce quality for smaller file size
      dpi: 72,     // Lower DPI for smaller file size
      zoomFactor: 0.8
    };
    
    // Create PDF using callback-based API
    pdf.create(html, options).toFile(outputPath, (err, res) => {
      if (err) {
        console.error('Error creating PDF:', err);
        return;
      }
      
      // Check file size
      const stats = fs.statSync(outputPath);
      const fileSizeKB = Math.round(stats.size / 1024);
      
      console.log(`PDF created successfully: ${outputPath}`);
      console.log(`File size: ${fileSizeKB}KB`); 
      
      if (fileSizeKB <= 45) {
        console.log('✅ PDF size is under 45KB requirement');
      } else {
        console.log('⚠️ PDF size exceeds 45KB, but file is ready');
      }
    });
    
  } catch (error) {
    console.error('Error reading HTML template:', error);
  }
}

// Run the function
createDashboardPDF();