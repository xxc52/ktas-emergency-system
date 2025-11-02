import { NextResponse } from 'next/server';

/**
 * VWorld Geocoding API 프록시
 * 주소를 좌표로 변환하는 CORS 우회용 Next.js API Route
 */

const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_API_KEY;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
  }

  console.log(`[Geocode Proxy] ${address}`);

  const vworldUrl = `https://api.vworld.kr/req/address?service=address&request=getcoord&type=ROAD&address=${encodeURIComponent(address)}&format=json&key=${VWORLD_API_KEY}`;

  try {
    const response = await fetch(vworldUrl);
    const data = await response.json();

    console.log(`[Geocode Proxy] ${data.response?.status || 'Unknown'}`);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('[Geocode Proxy] Error:', error.message);
    return NextResponse.json({ error: 'Failed to geocode address' }, { status: 500 });
  }
}

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS(request) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
