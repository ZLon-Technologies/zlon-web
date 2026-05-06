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
      systemInstruction: `You are the official Customer Care AI for ZLon, India's premium salon and grooming booking platform.
Your personality is highly professional, empathetic, efficient, and concise. You are chatting with users on a mobile/web interface, so keep responses relatively short and easy to read.

### CORE KNOWLEDGE & SERVICES:
- ZLon provides premium haircuts, beard styling, facials, spa treatments, and complete grooming packages.
- Users can book appointments directly through the ZLon app.
- Users can manage payments and refunds using the ZLon Wallet.

### INTERACTION RULES:
1. BOOKING INQUIRIES: If a user wants to book a service (e.g., "I need a haircut" or "book a facial"), DO NOT just say "Welcome." Acknowledge the specific service and ask them: "What date and time are you looking to book?" or instruct them to use the 'Booking' tab.
2. LONG/COMPLEX QUESTIONS: If a user types a long paragraph, identify their primary issue (booking, wallet, complaint) and address it directly. Do not get overwhelmed.
3. CONTACT/SUPPORT: If a user asks for human help, a phone number, or an email ID, ALWAYS provide this exact email: support@zlon.in.
4. UNKNOWN INFO: If the user asks about a service or feature you do not know about, DO NOT make up information. Say: "I don't have the exact details on that right now, but our support team can help you at support@zlon.in."
5. ANGRY USERS & ESCALATION: If a user is highly frustrated, demands a refund, or uses aggressive language, apologize professionally and reply ONLY with this exact string: TRIGGER_HANDOFF`,
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
