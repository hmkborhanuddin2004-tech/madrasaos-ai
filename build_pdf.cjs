const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log('1. Fetching Noto Sans Bengali Google Fonts (400 and 700)...');
  const [f400Res, f700Res] = await Promise.all([
    fetch('https://fonts.gstatic.com/s/notosansbengali/v33/Cn-SJsCGWQxOjaGwMQ6fIiMywrNJIky6nvd8BjzVMvJx2mcSPVFpVEqE-6KmsolLudA.ttf'),
    fetch('https://fonts.gstatic.com/s/notosansbengali/v33/Cn-SJsCGWQxOjaGwMQ6fIiMywrNJIky6nvd8BjzVMvJx2mcSPVFpVEqE-6Kmsm5MudA.ttf')
  ]);

  const f400Buf = Buffer.from(await f400Res.arrayBuffer());
  const f700Buf = Buffer.from(await f700Res.arrayBuffer());

  const b64_400 = f400Buf.toString('base64');
  const b64_700 = f700Buf.toString('base64');

  console.log(`2. Fonts fetched! 400: ${f400Buf.length} bytes, 700: ${f700Buf.length} bytes`);

  const fontFaceCss = `
    @font-face {
      font-family: 'Noto Sans Bengali';
      src: url('data:font/truetype;charset=utf-8;base64,${b64_400}') format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'Noto Sans Bengali';
      src: url('data:font/truetype;charset=utf-8;base64,${b64_700}') format('truetype');
      font-weight: 700;
      font-style: normal;
    }
  `;

  const htmlPath = path.join(__dirname, 'MadrasaOS_AI_Complete_Work_Report.html');
  let html = fs.readFileSync(htmlPath, 'utf8');

  // If font-face already exists or inject it at top of style
  if (!html.includes('data:font/truetype;charset=utf-8;base64')) {
    html = html.replace('<style>', '<style>' + fontFaceCss);
  } else {
    // replace existing font-face
    html = html.replace(/@font-face\s*\{[^}]*font-family:\s*'Noto Sans Bengali'[^}]*\}\s*@font-face\s*\{[^}]*font-family:\s*'Noto Sans Bengali'[^}]*\}/s, fontFaceCss);
  }

  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`3. Embedded base64 fonts directly into ${htmlPath}`);

  console.log('4. Generating PDF via Microsoft Edge Headless...');
  const tempPdf = 'C:\\Users\\assdi\\AppData\\Local\\Temp\\MadrasaOS_AI_Complete_Work_Report.pdf';
  const finalPdf = path.join(__dirname, 'MadrasaOS_AI_Complete_Work_Report.pdf');

  const { execFileSync } = require('child_process');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;

  execFileSync(edgePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--virtual-time-budget=5000',
    '--no-pdf-header-footer',
    `--print-to-pdf=${tempPdf}`,
    fileUrl
  ], { stdio: 'inherit' });

  fs.copyFileSync(tempPdf, finalPdf);

  const stat = fs.statSync(finalPdf);
  console.log(`5. SUCCESS! Generated PDF (${stat.size} bytes) at ${finalPdf}`);
}

main().catch(err => {
  console.error('Build PDF failed:', err);
  process.exit(1);
});
