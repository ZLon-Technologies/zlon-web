import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  const apiKey = process.env.ZLON_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status !== 'OK') {
      return NextResponse.json({ error: data.error_message || 'Geocoding failed' }, { status: 500 });
    }

    // Extraction logic: Prioritize city, town, or district
    const addressComponents = data.results[0]?.address_components || [];
    
    // Find locality (city), administrative_area_level_2 (district/city), or administrative_area_level_3 (town)
    const locality = addressComponents.find((c: any) => c.types.includes('locality'))?.long_name;
    const district = addressComponents.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name;
    const sublocality = addressComponents.find((c: any) => c.types.includes('sublocality_level_1'))?.long_name;

    const cityOrTown = locality || district || sublocality || 'Unknown Location';

    return NextResponse.json({ city: cityOrTown });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch geocoding data' }, { status: 500 });
  }
}
