import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse the incoming JSON safely
    const body = await request.json();
    const { messages, image } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // 2. Model Verification: Use gemini-1.5-flash or gemini-2.0-flash
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: 'You are the helpful customer support assistant for ZLon, a premium salon booking app in India. Answer basic questions about haircuts, grooming, and wallet payments concisely.\n\nCRITICAL RULE: If the user is angry, asks for a refund, or explicitly asks to speak to a human, DO NOT answer their question. You must only reply with the exact string: TRIGGER_HANDOFF.',
    });

    // 3. Implement Safe Payload Construction
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.text || '';
    
    const parts = [];
    // Always push the text
    parts.push({ text: userMessage });

    // The Fix: Only push the image data if it actually exists and is valid
    if (image && typeof image === 'string' && image.startsWith('data:')) {
      try {
        const mimeType = image.split(';')[0].split(':')[1];
        const base64Data = image.split(',')[1];
        if (mimeType && base64Data) {
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          });
        }
      } catch (e) {
        console.error('Error parsing image data:', e);
      }
    }

    // 4. Handle history safely. 
    // Gemini generateContent with history requires starting with 'user' and alternating.
    // We filter out the first message if it's from the assistant to avoid the common "history must start with user" error.
    interface Message {
      role: string;
      text: string;
    }

    const history = messages.slice(0, -1).map((msg: Message) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text || '' }],
    }));

    // Ensure history starts with 'user'
    while (history.length > 0 && history[0].role !== 'user') {
      history.shift();
    }

    // Use model.generateContent with history formatted correctly
    const result = await model.generateContent({
      contents: [...history, { role: 'user', parts }],
    });

    const responseText = result.response.text();

    return NextResponse.json({ text: responseText });
  } catch (error: unknown) {
    // 5. Enhanced Error Logging: console.error the exact reason for the failure
    const err = error as { 
      name?: string; 
      message?: string; 
      stack?: string; 
      status?: number; 
      code?: number; 
      reason?: string 
    };

    console.error('CRITICAL CHAT API FAILURE:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      status: err.status || err.code || 500,
      reason: err.reason || 'Unknown'
    });

    return NextResponse.json(
      { 
        error: 'I encountered an issue processing your request.', 
        details: err.message || 'Unknown error',
      },
      { status: err.status || 500 }
    );
  }
}
