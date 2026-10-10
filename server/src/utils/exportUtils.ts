import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';
import PDFDocument from 'pdfkit';

/**
 * Creates parent directories if they don't exist
 */
function ensureDirExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Export to CSV
 */
export async function exportToCsv(filePath: string, headers: string[], rows: (string | number)[][]): Promise<string> {
  ensureDirExists(filePath);
  
  // UTF-8 with BOM
  const BOM = '\uFEFF';
  
  const escapeCsv = (val: string | number) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\n');

  fs.writeFileSync(filePath, BOM + csvContent, 'utf-8');
  return filePath;
}

/**
 * Export to XLSX
 */
export async function exportToXlsx(filePath: string, headers: string[], rows: (string | number)[][], sheetName: string = 'Report'): Promise<string> {
  ensureDirExists(filePath);

  const worksheet = xlsx.utils.aoa_to_sheet([headers, ...rows]);
  
  // Auto-column width based on content length
  const colWidths = headers.map((header, i) => {
    const maxLen = Math.max(
      header.length,
      ...rows.map(row => String(row[i] || '').length)
    );
    return { wch: maxLen + 2 };
  });
  worksheet['!cols'] = colWidths;

  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

  xlsx.writeFile(workbook, filePath);
  return filePath;
}

/**
 * Export to PDF Table
 */
export async function exportToPdf(filePath: string, title: string, headers: string[], rows: (string | number)[][]): Promise<string> {
  ensureDirExists(filePath);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Title
    const fontPath = process.env.PDF_FONT_PATH || (fs.existsSync('C:\\Windows\\Fonts\\arial.ttf') ? 'C:\\Windows\\Fonts\\arial.ttf' : undefined);
    if (fontPath) {
      doc.font(fontPath);
    }

    doc.fontSize(18).text(title, { align: 'center' });
    doc.moveDown();

    // Table drawing
    let y = doc.y;
    const startX = 30;
    const endX = doc.page.width - 30;
    const rowHeight = 25;
    const colWidth = (endX - startX) / headers.length;

    // Header
    doc.fontSize(12);
    headers.forEach((header, i) => {
      doc.text(header, startX + i * colWidth + 5, y + 5, { width: colWidth - 10, align: 'left' });
    });
    
    // Header Line
    y += rowHeight;
    doc.moveTo(startX, y).lineTo(endX, y).stroke();

    // Rows
    doc.fontSize(10);
    rows.forEach(row => {
      if (y + rowHeight > doc.page.height - 30) {
        doc.addPage();
        if (fontPath) doc.font(fontPath);
        y = 30;
      }
      row.forEach((cell, i) => {
        doc.text(String(cell || ''), startX + i * colWidth + 5, y + 5, { width: colWidth - 10, align: 'left' });
      });
      y += rowHeight;
      doc.moveTo(startX, y).lineTo(endX, y).stroke();
    });

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}
