import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
  }

  const vworldUrl = `https://api.vworld.kr/req/address?service=address&request=getcoord&type=ROAD&address=${encodeURIComponent(address)}&format=json&key=E84467DF-FBF1-38C4-8673-12D7B1E1AFC1`;

  try {
    const response = await fetch(vworldUrl);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ error: 'Failed to geocode address' }, { status: 500 });
  }
}
