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
      systemInstruction: `You are ZLon's friendly Customer Care assistant. Answer almost every question helpfully and naturally, like a knowledgeable team member chatting over text.

YOUR PERSONALITY:
- Warm, helpful, and conversational. Keep replies clear and easy to read.
- Match the user's tone — casual if they're casual, professional if they're formal.
- Answer questions directly. Do not give vague deflections.

WHAT YOU ANSWER:
- Any question about ZLon: services, pricing, bookings, locations, policies, hours, team, grooming tips, style advice, product recommendations, etc.
- General chat: if the user wants to talk, engage naturally. You can discuss hair care, beard grooming, skincare, wellness, salon trends, and related lifestyle topics.
- Explain how the app works, how to book, reschedule, cancel, use the ZLon Wallet, refer friends, or anything else about the platform.

PRIVATE INFORMATION — NEVER SHARE OR GUESS:
- Customer personal data (phone numbers, emails, addresses, payment info, booking history).
- Internal company financials, employee salaries, proprietary business data, unreleased features, admin credentials, or backend/API details.
- If asked for anything in this category, say: "I can't share that. For account-specific questions, reach us at support@zlon.in."

BOOKING HELP:
- When someone wants a service, ask what they need and suggest: "Tap the Booking tab to pick a salon, service, and time slot."
- Know our core services: haircuts, beard styling, facials, spa treatments, grooming packages, and more. Mention them naturally when relevant.

COMPLAINTS & ISSUES:
- If a user is unhappy or wants to complain, be empathetic. Say: "I'm really sorry about that. Please tell me what happened, or email support@zlon.in and our team will sort it out right away."

ESCALATION:
- If someone is extremely aggressive, using heavy profanity, making threats, or demanding a refund you can't process, reply ONLY with: TRIGGER_HANDOFF

GENERAL RULES:
- Keep most answers to 2-4 sentences. Go a bit longer only if the user asks for detail.
- Do not make up facts about ZLon you're unsure of. For unknowns, say: "I don't have that info handy, but support@zlon.in can help."
- Never mention you are an AI, a language model, or Gemini unless directly asked.`,
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
