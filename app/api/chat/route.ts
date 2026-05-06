import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Safely extract messages and optional data (image) from the request
    const body = await request.json();
    const { messages, data } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI API ERROR: Missing GEMINI_API_KEY environment variable');
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // 2. Initialize Gemini model — strictly gemini-1.5-flash
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: `You are the official Customer Care AI for ZLon. 

CRITICAL RULES FOR YOUR BEHAVIOR:
1. NO GREETINGS: NEVER say "Hello", "Welcome to ZLon", or introduce yourself. Skip the pleasantries entirely. Start your sentence directly with the answer.
2. EXTREME BREVITY: Keep all responses to 1 or 2 short sentences. Do NOT list the services we offer unless the user explicitly asks for a menu.
3. BE DIRECT: If the user says "hi", say "How can I help you today?". If the user asks a question, answer ONLY that question. 
4. HANDLING COMPLAINTS: If a user says they want to complain or have an issue, reply EXACTLY with: "I'm sorry to hear that. Please describe the issue here, or email us at support@zlon.in so our team can investigate immediately."
5. BOOKING: If they want a service, ask directly: "What date, time, and service are you looking for?"
6. ESCALATION: If the user is highly aggressive, swearing, or demands a refund, reply ONLY with this exact string: TRIGGER_HANDOFF`,
    });

    // 3. Construct the message parts array safely
    const userMessage = messages[messages.length - 1].content;
// Add a space fallback so it never sends an empty string
let parts: any[] = [{ text: userMessage ? userMessage : ' ' }];

    // Strictly validate that imageUrl exists, is a string, and actually contains data
    if (data && typeof data.imageUrl === 'string' && data.imageUrl.trim().length > 0) {
      // Safely extract the base64 string, handling cases with or without the data URI prefix
      const base64Data = data.imageUrl.includes(',') ? data.imageUrl.split(',')[1] : data.imageUrl;
      
      // Final safety check before pushing to the Gemini array
      if (base64Data && base64Data.trim().length > 0) {
        // Dynamically detect mimeType from the data URL prefix if possible, fallback to image/jpeg
        const mimeMatch = data.imageUrl.match(/data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

        parts.push({
          inlineData: {
            data: base64Data,
            mimeType,
          },
        });
      }
    }

    // 4. Build conversation history safely
    // Gemini requires history starting with 'user' and alternating roles.
    interface Message {
      role: string;
      content: string;
    }

    const history = messages.slice(0, -1).map((msg: Message) => ({
  role: msg.role === 'assistant' ? 'model' : 'user',
  // Add a space fallback here too for old ghost messages
  parts: [{ text: msg.content ? msg.content : ' ' }], 
}));

    // Ensure history starts with 'user'
    while (history.length > 0 && history[0].role !== 'user') {
      history.shift();
    }

    // 5. Call generateContent with dedicated try/catch for Vercel debugging and Safety handling
    let responseText: string;
    try {
      const result = await model.generateContent({
        contents: [...history, { role: 'user', parts }],
      });
      
      try {
        responseText = result.response.text();
      } catch (safetyError) {
        console.warn('GEMINI SAFETY BLOCK:', safetyError);
        responseText = "For security and privacy reasons, I cannot process that specific request. Please contact us directly at support@zlon.in.";
      }
    } catch (error: unknown) {
      console.error('GEMINI API ERROR:', error);
      return NextResponse.json(
        { error: 'I encountered an issue processing your request.', details: String(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ text: responseText });
  } catch (error: unknown) {
    // Outer catch for non-Gemini errors (JSON parsing, validation, etc.)
    const err = error as { message?: string; status?: number; code?: number };
    console.error('CHAT ROUTE ERROR:', error);
    return NextResponse.json(
      {
        error: 'I encountered an issue processing your request.',
        details: err.message || 'Unknown error',
      },
      { status: err.status || err.code || 500 }
    );
  }
}
