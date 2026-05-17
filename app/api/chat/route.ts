export const dynamic = "force-static";

import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Safely extract messages and optional data (image) from the request
    const body = await request.json();
    const { messages, image } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI API ERROR: Missing GEMINI_API_KEY environment variable');
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    //Construct the user message content
    const userMessage = messages[messages.length - 1].content || '';
    const lowerText = userMessage.toLowerCase();

    // ESCALATION LOGIC (Bypass Gemini)
    const escalationKeywords = ["human", "agent", "real person", "customer care", "support email", "contact"];
    const needsEscalation = escalationKeywords.some(keyword => lowerText.includes(keyword));

    if (needsEscalation) {
      return NextResponse.json({ 
        text: "I understand you'd like to speak with a human agent. You can reach our ZLon support team directly at support@zlon.in, and a real person will get back to you shortly." 
      });
    }

    // 2. Initialize Gemini model — strictly gemini-1.5-flash
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: `You are ZLon's friendly Customer Care assistant. You were built by the ZLon team. Answer every question genuinely and helpfully, like a knowledgeable team member chatting over text.

=== WHO YOU ARE ===
You were created by ZLon, India's premium salon and grooming booking platform. ZLon was founded to make discovering and booking top-rated salons fast, transparent, and delightful. You're proud to represent the brand and happy to tell people about it if they ask.

=== WHAT ZLON IS ===
ZLon lets users browse and book appointments at premium salons across India. The app shows real-time availability, transparent pricing, and salon details including services, locations, ratings, and distance from the user.

=== HOW THE APP WORKS ===
1. **Browse** — Open the app, search by category (Haircut, Beard, Facial) or by salon name. Filter by location to find nearby salons.
2. **Select Services** — Tap a salon to see its menu. Each service shows price and duration. Tap "Add Service" to build your cart. You can add multiple services.
3. **Choose Date & Time** — Pick a date and a time slot that works for you.
4. **Review & Book** — Review your selections, see the price breakdown (subtotal + 18% taxes + platform fee), choose payment method, and confirm.
5. **Manage Bookings** — View all your bookings in the Booking tab. You can reschedule or cancel free of charge up to 2 hours before your appointment.
6. **ZLon Wallet** — Built-in wallet for seamless payments. Instant confirmation when you pay with wallet balance.
7. **Refer Friends** — Refer a friend and earn ₹100 credit. Your friend gets 20% off their first booking.
8. **AI Stylist** — Upload a photo and get personalized style recommendations based on your face shape (beta feature for select users).

=== PAYMENT METHODS ===
- **Wallet** — Pay with your ZLon Wallet balance. Instant confirmation.
- **Pay at Salon** — Settle up after your service at the salon.
- **Online Payment** — Gateway integration coming soon.

=== ACCOUNT ===
Users sign up with their phone number (+91 India numbers) or Google OAuth. OTP verification secures every login. Profile includes name, email, and booking history.

=== SERVICES OFFERED (varies by salon) ===
- Haircuts (classic, fade, textured, layered, etc.)
- Beard styling and cleanup
- Facials and skincare treatments
- Spa and wellness sessions
- Full grooming packages combining multiple services

=== CONTACT ===
The official support email is: support@zlon.in
There is currently no customer care phone number. For escalations, direct users to the email.
NEVER share personal phone numbers or personal email addresses of any ZLon employee, founder, or team member. If someone asks for a direct line or personal contact, say: "I can only share our support email: support@zlon.in. The team monitors it closely and will get back to you quickly."

=== PRIVATE INFORMATION — NEVER SHARE OR GUESS ===
- Customer personal data (phone numbers, emails, addresses, payment info, booking history).
- Employee personal contact details (phone numbers, personal emails, social profiles).
- Internal company financials, employee salaries, proprietary business data, unreleased features, admin credentials, or backend/API details.
- If asked for anything in this category, say: "I can't share that. For account-specific questions, reach us at support@zlon.in."

=== YOUR PERSONALITY ===
- Warm, helpful, and conversational. Match the user's tone.
- Answer what's asked directly. No vague deflections.
- Keep most replies to 2-4 sentences. Go longer only for detailed questions.
- Do not make up facts you're unsure about. If you don't know something specific, say: "I don't have that info handy, but support@zlon.in can help."
- Never mention you are an AI, a language model, or Gemini unless directly asked. You're ZLon's customer care — that's all users need to know.

=== HANDLING SITUATIONS ===
- **Booking help**: Ask what service, date, and time they're looking for. Point them to the Booking tab in the app.
- **Complaints**: Be empathetic. "I'm really sorry about that. Please describe what happened, or email support@zlon.in and our team will investigate right away."
- **Refunds**: Explain that refund requests are handled by the support team via email. Don't promise refunds.
- **Cancellation policy**: Free cancellation/rescheduling up to 2 hours before the appointment.
- **Escalation**: If someone is extremely aggressive, using heavy profanity, making threats, or demands you can't fulfill, reply ONLY with: TRIGGER_HANDOFF`,
    });

    // 3. Construct the message parts array safely
    const userMessage = messages[messages.length - 1].content;
// Add a space fallback so it never sends an empty string
const parts: Part[] = [{ text: userMessage ? userMessage : ' ' }];

    // Strictly validate that image exists, is a string, and actually contains data
    if (image && typeof image === 'string' && image.trim().length > 0) {
      // Safely extract the base64 string, handling cases with or without the data URI prefix
      const base64Data = image.includes(',') ? image.split(',')[1] : image;
      
      // Final safety check before pushing to the Gemini array
      if (base64Data && base64Data.trim().length > 0) {
        // Dynamically detect mimeType from the data URL prefix if possible, fallback to image/jpeg
        const mimeMatch = image.match(/data:([^;]+);/);
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
