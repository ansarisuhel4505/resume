import { NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to Buffer for Tesseract
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Run OCR using Tesseract.js
    // Note: On Vercel, this runs in the serverless function memory
    const { data: { text } } = await Tesseract.recognize(
      buffer,
      'eng', // English language
      { logger: m => console.log(m) } // Logs progress in Vercel terminal
    );

    return NextResponse.json({ 
      success: true, 
      extractedText: text 
    }, { status: 200 });

  } catch (error) {
    console.error('OCR Processing Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process image. Please ensure it is a valid image file.' 
    }, { status: 500 });
  }
}
