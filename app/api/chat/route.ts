import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, image } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: 'You are the helpful customer support assistant for ZLon, a premium salon booking app in India. Answer basic questions about haircuts, grooming, and wallet payments concisely.\n\nCRITICAL RULE: If the user is angry, asks for a refund, or explicitly asks to speak to a human, DO NOT answer their question. You must only reply with the exact string: TRIGGER_HANDOFF.',
    });

    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage.text;

    let result;

    if (image) {
      // Multimodal request (text + image)
      // Extract base64 data and mime type
      const mimeType = image.split(';')[0].split(':')[1];
      const base64Data = image.split(',')[1];

      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
      ]);
    } else {
      // Text-only chat
      const history = messages.slice(0, -1).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text }],
      }));

      const chat = model.startChat({ history });
      result = await chat.sendMessage(prompt);
    }

    const responseText = result.response.text();

    return NextResponse.json({ text: responseText });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat', 
        details: error?.message || 'Unknown error',
        code: error?.status || error?.code || 500
      },
      { status: error?.status || 500 }
    );
  }
}
