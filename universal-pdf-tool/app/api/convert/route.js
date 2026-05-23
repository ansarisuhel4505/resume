import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const targetFormat = formData.get('targetFormat'); // e.g., 'pdf'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const mimeType = file.type;

    // Example logic: Convert Image (JPG/PNG) to PDF
    if (targetFormat === 'pdf' && mimeType.startsWith('image/')) {
      const pdfDoc = await PDFDocument.create();
      let image;
      
      if (mimeType === 'image/jpeg') {
        image = await pdfDoc.embedJpg(bytes);
      } else if (mimeType === 'image/png') {
        image = await pdfDoc.embedPng(bytes);
      } else {
        return NextResponse.json({ error: 'Unsupported image format.' }, { status: 400 });
      }

      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });

      const pdfBytes = await pdfDoc.save();
      
      // Return the PDF buffer directly to the client
      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="converted-${file.name}.pdf"`,
        },
      });
    }

    // Basic Fallback for other formats
    return NextResponse.json({ 
      error: 'This specific conversion format is not supported in the serverless environment yet.' 
    }, { status: 400 });

  } catch (error) {
    console.error('Conversion Error:', error);
    return NextResponse.json({ error: 'File conversion failed.' }, { status: 500 });
  }
}
