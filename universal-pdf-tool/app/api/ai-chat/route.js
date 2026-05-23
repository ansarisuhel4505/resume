import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, pdfText } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Vercel se aapki secret key yahan aayegi
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: "Server Error: GEMINI_API_KEY is not configured in Vercel settings." 
      }, { status: 500 });
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    // Hum gemini-1.5-flash use kar rahe hain kyunki ye text aur chat ke liye sabse fast hai
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // AI ko PDF ka data aur user ka sawal ek sath bhejna
    const fullPrompt = `You are a helpful and intelligent document assistant. 
Here is the text extracted from a user's PDF document:

--- START OF PDF CONTENT ---
${pdfText || "No PDF text provided."}
--- END OF PDF CONTENT ---

User's Question: ${prompt}

Please answer the user's question accurately based ONLY on the provided PDF text. If the answer is not present in the text, politely inform the user that the information is missing from the document. Keep the response clean, well-formatted, and professional.`;

    // AI se answer generate karwana
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Frontend ko answer wapas bhejna
    return NextResponse.json({ reply: text }, { status: 200 });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ 
      error: "AI failed to process the request. It might be due to a server overload or invalid API key." 
    }, { status: 500 });
  }
}
