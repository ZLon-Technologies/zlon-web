import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Available services in ZLon
const AVAILABLE_SERVICES = [
  { id: 'haircut-classic', name: 'Classic Haircut', category: 'hair', keywords: ['haircut', 'trim', 'cut', 'hair', 'classic', 'regular'] },
  { id: 'haircut-fade', name: 'Fade Haircut', category: 'hair', keywords: ['fade', 'taper', 'skin fade', 'low fade', 'high fade', 'mid fade'] },
  { id: 'haircut-pompadour', name: 'Pompadour Style', category: 'hair', keywords: ['pompadour', 'pompadour style', 'voluminous', 'classic style'] },
  { id: 'beard-trim', name: 'Beard Trim', category: 'beard', keywords: ['beard', 'trim', 'shape', 'cleanup', 'groom'] },
  { id: 'beard-full', name: 'Full Beard Grooming', category: 'beard', keywords: ['full beard', 'beard grooming', 'beard treatment', 'beard care'] },
  { id: 'facial-classic', name: 'Classic Facial', category: 'skin', keywords: ['facial', 'skin', 'cleansing', 'classic facial'] },
  { id: 'facial-deep', name: 'Deep Cleansing Facial', category: 'skin', keywords: ['deep cleansing', 'deep facial', 'pores', 'thorough clean'] },
  { id: 'hair-wash', name: 'Hair Wash & Style', category: 'hair', keywords: ['wash', 'shampoo', 'style', 'blow dry'] },
  { id: 'hair-color', name: 'Hair Coloring', category: 'hair', keywords: ['color', 'dye', 'tint', 'grey coverage', 'highlights'] },
  { id: 'head-massage', name: 'Head Massage', category: 'wellness', keywords: ['massage', 'head massage', 'relaxation', 'scalp'] },
  { id: 'combo-basic', name: 'Haircut + Beard Trim', category: 'combo', keywords: ['combo', 'package', 'haircut and beard', 'full service'] },
  { id: 'combo-premium', name: 'Premium Package', category: 'combo', keywords: ['premium', 'full package', 'haircut facial beard', 'complete'] },
];

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Use Claude to understand the user's intent and match to services
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: `You are a search assistant for ZLon, a barber shop booking app.
Your job is to analyze the user's search query and match it to available services.

Available services (each has id, name, category, and keywords):
${JSON.stringify(AVAILABLE_SERVICES, null, 2)}

Return a JSON array of matching services with:
- id: the service id
- name: the service name
- category: the service category
- confidence: "high" | "medium" | "low" based on how well it matches
- reason: brief explanation of why this matches

Rules:
- Return matches sorted by relevance (best first)
- Include 1-5 services that genuinely match
- If the query is vague, include broader matches with lower confidence
- If no services match, return an empty array
- ONLY return the JSON array, nothing else`,
      messages: [
        {
          role: 'user',
          content: `Find services matching this query: "${query}"`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const searchText = textBlock?.text || '[]';

    // Extract JSON from the response (Claude might wrap it in markdown)
    const jsonMatch = searchText.match(/\[[\s\S]*\]/);
    const results = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ results, query });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
