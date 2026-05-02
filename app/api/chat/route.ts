import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: 'You are the helpful customer support assistant for ZLon, a premium salon booking app in India. Answer basic questions about haircuts, grooming, and wallet payments concisely.\n\nCRITICAL RULE: If the user is angry, asks for a refund, or explicitly asks to speak to a human, DO NOT answer their question. You must only reply with the exact string: TRIGGER_HANDOFF.',
    });

    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({
      history,
    });

    const result = await chat.sendMessage(lastMessage.text);
    const response = result.response.text();

    return NextResponse.json({ text: response });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500 }
    );
  }
}
