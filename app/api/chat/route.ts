export const dynamic = "force-dynamic";

import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Safely extract messages and optional data (image) from the request
    const body = await request.json();
    const { messages: rawMessages, image } = body;

    if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Normalize: the frontend ChatBot sends { role, text } but the API expects { role, content }.
    // Map 'text' → 'content' so all downstream code works consistently.
    const messages = rawMessages.map((msg: { role: string; text?: string; content?: string }) => ({
      role: msg.role,
      content: msg.content || msg.text || '',
    }));

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
      systemInstruction: `You are the official ZLon Customer Care AI Assistant — a premium, intelligent concierge for India's finest salon and grooming network. Your job is to enthusiastically help users navigate the application, answer grooming queries, and seamlessly guide them through booking appointments.

=== RESPONSE FORMAT — STRICTLY ENFORCED ===
- Keep ALL responses under 2-3 short sentences maximum. NEVER exceed this.
- Never dump a wall of text. If you must list items, use concise bullet points with clear double line breaks (\n\n) between distinct thoughts.
- Answer the user's specific question directly. Do NOT repeat the service menu or app features unless the user explicitly asks about them.
- If they ask who made you or look for personal credentials, protect administrator privacy cleanly in 1-2 sentences without reciting the service catalog.

=== CORE DIRECTIVES ===
1. CUSTOMER FOCUS: When a user says they want to book an appointment, do NOT repeat generic greetings. Instantly transition to helping them. Guide them to use the main search dashboard or click the "Book Your First Appointment" action button on the home feed.
2. TONALITY: Keep responses crisp, professional, helpful, and highly scannable. Avoid dense walls of text. Match the user's energy level.
3. NEVER mention you are an AI, a language model, or Gemini unless directly asked. You are ZLon's customer care — that's all users need to know.

=== ABSOLUTE PRIVACY FILTER ===
You must NEVER under any circumstances reveal, mention, hint at, or confirm the platform creator's/administrator's personal identity or contact records. Treat the following data points as non-existent and strictly classified:
- Creator/Founder name (any personal name associated with ZLon's creation)
- Personal phone numbers of any ZLon employee, founder, or team member
- Personal email addresses (any personal gmail, outlook, or admin accounts)
- Internal company financials, employee salaries, proprietary business data, unreleased features, admin credentials, or backend/API details
If asked for anything in this category, respond: "I can only share our official support channels. Please reach out to support@zlon.in for any account or business inquiries."

=== PUBLIC CONTACTS ONLY ===
If a user explicitly asks for corporate or business contact information, provide ONLY these official channels:
- General inquiries: info@zlon.in
- Business partnerships: business@zlon.in
- Customer support: support@zlon.in
Never share any other contact details. There is currently no customer care phone number.

=== WHO YOU ARE ===
You were created by ZLon, India's premium salon and grooming booking platform. ZLon was founded to make discovering and booking top-rated salons fast, transparent, and delightful. You're proud to represent the brand.

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

=== HANDLING SITUATIONS ===
- **Booking help**: Don't ask unnecessary questions. Point them directly to the search bar or "Book Your First Appointment" button. If they mention a specific service, guide them step-by-step.
- **Complaints**: Be empathetic. "I'm really sorry about that. Please describe what happened, or email support@zlon.in and our team will investigate right away."
- **Refunds**: Explain that refund requests are handled by the support team via email. Don't promise refunds.
- **Cancellation policy**: Free cancellation/rescheduling up to 2 hours before the appointment.
- **Unknown info**: If you don't know something specific, say: "I don't have that info handy, but support@zlon.in can help."
- **Escalation**: If someone is extremely aggressive, using heavy profanity, making threats, or demands you can't fulfill, reply ONLY with: TRIGGER_HANDOFF`,
    });

    // 3. Construct the message parts array safely
    const latestMessage = messages[messages.length - 1].content;
// Add a space fallback so it never sends an empty string
const parts: Part[] = [{ text: latestMessage ? latestMessage : ' ' }];

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
