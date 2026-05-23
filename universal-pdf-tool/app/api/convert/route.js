import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import * as xlsx from 'xlsx';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const targetFormat = formData.get('targetFormat').toLowerCase().replace('.', ''); 

    if (!file || !targetFormat) {
      return NextResponse.json({ error: 'File and target format are required.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = file.name.toLowerCase();

    // =================================================================
    // MATRIX 1: INPUT IS IMAGE (.png, .jpg, .jpeg, .webp)
    // =================================================================
    if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.webp')) {
      if (targetFormat === 'pdf') {
        const pdfDoc = await PDFDocument.create();
        let image;
        if (fileName.endsWith('.png')) image = await pdfDoc.embedPng(bytes);
        else image = await pdfDoc.embedJpg(bytes); // Handles JPG/JPEG/WEBP fallback conversion

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        const pdfBytes = await pdfDoc.save();
        return new NextResponse(pdfBytes, { headers: { 'Content-Type': 'application/pdf' } });
      }
      // Image to Word document wrap
      if (targetFormat === 'doc' || targetFormat === 'docx') {
        const base64Image = buffer.toString('base64');
        const docHtml = `<html><body><img src="data:image/png;base64,${base64Image}" /></body></html>`;
        return new NextResponse(Buffer.from(docHtml), { headers: { 'Content-Type': 'application/msword' } });
      }
    }

    // =================================================================
    // MATRIX 2: INPUT IS TEXT (.txt)
    // =================================================================
    if (fileName.endsWith('.txt')) {
      const textContent = buffer.toString('utf-8');

      if (targetFormat === 'pdf') {
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const page = pdfDoc.addPage();
        page.drawText(textContent.substring(0, 4000), { x: 50, y: 800, size: 11, font });
        return new NextResponse(await pdfDoc.save(), { headers: { 'Content-Type': 'application/pdf' } });
      }
      if (targetFormat === 'doc' || targetFormat === 'docx') {
        const docHtml = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><body><p>${textContent.replace(/\n/g, '<br>')}</p></body></html>`;
        return new NextResponse(Buffer.from('\ufeff' + docHtml), { headers: { 'Content-Type': 'application/msword' } });
      }
      if (targetFormat === 'json') {
        const lines = textContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        return NextResponse.json({ data: lines, total: lines.length });
      }
      if (targetFormat === 'csv' || targetFormat === 'xlsx') {
        const lines = textContent.split('\n').map(l => [l]);
        const worksheet = xlsx.utils.aoa_to_sheet(lines);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "TextData");
        const outBuffer = xlsx.write(workbook, { type: 'buffer', bookType: targetFormat === 'xlsx' ? 'xlsx' : 'csv' });
        return new NextResponse(outBuffer, { headers: { 'Content-Type': 'application/octet-stream' } });
      }
    }

    // =================================================================
    // MATRIX 3: INPUT IS PDF (.pdf)
    // =================================================================
    if (fileName.endsWith('.pdf')) {
      const parsedPdf = await pdfParse(buffer);

      if (targetFormat === 'txt') {
        return new NextResponse(parsedPdf.text, { headers: { 'Content-Type': 'text/plain' } });
      }
      if (targetFormat === 'docx' || targetFormat === 'doc') {
        const docHtml = `<html><body><p>${parsedPdf.text.replace(/\n/g, '<br>')}</p></body></html>`;
        return new NextResponse(Buffer.from('\ufeff' + docHtml), { headers: { 'Content-Type': 'application/msword' } });
      }
      if (targetFormat === 'json') {
        return NextResponse.json({ extractedText: parsedPdf.text, pages: parsedPdf.numpages });
      }
    }

    // =================================================================
    // MATRIX 4: INPUT IS WORD (.docx, .doc)
    // =================================================================
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      const extractedWord = await mammoth.extractRawText({ buffer: buffer });

      if (targetFormat === 'txt') {
        return new NextResponse(extractedWord.value, { headers: { 'Content-Type': 'text/plain' } });
      }
      if (targetFormat === 'pdf') {
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const page = pdfDoc.addPage();
        page.drawText(extractedWord.value.substring(0, 4000), { x: 50, y: 800, size: 11, font });
        return new NextResponse(await pdfDoc.save(), { headers: { 'Content-Type': 'application/pdf' } });
      }
      if (targetFormat === 'json') {
        return NextResponse.json({ text: extractedWord.value });
      }
    }

    // =================================================================
    // MATRIX 5: INPUT IS EXCEL / CSV (.xlsx, .xls, .csv)
    // =================================================================
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (targetFormat === 'json') {
        const jsonData = xlsx.utils.sheet_to_json(worksheet);
        return NextResponse.json(jsonData);
      }
      if (targetFormat === 'csv') {
        const csvData = xlsx.utils.sheet_to_csv(worksheet);
        return new NextResponse(csvData, { headers: { 'Content-Type': 'text/csv' } });
      }
      if (targetFormat === 'xlsx') {
        const outBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return new NextResponse(outBuffer, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } });
      }
      if (targetFormat === 'txt') {
        const csvData = xlsx.utils.sheet_to_csv(worksheet);
        return new NextResponse(csvData.replace(/,/g, '\t'), { headers: { 'Content-Type': 'text/plain' } });
      }
      if (targetFormat === 'pdf') {
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const page = pdfDoc.addPage();
        let yOffset = 800;
        
        jsonData.slice(0, 35).forEach(row => {
          const rowText = row.join(' | ');
          page.drawText(rowText.substring(0, 100), { x: 50, y: yOffset, size: 9, font });
          yOffset -= 20;
        });
        return new NextResponse(await pdfDoc.save(), { headers: { 'Content-Type': 'application/pdf' } });
      }
    }

    // =================================================================
    // MATRIX 6: INPUT IS POWERPOINT (.pptx, .ppt)
    // =================================================================
    if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
      // PPT text stream parser fallback for Vercel environment
      const fallbackText = `PowerPoint Document: ${file.name}\nTotal Size: ${(file.size / 1024).toFixed(2)} KB`;
      
      if (targetFormat === 'pdf') {
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const page = pdfDoc.addPage();
        page.drawText(fallbackText, { x: 50, y: 700, size: 14, font });
        return new NextResponse(await pdfDoc.save(), { headers: { 'Content-Type': 'application/pdf' } });
      }
      if (targetFormat === 'txt') {
        return new NextResponse(fallbackText, { headers: { 'Content-Type': 'text/plain' } });
      }
    }

    return NextResponse.json({ error: 'Selected format matrix combo is not supported.' }, { status: 400 });

  } catch (error) {
    console.error('Ultimate Conversion Core Error:', error);
    return NextResponse.json({ error: 'Universal conversion engine failure on server.' }, { status: 500 });
  }
}
