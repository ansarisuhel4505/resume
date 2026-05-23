import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import * as xlsx from 'xlsx';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const targetFormat = formData.get('targetFormat'); 

    if (!file || !targetFormat) {
      return NextResponse.json({ error: 'File and target format are required.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type;
    const fileName = file.name.toLowerCase();

    // 1. IMAGE ko PDF me convert karna
    if (targetFormat === 'pdf' && mimeType.startsWith('image/')) {
      const pdfDoc = await PDFDocument.create();
      let image;
      if (mimeType === 'image/jpeg') image = await pdfDoc.embedJpg(bytes);
      else if (mimeType === 'image/png') image = await pdfDoc.embedPng(bytes);
      else return NextResponse.json({ error: 'Unsupported image format. Please use JPG or PNG.' }, { status: 400 });

      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      const pdfBytes = await pdfDoc.save();
      
      return new NextResponse(pdfBytes, {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="converted-image.pdf"` }
      });
    }

    // 2. TEXT ko PDF me convert karna
    if (targetFormat === 'pdf' && mimeType === 'text/plain') {
      const text = buffer.toString('utf-8');
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const page = pdfDoc.addPage();
      // Basic text extraction without complex word-wrap to respect Vercel limits
      page.drawText(text.substring(0, 3000), { x: 50, y: 800, size: 12, font }); 
      const pdfBytes = await pdfDoc.save();
      
      return new NextResponse(pdfBytes, {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="converted-text.pdf"` }
      });
    }

    // 3. WORD (DOCX) se TEXT nikalna (Own Code using Mammoth)
    if (targetFormat === 'txt' && fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: buffer });
      return new NextResponse(result.value, {
        headers: { 'Content-Type': 'text/plain', 'Content-Disposition': `attachment; filename="extracted-word.txt"` }
      });
    }

    // 4. EXCEL (XLSX) ko JSON/Data me badalna (Own Code using XLSX)
    if (targetFormat === 'json' && (fileName.endsWith('.xlsx') || fileName.endsWith('.csv'))) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const jsonResult = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      return NextResponse.json(jsonResult);
    }

    // 5. PDF se TEXT nikalna (Own Code using PDF-Parse)
    if (targetFormat === 'txt' && mimeType === 'application/pdf') {
      const data = await pdfParse(buffer);
      return new NextResponse(data.text, {
        headers: { 'Content-Type': 'text/plain', 'Content-Disposition': `attachment; filename="extracted-pdf.txt"` }
      });
    }

    return NextResponse.json({ error: 'Target format not supported for this file type natively on Vercel.' }, { status: 400 });

  } catch (error) {
    console.error('Conversion Error:', error);
    return NextResponse.json({ error: 'File conversion failed on our server.' }, { status: 500 });
  }
}
