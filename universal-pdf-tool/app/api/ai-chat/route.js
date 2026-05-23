import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, pdfText } = body;

    if (!prompt || !pdfText) {
      return NextResponse.json({ error: 'Prompt and PDF text are required.' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Fallback response so the app doesn't crash if key is missing during testing
      return NextResponse.json({ 
        reply: "System Note: Please add OPENAI_API_KEY in Vercel Environment Variables to enable live AI responses. \n\nI received your text: " + pdfText.substring(0, 50) + "..."
      });
    }

    // Standard fetch call to OpenAI API (Works perfectly on Vercel Edge/Serverless)
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant. Answer questions based ONLY on the provided PDF text.' 
          },
          { 
            role: 'user', 
            content: `PDF Text: ${pdfText}\n\nUser Question: ${prompt}` 
          }
        ],
        temperature: 0.3,
      })
    });

    const data = await aiResponse.json();

    if (!aiResponse.ok) {
      throw new Error(data.error?.message || 'Failed to fetch AI response');
    }

    return NextResponse.json({ 
      success: true, 
      reply: data.choices[0].message.content 
    }, { status: 200 });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ 
      error: 'AI is currently unavailable. Please check your API key.' 
    }, { status: 500 });
  }
}
